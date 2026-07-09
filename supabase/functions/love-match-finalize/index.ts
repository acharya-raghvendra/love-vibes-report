// love-match-finalize — paid path. Triggered by Razorpay webhook.
// Verify signature -> recompute facts -> prose cache -> Gemini -> validate
// -> Browserless PDF -> storage (30d) -> AiSensy.
//
// Attacker-reading assumptions: signature verified before ANY work,
// constant-time compare, no secret logging, no client-number trust,
// generic errors only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { scoreMatch, MatchResult } from "../_shared/engine/scorer.ts";
import { buildReportHtml } from "../_shared/buildReportHtml.ts";
import { buildSystemPrompt } from "../_shared/prosePrompt.ts";


const JSON_HEADERS = { "Content-Type": "application/json" };

function ok(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

// ---- Constant-time hex compare ----
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---- URL-safe base64 (matches gateway) ----
function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---- Gemini prose (structured v2, strict JSON) ----
function collectStrings(v: unknown, out: string[]): void {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) collectStrings(x, out);
  else if (v && typeof v === "object") for (const x of Object.values(v)) collectStrings(x, out);
}

function validateNoInventedNumbers(sections: unknown, allowed: Set<string>): boolean {
  const strs: string[] = [];
  collectStrings(sections, strs);
  const prose = strs.join(" ");
  const nums = prose.match(/\d+/g) ?? [];
  for (const n of nums) {
    if (allowed.has(n)) continue;
    if (/^(19|20)\d\d$/.test(n)) continue; // years
    if (n.length >= 4) continue;           // dates/large numbers
    return false;
  }
  return true;
}

async function generateProse(
  facts: { names?: { a?: string; b?: string }; language?: string },
  language: string,
): Promise<Record<string, unknown>> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("gemini_missing_key");
  const model = "gemini-2.5-flash";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const A = facts.names?.a || "Person A";
  const B = facts.names?.b || "Person B";
  const system = buildSystemPrompt(A, B, language);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(facts) }] }],
      generationConfig: {
        temperature: 0.55,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gemini_http status=${res.status} body=${body.slice(0, 500)}`);
  }
  const data = await res.json();
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(text);
  return parsed.sections ?? parsed;
}


function allowedNumberSet(r: MatchResult): Set<string> {
  const s = new Set<string>();
  s.add(String(r.score));
  const add = (cn: typeof r.a) => {
    for (const k of ["lifePath", "destiny", "soulUrge", "personality", "maturity"] as const) {
      s.add(String(cn[k].display));
      s.add(String(cn[k].compound));
      s.add(String(cn[k].score));
    }
    s.add(String(cn.personalYear));
  };
  add(r.a); add(r.b);
  for (let i = 1; i <= 9; i++) s.add(String(i));
  s.add("11"); s.add("22"); s.add("33");
  return s;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildReportEmailHtml(firstName: string, pdfUrl: string): string {
  const name = escapeHtml(firstName || "there");
  const url = escapeHtml(pdfUrl);
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1c1b1f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#1c1b1f;">Your Love Match Report is ready</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b3b3b;">Namaste ${name},</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3b3b3b;">Your personalised Love Match numerology report has been generated. Tap the button below to download your PDF.</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${url}" style="display:inline-block;background:#b23a48;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px;">Download Your Report</a>
          </p>
          <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#6b6b6b;">This download link is valid for <strong>30 days</strong>. Please save the PDF to your device for long-term access.</p>
          <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#3b3b3b;">With blessings,<br/><strong>Acharya Raghvendra Singh</strong><br/>TalkToGuruji</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // 1+2. Verify Razorpay webhook signature BEFORE any work.
    const raw = await req.text();
    const sigHeader = req.headers.get("x-razorpay-signature") ?? "";
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) return ok({ error: "config" }, 500);
    const expected = await hmacSha256Hex(secret, raw);
    if (!timingSafeEqual(expected, sigHeader)) return ok({ error: "invalid_signature" }, 401);

    const event = JSON.parse(raw);
    if (event?.event !== "payment.captured") return ok({ ignored: true }, 200);

    // Order details are pulled from OUR order record, never from the webhook body,
    // so a forged (but wrongly-signed) body cannot inject inputs. Signature already
    // guarantees authenticity; we still read inputs from our DB by order id.
    const orderId = event?.payload?.payment?.entity?.notes?.order_id;
    if (!orderId) return ok({ error: "no_order" }, 400);

    const { data: order } = await supabase
      .from("love_match_orders")
      .select("person_a, person_b, language, ref_year, status, coupon_code")
      .eq("order_id", orderId).maybeSingle();
    if (!order) return ok({ error: "unknown_order" }, 404);
    if (order.status === "delivered") return ok({ already: true }, 200); // idempotent

    // Mark paid as soon as we have an authentic, matched order.
    const markFail = async (reason: string, status = 502) => {
      await supabase.from("love_match_orders")
        .update({ status: "failed", failure_reason: reason }).eq("order_id", orderId);
      return ok({ error: reason }, status);
    };
    await supabase.from("love_match_orders").update({ status: "paid" }).eq("order_id", orderId);

    // 3. Recompute facts server-side (never trust stored numbers).
    const a = order.person_a, b = order.person_b;
    const refYear = order.ref_year ?? new Date().getUTCFullYear();
    const result = scoreMatch(a.first, a.last, a.dob, b.first, b.last, b.dob, refYear);

    const PLANETS: Record<number, string> = {
      1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
      6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
    };
    const relationLabel = (points: number): string => {
      if (points >= 100) return "harmonious";
      if (points >= 75) return "friendly";
      if (points >= 50) return "neutral";
      if (points >= 35) return "strained";
      return "clashing";
    };
    const pairLabel = (k: string): string =>
      k === "lifePath" ? "Life Path" : k === "soulUrge" ? "Soul Urge"
      : k === "personality" ? "Personality" : "Destiny";
    const chemistry = result.breakdown.map((p) => ({
      pair: pairLabel(p.key),
      a_planet: PLANETS[p.aScore] ?? "",
      b_planet: PLANETS[p.bScore] ?? "",
      relation: relationLabel(p.points),
    }));

    const facts = {
      language: order.language,
      score: result.score, band: result.band, shared: result.shared,
      person_a: result.a, person_b: result.b, chemistry,
      names: { a: a.first, b: b.first },
    };

    // 4. Prose cache.
    const proseKey = await sha256(`prose:v3:${order.language}:${JSON.stringify(facts)}`);
    let sections: Record<string, unknown> | null = null;
    const { data: cachedProse } = await supabase
      .from("love_match_prose_cache").select("sections").eq("prose_key", proseKey).maybeSingle();
    if (cachedProse?.sections) sections = cachedProse.sections;

    // 5+6. Gemini + validate (retry once on parse/validation failure).
    if (!sections) {
      const allowed = allowedNumberSet(result);
      for (let attempt = 0; attempt < 2 && !sections; attempt++) {
        try {
          const out = await generateProse(facts, order.language);
          if (validateNoInventedNumbers(out, allowed)) sections = out;
        } catch (_) { /* retry */ }
      }
      if (!sections) return await markFail("generation_failed");
      await supabase.from("love_match_prose_cache").upsert({ prose_key: proseKey, sections });
    }

    // 7. Browserless PDF — server-rendered HTML (Option 3).
    const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
    if (!browserlessKey) return await markFail("pdf_config");
    const pdfFacts = {
      language: order.language,
      score: result.score, band: result.band, shared: result.shared,
      person_a: result.a, person_b: result.b,
      names: { a: a.first, b: b.first },
      chemistry,
    };
    const html = buildReportHtml(pdfFacts, sections);

    const pdfRes = await fetch(
      `https://production-sfo.browserless.io/pdf?token=${browserlessKey}&timeout=60000`,
      {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ html, options: { printBackground: true, format: "A4" } }),
      },
    );
    if (!pdfRes.ok) return await markFail("pdf_failed");
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());
    if (pdfBytes.length < 10240) return await markFail("pdf_too_small"); // guard error pages

    const path = `love-match/${orderId}.pdf`;
    await supabase.storage.from("love-match-pdfs")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
    const { data: signed } = await supabase.storage
      .from("love-match-pdfs").createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
    const pdfUrl = signed?.signedUrl ?? null;

    // 8. Resend email delivery (best-effort; delivered flag tracked on order).
    let delivered = false;
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const toEmail = order.person_a?.email ?? null;
      if (resendKey && toEmail && pdfUrl) {
        const rres = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "TalkToGuruji <alerts@update.talktoguruji.com>",
            to: [toEmail],
            subject: "Your Love Match Report is ready — TalkToGuruji",
            html: buildReportEmailHtml(order.person_a?.first ?? "", pdfUrl),
          }),
        });
        delivered = rres.ok;
      }
    } catch (_) { /* non-fatal; URL still stored */ }

    await supabase.from("love_match_orders")
      .update({ status: "delivered", pdf_url: pdfUrl, whatsapp_sent: delivered })
      .eq("order_id", orderId);

    // Bump coupon usage_count post-delivery (non-fatal). The status-guard above
    // makes redelivery idempotent, so this never double-counts.
    if (order.coupon_code) {
      try {
        await supabase.rpc("increment_coupon_usage", { _code: order.coupon_code });
      } catch (_) { /* non-fatal */ }
    }

    return ok({ order_id: orderId, status: "delivered", pdf_url: pdfUrl, whatsapp_sent: delivered });
  } catch (_err) {
    return ok({ error: "internal" }, 500);
  }
});
