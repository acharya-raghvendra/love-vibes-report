// admin-create-free-report — admin-only. Generates a full Love Match report
// for free (no Razorpay). Mirrors the love-match-finalize pipeline from
// "recompute facts" onward: prose (cache/Gemini) -> PDF -> storage -> AiSensy.
// Persists a love_match_orders row with final_price=0 and coupon_code='ADMIN_FREE'.

import { corsHeaders, J, requireAdmin } from "../_shared/admin-auth.ts";
import { scoreMatch, MatchResult } from "../_shared/engine/scorer.ts";
import { buildReportHtml } from "../_shared/buildReportHtml.ts";

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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  // deno-lint-ignore no-explicit-any
  const A = (facts as any)?.names?.a || "Person A";
  // deno-lint-ignore no-explicit-any
  const B = (facts as any)?.names?.b || "Person B";
  const system = [
    `You are writing a numerology Love Match report for ${A} and ${B}.`,
    `ALWAYS use their real names, ${A} and ${B}. NEVER write "Person A" or "Person B".`,
    "You ONLY write prose from the facts given. You NEVER output a number not present in the facts. You never compute.",
    "Do NOT mention raw points, weights, percentages, or scoring math. Do not say things like 'contributes X points' or 'weight of 0.3'.",
    "For the Chemistry section, describe planet pairings using the provided planet names and relation label, for example 'Sun and Moon are friendly'. Do not invent numeric point values for pairings.",
    "Use display numbers. If isMaster, write like '2 (Master 11)'. Show compound like '19/1' only when it differs from the display number.",
    "Voice: honest, not flattering. Warm but real. Where the pairing is strong say so clearly, where it needs work say that plainly.",
    "No em dashes or en dashes. Use commas or full stops.",
    language === "hi"
      ? "Write in casual aam-bolchaal Hindi (Devanagari), not heavy Sanskrit."
      : "Write in warm, plain English.",
    `Each section must be 3 to 5 sentences. Cover both ${A} and ${B} and how they interact day to day. Never write a single generic line.`,
    "Write EXACTLY these 13 sections. Each section's content MUST match its topic below. Do not let content drift to the wrong section:",
    `s1: Overall compatibility. State the score and band, and what it means for ${A} and ${B} as a couple. Honest framing.`,
    `s2: Their core numbers side by side, and what any shared numbers mean for them.`,
    `s3: Life Path. How ${A} and ${B} each move through life, and where they align or clash.`,
    `s4: Soul Urge. How ${A} and ${B} each love, and what each needs emotionally.`,
    `s5: Chemistry and attraction. Use the planet pairings and relation labels provided to describe the pull between them.`,
    `s6: Intimacy and closeness. How ${A} and ${B} connect closely, drawn from their Soul Urge.`,
    `s7: Personality. How ${A} and ${B} each come across to the other in daily life.`,
    `s8: Conflict and repair. How they argue and how they can recover, drawn from Life Path and Personality.`,
    `s9: Maturity. How ${A} and ${B} each grow with age, and whether they grow toward each other or apart.`,
    `s10: Personal Year timing. The phase ${A} and ${B} are each in right now.`,
    `s11: At a glance. Their strengths as a couple and what to watch.`,
    `s12: What you can do. Practical advice drawn from their specific numbers.`,
    `s13: One honest closing note to ${A} and ${B}.`,
    'Return ONE JSON object: {"sections":{"s1":"...","s2":"...","s3":"...","s4":"...","s5":"...","s6":"...","s7":"...","s8":"...","s9":"...","s10":"...","s11":"...","s12":"...","s13":"..."}} and nothing else.',
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
  if (!res.ok) throw new Error(`gemini_http status=${res.status} body=${rawText.slice(0, 300)}`);
  let data: unknown;
  try { data = JSON.parse(rawText); }
  catch { throw new Error(`gemini_envelope_parse body=${rawText.slice(0, 300)}`); }
  // deno-lint-ignore no-explicit-any
  let text = (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error(`gemini_empty_candidates body=${rawText.slice(0, 300)}`);
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(text); }
  catch { throw new Error(`gemini_content_parse body=${text.slice(0, 300)}`); }
  return (parsed.sections as Record<string, string>) ?? (parsed as Record<string, string>);
}
function validateNoInventedNumbers(sections: Record<string, string>, allowed: Set<string>): boolean {
  const prose = Object.values(sections).join(" ");
  const nums = prose.match(/\d+/g) ?? [];
  for (const n of nums) {
    if (allowed.has(n)) continue;
    if (/^(19|20)\d\d$/.test(n)) continue;
    if (n.length >= 4) continue;
    return false;
  }
  return true;
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
          person_a: result.a, person_b: result.b,
          names: { a: aFirst, b: bFirst },
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
              if (validateNoInventedNumbers(out, allowed)) sections = out;
            } catch (_) { /* retry */ }
          }
          if (!sections) { await markFail("generation_failed"); return; }
          await supabase.from("love_match_prose_cache").upsert({ prose_key: proseKey, sections });
        }

        // PDF via Browserless — server-rendered HTML (Option 3).
        const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
        if (!browserlessKey) { await markFail("pdf_config"); return; }

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

        const pdfFacts = {
          language, score: result.score, band: result.band, shared: result.shared,
          person_a: result.a, person_b: result.b,
          names: { a: aFirst, b: bFirst },
          chemistry,
        };
        const html = buildReportHtml(pdfFacts, sections);

        const pdfRes = await fetch(
          `https://production-sfo.browserless.io/pdf?token=${browserlessKey}&timeout=60000`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html, options: { printBackground: true, format: "A4" } }),
          },
        );
        if (!pdfRes.ok) {
          const errBody = await pdfRes.text().catch(() => "");
          console.error(`[free-report] browserless_http status=${pdfRes.status} body=${errBody.slice(0, 500)}`);
          await markFail("pdf_failed");
          return;
        }
        const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());
        if (pdfBytes.length < 10240) {
          console.error(`[free-report] browserless_pdf_too_small bytes=${pdfBytes.length}`);
          await markFail("pdf_too_small");
          return;
        }

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

