// Shared report-generation pipeline for paid Love Match orders.
//
// Single source of truth used by:
//   - love-match-finalize      (Razorpay webhook)
//   - reconcile-love-match     (safety net / stale-timeout sweeper)
//   - retry-love-match         (public retry for failed paid orders)
//   - admin-retry-delivery     (admin retry)
//
// State machine written on love_match_orders.status:
//   created -> paid -> generating -> ready -> delivered
//                          \-> failed (with error_message)
//
// Idempotency is keyed on order_id: claimOrder() performs a conditional
// UPDATE, so a webhook retry or a double-fire can never run twice.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { scoreMatch } from "./engine/scorer.ts";
import { buildReportHtml } from "./buildReportHtml.ts";
import { sha256, generateProse } from "./prose.ts";
import {
  buildCoreClaims,
  correctCoreNumbers,
  correctiveInstruction,
  describeMismatches,
  verifyCoreNumbers,
} from "./numberGuard.ts";


export const GENERATION_TIMEOUT_MS = 6 * 60 * 1000; // stale `generating` cutoff
export const MAX_ATTEMPTS = 3;

const JSON_HEADERS = { "Content-Type": "application/json" };

const HUMAN_ERRORS: Record<string, string> = {
  generation_failed: "We couldn't compose your report text. Please retry.",
  gemini_truncated: "The report text came back incomplete. Please retry.",
  gemini_overloaded: "Our report writer is busy right now. Please retry in a minute.",
  gemini_config: "Report text service is not configured. Our team has been notified.",
  pdf_config: "Report PDF service is not configured. Our team has been notified.",
  pdf_failed: "We couldn't render your report PDF. Please retry.",
  pdf_too_small: "The generated PDF looked invalid. Please retry.",
  storage_failed: "We couldn't save your report file. Please retry.",
  bad_order_data: "Your order details were incomplete. Please contact support.",
  generation_timeout: "Report generation took too long and was stopped. Please retry.",
  internal: "Something went wrong while generating your report. Please retry.",
};


export function humanError(reason: string): string {
  return HUMAN_ERRORS[reason] ?? HUMAN_ERRORS.internal;
}

export type ClaimResult =
  | { claimed: true }
  | { claimed: false; reason: "not_found" | "already_done" | "in_progress" | "max_attempts" };

/**
 * Atomically move an order into `generating`. Only rows in a
 * re-runnable state are claimable, so concurrent invocations for the
 * same order_id produce exactly one generation run.
 */
export async function claimOrder(
  supabase: SupabaseClient,
  orderId: string,
  opts: { allowStale?: boolean; force?: boolean } = {},
): Promise<ClaimResult> {
  const { data: order } = await supabase
    .from("love_match_orders")
    .select("status, attempt_count, generation_started_at")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!order) return { claimed: false, reason: "not_found" };
  if (order.status === "delivered" || order.status === "ready") {
    return { claimed: false, reason: "already_done" };
  }
  if (!opts.force && (order.attempt_count ?? 0) >= MAX_ATTEMPTS) {
    return { claimed: false, reason: "max_attempts" };
  }

  const claimable = ["created", "paid", "failed"];
  if (order.status === "generating") {
    const startedAt = order.generation_started_at
      ? new Date(order.generation_started_at).getTime()
      : 0;
    const stale = Date.now() - startedAt > GENERATION_TIMEOUT_MS;
    if (!(stale || opts.allowStale || opts.force)) {
      return { claimed: false, reason: "in_progress" };
    }
    claimable.push("generating");
  }

  const { data: claimed } = await supabase
    .from("love_match_orders")
    .update({
      status: "generating",
      generation_started_at: new Date().toISOString(),
      error_message: null,
      failure_reason: null,
      attempt_count: (order.attempt_count ?? 0) + 1,
    })
    .eq("order_id", orderId)
    .in("status", claimable)
    .select("order_id");

  if (!claimed || claimed.length === 0) return { claimed: false, reason: "in_progress" };
  return { claimed: true };
}

export async function markFailed(
  supabase: SupabaseClient,
  orderId: string,
  reason: string,
  detail?: string,
): Promise<void> {
  await supabase
    .from("love_match_orders")
    .update({
      status: "failed",
      failure_reason: reason,
      error_message: humanError(reason),
      error_detail: detail ? detail.slice(0, 2000) : null,
    })
    .eq("order_id", orderId);
}

/** Admin-only technical note; never surfaced through the public status API. */
export async function noteDetail(
  supabase: SupabaseClient,
  orderId: string,
  detail: string,
): Promise<void> {
  await supabase
    .from("love_match_orders")
    .update({ error_detail: detail.slice(0, 2000) })
    .eq("order_id", orderId);
}


/** Flip stale `generating` rows to `failed` so nothing hangs forever. */
export async function expireStaleGenerating(supabase: SupabaseClient): Promise<string[]> {
  const cutoff = new Date(Date.now() - GENERATION_TIMEOUT_MS).toISOString();
  const { data } = await supabase
    .from("love_match_orders")
    .update({
      status: "failed",
      failure_reason: "generation_timeout",
      error_message: humanError("generation_timeout"),
    })
    .eq("status", "generating")
    .lt("generation_started_at", cutoff)
    .select("order_id");
  return (data ?? []).map((r: { order_id: string }) => r.order_id);
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

/**
 * Resend delivery with its own retry policy.
 * Retries 429 + 5xx (honouring Retry-After) up to 4 attempts with exponential
 * backoff + jitter. Any other 4xx is permanent and is NOT retried.
 * Never throws — returns whether the mail went out plus an admin-only detail.
 */
export async function deliverEmail(args: {
  to: string | null;
  firstName: string;
  pdfUrl: string;
  orderId: string;
}): Promise<{ sent: boolean; detail: string | null }> {
  const { to, firstName, pdfUrl, orderId } = args;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return { sent: false, detail: "type=email_error stage=email resend_key_missing" };
  if (!to) return { sent: false, detail: "type=email_error stage=email no_recipient_email" };

  const MAX_ATTEMPTS = 4;
  let lastDetail = "type=email_error stage=email unknown";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "TalkToGuruji <alerts@update.talktoguruji.com>",
          to: [to],
          subject: "Your Love Match Report is ready — TalkToGuruji",
          html: buildReportEmailHtml(firstName, pdfUrl),
        }),
      });
    } catch (err) {
      // Network-level error: treat as transient.
      lastDetail = `type=email_error stage=email network attempt=${attempt} ${
        err instanceof Error ? err.message.slice(0, 200) : "fetch_failed"
      }`;
      console.error(`[generate] order=${orderId} resend ${lastDetail}`);
      if (attempt === MAX_ATTEMPTS) break;
      await sleepBackoff(attempt, null);
      continue;
    }

    if (res.ok) return { sent: true, detail: null };

    const bodyText = (await res.text().catch(() => "")).slice(0, 300);
    const transient = res.status === 429 || res.status >= 500;
    lastDetail = `type=email_error stage=email status=${res.status} attempt=${attempt} ${bodyText}`;
    console.error(`[generate] order=${orderId} resend ${lastDetail}`);

    if (!transient) return { sent: false, detail: lastDetail };
    if (attempt === MAX_ATTEMPTS) break;
    await sleepBackoff(attempt, res.headers.get("Retry-After"));
  }

  return { sent: false, detail: lastDetail };
}

async function sleepBackoff(attempt: number, retryAfter: string | null): Promise<void> {
  let waitMs: number;
  const parsed = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    waitMs = Math.min(parsed * 1000, 30_000);
  } else {
    waitMs = Math.min(500 * 2 ** (attempt - 1), 8_000) + Math.floor(Math.random() * 400);
  }
  await new Promise((r) => setTimeout(r, waitMs));
}


const PLANETS: Record<number, string> = {
  1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
};

function relationLabel(points: number): string {
  if (points >= 100) return "harmonious";
  if (points >= 75) return "friendly";
  if (points >= 50) return "neutral";
  if (points >= 35) return "strained";
  return "clashing";
}

function pairLabel(k: string): string {
  return k === "lifePath" ? "Life Path"
    : k === "soulUrge" ? "Soul Urge"
    : k === "personality" ? "Personality"
    : "Destiny";
}

export type GenerationOutcome =
  | { ok: true; status: "ready" | "delivered"; pdf_url: string | null; delivered: boolean }
  | { ok: false; reason: string };

/**
 * Runs the full pipeline for an order ALREADY claimed into `generating`.
 * Any failure sets status=failed + error_message — the row never stays
 * in `generating` when this function returns.
 */
export async function runGeneration(
  supabase: SupabaseClient,
  orderId: string,
): Promise<GenerationOutcome> {
  const fail = async (reason: string, detail?: string): Promise<GenerationOutcome> => {
    console.error(`[generate] order=${orderId} failed reason=${reason} detail=${detail ?? ""}`);
    await markFailed(supabase, orderId, reason, detail);
    return { ok: false, reason };
  };


  try {
    const { data: order } = await supabase
      .from("love_match_orders")
      .select("person_a, person_b, language, ref_year, coupon_code")
      .eq("order_id", orderId)
      .maybeSingle();
    if (!order) return await fail("bad_order_data", "type=bad_order_data stage=load order row missing");

    const a = order.person_a, b = order.person_b;
    if (!a?.first || !a?.dob || !b?.first || !b?.dob) {
      return await fail("bad_order_data", "type=bad_order_data stage=load missing name or dob");
    }


    const language = order.language ?? "en";
    const refYear = order.ref_year ?? new Date().getUTCFullYear();
    const result = scoreMatch(a.first, a.last, a.dob, b.first, b.last, b.dob, refYear);

    const chemistry = result.breakdown.map((p) => ({
      pair: pairLabel(p.key),
      a_planet: PLANETS[p.aScore] ?? "",
      b_planet: PLANETS[p.bScore] ?? "",
      relation: relationLabel(p.points),
    }));

    const facts = {
      language,
      score: result.score, band: result.band, shared: result.shared,
      person_a: result.a, person_b: result.b, chemistry,
      names: { a: a.first, b: b.first },
    };

    // Prose cache (unchanged key shape so existing cache entries still hit).
    const proseKey = await sha256(`prose:v3:${language}:${JSON.stringify(facts)}`);
    let sections: Record<string, unknown> | null = null;
    const { data: cachedProse } = await supabase
      .from("love_match_prose_cache").select("sections").eq("prose_key", proseKey).maybeSingle();
    if (cachedProse?.sections) sections = cachedProse.sections;

    let guardNote: string | null = null;
    if (!sections) {
      const claims = buildCoreClaims(result, { a: a.first, b: b.first });
      const MAX_CONTENT_RETRIES = 2; // corrective regenerations after the first call
      let corrective: string | undefined;
      let lastMismatchNote = "";

      for (let attempt = 0; attempt <= MAX_CONTENT_RETRIES; attempt++) {
        let out: Record<string, unknown>;
        try {
          out = await generateProse(facts, language, corrective ? { corrective } : {});
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[generate] order=${orderId} prose attempt=${attempt} err=${msg.slice(0, 300)}`);
          const reason = msg.startsWith("gemini_truncated")
            ? "gemini_truncated"
            : msg.startsWith("gemini_overloaded")
            ? "gemini_overloaded"
            : msg.startsWith("gemini_missing_key")
            ? "gemini_config"
            : "generation_failed";
          return await fail(
            reason,
            `stage=prose attempt=${attempt + 1}/${MAX_CONTENT_RETRIES + 1} ${msg.slice(0, 400)}`,
          );
        }

        const check = verifyCoreNumbers(out, claims);
        if (check.ok) {
          sections = out;
          break;
        }
        lastMismatchNote = describeMismatches(check.mismatches);
        console.error(
          `[generate] order=${orderId} number_guard_mismatch attempt=${attempt} ${lastMismatchNote}`,
        );

        if (attempt < MAX_CONTENT_RETRIES) {
          corrective = correctiveInstruction(claims, check.mismatches);
          continue;
        }

        // Never hard-fail a paid order on the guard: the correct values are
        // known, so rewrite the contradicting numbers deterministically.
        const fixed = correctCoreNumbers(out, claims);
        sections = fixed.sections as Record<string, unknown>;
        guardNote =
          `type=number_guard_mismatch stage=prose attempt=${attempt + 1}/${MAX_CONTENT_RETRIES + 1} ` +
          `auto_corrected=${fixed.corrections} (${lastMismatchNote})`;
        console.error(`[generate] order=${orderId} ${guardNote}`);
      }

      if (!sections) return await fail("generation_failed", `stage=prose ${lastMismatchNote}`);
      await supabase.from("love_match_prose_cache").upsert({ prose_key: proseKey, sections });
    }


    // Browserless PDF from server-rendered HTML.
    const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
    if (!browserlessKey) return await fail("pdf_config", "type=pdf_error stage=pdf missing BROWSERLESS_API_KEY");
    const pdfFacts = {
      language,
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
    if (!pdfRes.ok) {
      const body = (await pdfRes.text().catch(() => "")).slice(0, 300);
      console.error(`[generate] order=${orderId} browserless status=${pdfRes.status}`);
      return await fail(
        "pdf_failed",
        `type=pdf_error stage=pdf status=${pdfRes.status} body=${body}`,
      );
    }
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());
    if (pdfBytes.length < 10240) {
      return await fail("pdf_too_small", `type=pdf_error stage=pdf bytes=${pdfBytes.length}`);
    }

    const path = `love-match/${orderId}.pdf`;
    const { error: upErr } = await supabase.storage.from("love-match-pdfs")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) {
      console.error(`[generate] order=${orderId} storage err=${upErr.message}`);
      return await fail(
        "storage_failed",
        `type=storage_error stage=storage ${upErr.message.slice(0, 300)}`,
      );
    }
    const { data: signed } = await supabase.storage
      .from("love-match-pdfs").createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
    const pdfUrl = signed?.signedUrl ?? null;
    if (!pdfUrl) return await fail("storage_failed", "type=storage_error stage=storage sign_url_failed");

    // ready: report exists and is viewable even if email delivery fails.
    const nowIso = new Date().toISOString();
    await supabase.from("love_match_orders")
      .update({
        status: "ready",
        pdf_url: pdfUrl,
        ready_at: nowIso,
        error_message: null,
        failure_reason: null,
        // keep the guard incident (admin-only) even on a successful report
        error_detail: guardNote,
      })
      .eq("order_id", orderId);


    // Email delivery stage (own retry policy; never fails the order).
    const emailResult = await deliverEmail({
      to: (typeof a?.email === "string" ? a.email : null) ?? order.email ?? null,
      firstName: a?.first ?? "",
      pdfUrl,
      orderId,
    });

    if (emailResult.sent) {
      await supabase.from("love_match_orders")
        .update({
          status: "delivered",
          email_sent: true,
          delivered_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);
    } else if (emailResult.detail) {
      const merged = [guardNote, emailResult.detail].filter(Boolean).join(" | ");
      await supabase.from("love_match_orders")
        .update({ email_sent: false, error_detail: merged.slice(0, 2000) })
        .eq("order_id", orderId);
    }

    const delivered = emailResult.sent || order.whatsapp_sent === true;

    // Coupon usage bump (non-fatal). Claim guard makes this run once per order.
    if (order.coupon_code) {
      try {
        await supabase.rpc("increment_coupon_usage", { _code: order.coupon_code });
      } catch (_) { /* non-fatal */ }
    }

    return {
      ok: true,
      status: delivered ? "delivered" : "ready",
      pdf_url: pdfUrl,
      delivered,
    };

  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
    console.error(`[generate] order=${orderId} unexpected err=${msg.slice(0, 500)}`);
    return await fail("internal", `type=internal ${msg.slice(0, 600)}`);
  }

}

/** Claim + run in one call. Safe to invoke concurrently. */
export async function generateReport(
  supabase: SupabaseClient,
  orderId: string,
  opts: { allowStale?: boolean; force?: boolean } = {},
): Promise<{ started: boolean; reason?: string; outcome?: GenerationOutcome }> {
  const claim = await claimOrder(supabase, orderId, opts);
  if (!claim.claimed) return { started: false, reason: claim.reason };
  const outcome = await runGeneration(supabase, orderId);
  return { started: true, outcome };
}

/** Ask Razorpay whether an order was actually paid (webhook-independent). */
export async function isRazorpayOrderPaid(razorpayOrderId: string): Promise<boolean> {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret || !razorpayOrderId) return false;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
    });
    if (!res.ok) return false;
    const order = await res.json();
    return order?.status === "paid" || (order?.amount_paid ?? 0) > 0;
  } catch (_) {
    return false;
  }
}
