// admin-create-free-report — admin-only. Generates a full Love Match report
// for free (no Razorpay). Mirrors the love-match-finalize pipeline from
// "recompute facts" onward: prose (cache/Gemini) -> PDF -> storage -> AiSensy.
// Persists a love_match_orders row with final_price=0 and coupon_code='ADMIN_FREE'.

import { corsHeaders, J, requireAdmin } from "../_shared/admin-auth.ts";
import { scoreMatch, MatchResult } from "../_shared/engine/scorer.ts";

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function cleanName(v: unknown): string {
  return typeof v === "string" ? v.replace(/[<>]/g, "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 60) : "";
}
function cleanPhone(v: unknown): string {
  return typeof v === "string" ? v.replace(/[^\d]/g, "").slice(0, 15) : "";
}
function cleanEmail(v: unknown): string {
  if (typeof v !== "string") return "";
  const s = v.trim().slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : "";
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
function validDob(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split("-").map((n) => parseInt(n, 10));
  if (y < 1900 || y > new Date().getUTCFullYear()) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (dt.getTime() > Date.now()) return null;
  return raw;
}

async function generateProse(facts: unknown, language: string): Promise<Record<string, string>> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("missing_gemini_key");
  const model = "gemini-2.5-flash";
  console.error(`[free-report] gemini_model=${model}`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const system = [
    "You write a numerology Love Match report. You ONLY write prose from the facts given.",
    "You NEVER output a number not present in the facts. You never compute.",
    "Use display numbers; if isMaster, write like '2 (Master 11)'; compound like '19/1' only if it differs.",
    language === "hi"
      ? "Write in casual aam-bolchaal Hindi (Devanagari). Not heavy Sanskrit."
      : "Write in warm, plain English.",
    "Voice: honest, not flattering. No em dashes or en dashes; use commas or full stops.",
    "Return ONE JSON object: {\"sections\":{\"s1\":\"...\",...,\"s13\":\"...\"}} and nothing else.",
  ].join(" ");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(facts) }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
    }),
  });
  const rawText = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[free-report] gemini_http status=${res.status} body=${rawText.slice(0, 500)}`);
    throw new Error(`gemini_http status=${res.status} body=${rawText.slice(0, 500)}`);
  }
  let data: unknown;
  try { data = JSON.parse(rawText); }
  catch {
    console.error(`[free-report] gemini_envelope_parse body=${rawText.slice(0, 500)}`);
    throw new Error(`gemini_envelope_parse body=${rawText.slice(0, 500)}`);
  }
  // deno-lint-ignore no-explicit-any
  let text = (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    console.error(`[free-report] gemini_empty_candidates body=${rawText.slice(0, 300)}`);
    throw new Error(`gemini_empty_candidates body=${rawText.slice(0, 300)}`);
  }
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(text); }
  catch {
    console.error(`[free-report] gemini_content_parse body=${text.slice(0, 500)}`);
    throw new Error(`gemini_content_parse body=${text.slice(0, 500)}`);
  }
  return (parsed.sections as Record<string, string>) ?? (parsed as Record<string, string>);
}
function validateNoInventedNumbers(sections: Record<string, string>, allowed: Set<string>): string | null {
  const prose = Object.values(sections).join(" ");
  const nums = prose.match(/\d+/g) ?? [];
  for (const n of nums) {
    if (allowed.has(n)) continue;
    if (/^(19|20)\d\d$/.test(n)) continue;
    if (n.length >= 4) continue;
    return n;
  }
  return null;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const supabase = auth.admin;

  try {
    const body = await req.json().catch(() => ({}));
    const aFirst = cleanName(body?.person_a?.first);
    const aLast = cleanName(body?.person_a?.last);
    const aDob = validDob(body?.person_a?.dob);
    const phone = cleanPhone(body?.person_a?.phone);
    const email = cleanEmail(body?.person_a?.email ?? body?.recipient_email);
    const bFirst = cleanName(body?.person_b?.first);
    const bLast = cleanName(body?.person_b?.last);
    const bDob = validDob(body?.person_b?.dob);
    const language = body.language === "hi" ? "hi" : "en";
    const sendEmail = body.send_email !== false;

    if (!aFirst || !aDob) return new Response(JSON.stringify({ error: "person_a invalid" }), { status: 422, headers: J });
    if (!bFirst || !bDob) return new Response(JSON.stringify({ error: "person_b invalid" }), { status: 422, headers: J });
    if (sendEmail && !email) return new Response(JSON.stringify({ error: "recipient email required" }), { status: 422, headers: J });

    const orderId = crypto.randomUUID();
    const refYear = new Date().getUTCFullYear();

    const { error: insErr } = await supabase.from("love_match_orders").insert({
      order_id: orderId,
      person_a: { first: aFirst, last: aLast, dob: aDob, phone, email },
      person_b: { first: bFirst, last: bLast, dob: bDob },
      language, ref_year: refYear, status: "paid",
      final_price: 0,
      discount_applied: 0,
      coupon_code: "ADMIN_FREE",
    });
    if (insErr) return new Response(JSON.stringify({ error: "order create failed: " + insErr.message }), { status: 500, headers: J });

    // Kick off the long pipeline in the background so the client isn't waiting
    // on Gemini + Browserless (30–90s). UI polls love_match_orders by order_id.
    const runPipeline = async () => {
      const markFail = async (reason: string) => {
        await supabase.from("love_match_orders")
          .update({ status: "failed", failure_reason: reason }).eq("order_id", orderId);
      };
      try {
        const result = scoreMatch(aFirst, aLast, aDob, bFirst, bLast, bDob, refYear);
        const facts = {
          language, score: result.score, band: result.band, shared: result.shared,
          person_a: result.a, person_b: result.b, breakdown: result.breakdown,
        };

        // Prose cache.
        const proseKey = await sha256(`prose:v1:${language}:${JSON.stringify(facts)}`);
        let sections: Record<string, string> | null = null;
        const { data: cachedProse } = await supabase
          .from("love_match_prose_cache").select("sections").eq("prose_key", proseKey).maybeSingle();
        if (cachedProse?.sections) sections = cachedProse.sections as Record<string, string>;

        if (!sections) {
          const allowed = allowedNumberSet(result);
          for (let attempt = 0; attempt < 2 && !sections; attempt++) {
            try {
              const out = await generateProse(facts, language);
              if (validateNoInventedNumbers(out, allowed)) {
                sections = out;
              } else {
                console.error(`[free-report] gemini_validate_failed attempt=${attempt + 1} preview=${Object.values(out).join(" ").slice(0, 300)}`);
              }
            } catch (_) { /* retry */ }
          }
          if (!sections) { await markFail("generation_failed"); return; }
          await supabase.from("love_match_prose_cache").upsert({ prose_key: proseKey, sections });
        }

        // PDF via Browserless.
        const printBase = Deno.env.get("LOVE_MATCH_PRINT_URL");
        const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
        if (!printBase || !browserlessKey) { await markFail("pdf_config"); return; }
        const dataPayload = b64url(new TextEncoder().encode(JSON.stringify({ facts, sections })));
        const printUrl = `${printBase}?print=1#data=${dataPayload}`;
        const pdfRes = await fetch(
          `https://production-sfo.browserless.io/pdf?token=${browserlessKey}&timeout=60000`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: printUrl, options: { printBackground: true, format: "A4" } }),
          },
        );
        if (!pdfRes.ok) {
          await markFail("pdf_failed");
          return;
        }
        const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());
        if (pdfBytes.length < 10240) { await markFail("pdf_too_small"); return; }

        const path = `love-match/${orderId}.pdf`;
        await supabase.storage.from("love-match-pdfs")
          .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
        const { data: signed } = await supabase.storage
          .from("love-match-pdfs").createSignedUrl(path, 60 * 60 * 24 * 30);
        const pdfUrl = signed?.signedUrl ?? null;

        // Resend email delivery (optional).
        let delivered = false;
        if (sendEmail) {
          try {
            const resendKey = Deno.env.get("RESEND_API_KEY");
            if (resendKey && email && pdfUrl) {
              const rres = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: "TalkToGuruji <alerts@update.talktoguruji.com>",
                  to: [email],
                  subject: "Your Love Match Report is ready — TalkToGuruji",
                  html: buildReportEmailHtml(aFirst, pdfUrl),
                }),
              });
              delivered = rres.ok;
            }
          } catch (_) { /* non-fatal */ }
        }

        await supabase.from("love_match_orders")
          .update({ status: "delivered", pdf_url: pdfUrl, whatsapp_sent: delivered })
          .eq("order_id", orderId);
      } catch (err) {
        await markFail(err instanceof Error ? err.message.slice(0, 200) : "internal");
      }
    };

    // deno-lint-ignore no-explicit-any
    const runtime = (globalThis as any).EdgeRuntime;
    if (runtime?.waitUntil) {
      runtime.waitUntil(runPipeline());
    } else {
      // Local/dev fallback: run without awaiting.
      runPipeline();
    }

    return new Response(JSON.stringify({ order_id: orderId, status: "processing" }), { headers: J, status: 202 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "internal" }), { status: 500, headers: J });
  }
});

