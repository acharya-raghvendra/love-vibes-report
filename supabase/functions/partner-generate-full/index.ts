// partner-generate-full — stateless branded Love Match PDF for partner API.
// Gated by shared-secret header (x-partner-secret). Does NOT write to
// love_match_orders. Does NOT send email. Reuses prose cache (brand-agnostic
// key) so partner + consumer traffic warm the same cache.
//
// verify_jwt = false (see supabase/config.toml). Auth is the shared secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { scoreMatch } from "../_shared/engine/scorer.ts";
import { buildReportHtml } from "../_shared/buildReportHtml.ts";
import {
  allowedNumberSet,
  buildProseKey,
  generateProse,
  validateNoInventedNumbers,
} from "../_shared/prose.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

function ok(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

Deno.serve(async (req: Request) => {
  try {
    // Auth: verify_jwt=true in config.toml — Supabase gateway validates the
    // caller's anon Bearer before this handler runs. No extra check here.

    // 1. Parse + validate body.
    const body = await req.json().catch(() => ({}));
    const a = body?.person_a ?? {};
    const b = body?.person_b ?? {};
    const aFirst = typeof a.first === "string" ? a.first.trim() : "";
    const aLast = typeof a.last === "string" ? a.last.trim() : "";
    const aDob = typeof a.dob === "string" ? a.dob.trim() : "";
    const bFirst = typeof b.first === "string" ? b.first.trim() : "";
    const bLast = typeof b.last === "string" ? b.last.trim() : "";
    const bDob = typeof b.dob === "string" ? b.dob.trim() : "";
    if (!aFirst || !aDob || !bFirst || !bDob) {
      return ok({ error: "invalid_input" }, 400);
    }
    const language: "en" | "hi" = body?.language === "hi" ? "hi" : "en";
    const branding = body?.branding ?? {};
    const showUpsell = body?.show_upsell === true;
    const orderId: string = typeof body?.order_id === "string" && body.order_id.trim()
      ? body.order_id.trim()
      : crypto.randomUUID();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 3. Score + chemistry — copied verbatim from love-match-finalize.
    const refYear = new Date().getUTCFullYear();
    const result = scoreMatch(aFirst, aLast, aDob, bFirst, bLast, bDob, refYear);

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

    // 4. Prose cache. Key must EXCLUDE chemistry so it matches finalize.
    const keyFacts = {
      language,
      score: result.score,
      band: result.band,
      shared: result.shared,
      person_a: result.a,
      person_b: result.b,
      names: { a: aFirst, b: bFirst },
    };
    const proseKey = await buildProseKey(language, keyFacts);

    let sections: Record<string, unknown> | null = null;
    const { data: cachedProse } = await supabase
      .from("love_match_prose_cache").select("sections").eq("prose_key", proseKey).maybeSingle();
    if (cachedProse?.sections) sections = cachedProse.sections as Record<string, unknown>;

    if (!sections) {
      const allowed = allowedNumberSet(result);
      for (let attempt = 0; attempt < 2 && !sections; attempt++) {
        try {
          const out = await generateProse(keyFacts, language);
          if (validateNoInventedNumbers(out, allowed)) sections = out;
        } catch (err) {
          console.error("[partner] generateProse failed:", err instanceof Error ? err.message : err);
        }
      }
      if (!sections) return ok({ status: "failed", error: { code: "GENERATION_FAILED" } }, 500);
      await supabase.from("love_match_prose_cache").upsert({ prose_key: proseKey, sections });
    }

    // 5. HTML — branded, upsell gated.
    const pdfFacts = { ...keyFacts, chemistry };
    const html = buildReportHtml(pdfFacts, sections, {
      logoUrl: typeof branding.logo_url === "string" ? branding.logo_url : undefined,
      footerText: typeof branding.footer_text === "string" ? branding.footer_text : undefined,
      companyName: typeof branding.company_name === "string" ? branding.company_name : undefined,
      showUpsell,
    });

    // 6. Browserless PDF — same call as love-match-finalize (timeout=60000).
    const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
    const hasBranding = !!body?.branding;
    console.log(
      `[partner] browserless_key_len=${browserlessKey?.length ?? 0} has_branding=${hasBranding}`,
    );
    if (!browserlessKey) {
      console.error("[partner] BROWSERLESS_API_KEY missing");
      return ok({ status: "failed", error: { code: "GENERATION_FAILED" } }, 500);
    }
    const browserlessUrl =
      `https://production-sfo.browserless.io/pdf?token=${browserlessKey}&timeout=60000`;
    const pdfRes = await fetch(browserlessUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ html, options: { printBackground: true, format: "A4" } }),
    });
    if (!pdfRes.ok) {
      const errBody = await pdfRes.text().catch(() => "");
      const last4 = browserlessKey.slice(-4);
      const maskedUrl = browserlessUrl.replace(
        `token=${browserlessKey}`,
        `token=***${last4}`,
      );
      console.error(
        `[partner] browserless_http status=${pdfRes.status} has_branding=${hasBranding} url=${maskedUrl} body=${errBody.slice(0, 500)}`,
      );
      return ok({ status: "failed", error: { code: "GENERATION_FAILED" } }, 500);
    }

    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());
    if (pdfBytes.length < 10240) {
      console.error(`[partner] browserless_pdf_too_small bytes=${pdfBytes.length}`);
      return ok({ status: "failed", error: { code: "GENERATION_FAILED" } }, 500);
    }

    // 7. Storage upload + 30-day signed URL under partner/ prefix.
    const path = `love-match/partner/${orderId}.pdf`;
    const { error: upErr } = await supabase.storage.from("love-match-pdfs")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) {
      console.error("[partner] storage upload failed:", upErr.message);
      return ok({ status: "failed", error: { code: "GENERATION_FAILED" } }, 500);
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("love-match-pdfs").createSignedUrl(path, 60 * 60 * 24 * 30);
    if (signErr || !signed?.signedUrl) {
      console.error("[partner] sign failed:", signErr?.message);
      return ok({ status: "failed", error: { code: "GENERATION_FAILED" } }, 500);
    }

    return ok({
      order_id: orderId,
      status: "completed",
      pdf_url: signed.signedUrl,
      pdf_expires_in: "30 days",
    });
  } catch (err) {
    console.error("[partner] internal:", err instanceof Error ? err.stack ?? err.message : err);
    return ok({ status: "failed", error: { code: "GENERATION_FAILED" } }, 500);
  }
});
