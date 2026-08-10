// love-match-finalize — Razorpay webhook. Verifies the signature, then hands
// off to the shared generation pipeline. It NEVER runs generation inline logic
// of its own: claim + pipeline + status writes all live in
// _shared/generate-report.ts so webhook / reconciler / retry behave identically.
//
// Attacker-reading assumptions: signature verified before ANY work,
// constant-time compare, no secret logging, no client-number trust,
// order inputs always read from OUR row, generic errors only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateReport } from "../_shared/generate-report.ts";

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
    const eventName = event?.event;
    if (eventName !== "payment.captured" && eventName !== "order.paid") {
      console.log(`[finalize] ignored event=${eventName}`);
      return ok({ ignored: true }, 200);
    }

    const payment = event?.payload?.payment?.entity;
    const rzpOrder = event?.payload?.order?.entity;

    // Match our order: notes first, then the gateway order id we stored.
    let orderId: string | undefined = payment?.notes?.order_id ?? rzpOrder?.notes?.order_id;
    const razorpayOrderId: string | undefined = payment?.order_id ?? rzpOrder?.id;

    if (!orderId && razorpayOrderId) {
      const { data: byGateway } = await supabase
        .from("love_match_orders")
        .select("order_id")
        .eq("razorpay_order_id", razorpayOrderId)
        .maybeSingle();
      orderId = byGateway?.order_id;
    }

    // Always 200 on unmatched events so Razorpay stops retrying forever.
    if (!orderId) {
      console.error(`[finalize] unmatched event=${eventName} rzp_order=${razorpayOrderId ?? "none"}`);
      return ok({ ignored: true, reason: "no_order" }, 200);
    }

    // Mark paid before claiming, so a paid-but-not-yet-generated row is visible.
    await supabase.from("love_match_orders")
      .update({ status: "paid" })
      .eq("order_id", orderId)
      .in("status", ["created"]);

    console.log(`[finalize] order=${orderId} event=${eventName} starting generation`);
    const run = await generateReport(supabase, orderId);
    if (!run.started) {
      console.log(`[finalize] order=${orderId} skipped reason=${run.reason}`);
      return ok({ order_id: orderId, skipped: run.reason }, 200);
    }
    if (!run.outcome?.ok) {
      // Row is already status=failed with error_message; 200 keeps Razorpay quiet.
      return ok({ order_id: orderId, status: "failed", reason: run.outcome?.reason }, 200);
    }
    return ok({
      order_id: orderId,
      status: run.outcome.status,
      pdf_url: run.outcome.pdf_url,
      whatsapp_sent: run.outcome.delivered,
    });
  } catch (_err) {
    return ok({ error: "internal" }, 500);
  }
});
