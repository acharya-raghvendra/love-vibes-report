// create-love-match-order — creates our order row + a Razorpay order.
// Server-side price only. Client-sent amount is ignored. our order_id is
// embedded in Razorpay notes so love-match-finalize can find it from the webhook.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const J = { ...corsHeaders, "Content-Type": "application/json" };

const BASE_PRICE = 599; // INR. Server-authoritative.

function cleanName(v: unknown): string {
  return typeof v === "string" ? v.replace(/[<>]/g, "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 60) : "";
}
function cleanPhone(v: unknown): string {
  return typeof v === "string" ? v.replace(/[^\d]/g, "").slice(0, 15) : "";
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    if (body.warmup) return new Response(JSON.stringify({ status: "warm" }), { headers: J });

    if (body.amount !== undefined) console.warn("[create-love-match-order] ignoring client amount");

    // Validate both people. person_a carries the delivery phone.
    const aFirst = cleanName(body?.person_a?.first);
    const aDob = validDob(body?.person_a?.dob);
    const phone = cleanPhone(body?.person_a?.phone);
    const bFirst = cleanName(body?.person_b?.first);
    const bDob = validDob(body?.person_b?.dob);
    if (!aFirst || !aDob) return new Response(JSON.stringify({ error: "person_a invalid" }), { status: 422, headers: J });
    if (!bFirst || !bDob) return new Response(JSON.stringify({ error: "person_b invalid" }), { status: 422, headers: J });
    if (phone.length < 10) return new Response(JSON.stringify({ error: "phone required" }), { status: 422, headers: J });

    const language = body.language === "hi" ? "hi" : "en";
    const couponCode = typeof body.couponCode === "string" ? body.couponCode.toUpperCase() : null;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Coupon (server-side).
    let finalAmount = BASE_PRICE;
    let discountApplied = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupon_codes").select("*").eq("code", couponCode).eq("is_active", true).maybeSingle();
      if (coupon) {
        const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const maxed = coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses;
        if (!expired && !maxed) {
          discountApplied = coupon.discount_type === "percentage"
            ? Math.round((BASE_PRICE * coupon.discount_amount) / 100)
            : coupon.discount_amount;
          discountApplied = Math.min(discountApplied, BASE_PRICE - 1); // never zero-rupee
          finalAmount = BASE_PRICE - discountApplied;
          couponId = coupon.id;
        }
      }
    }
    const finalAmountPaise = finalAmount * 100;

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return new Response(JSON.stringify({ error: "gateway not configured" }), { status: 500, headers: J });

    const orderId = crypto.randomUUID();
    const refYear = new Date().getUTCFullYear();

    // Persist our order BEFORE Razorpay so a captured payment always has a row.
    const { error: insErr } = await supabase.from("love_match_orders").insert({
      order_id: orderId,
      person_a: { first: aFirst, last: cleanName(body?.person_a?.last), dob: aDob, phone },
      person_b: { first: bFirst, last: cleanName(body?.person_b?.last), dob: bDob },
      language, ref_year: refYear, status: "created",
    });
    if (insErr) return new Response(JSON.stringify({ error: "order create failed" }), { status: 500, headers: J });

    const orderPayload = {
      amount: finalAmountPaise,
      currency: "INR",
      receipt: `lovematch_${Date.now()}`,
      notes: {
        product: "Love Match Report",
        order_id: orderId, // finalize reads this from webhook
        final_price_paise: finalAmountPaise,
        coupon_code: couponCode,
        coupon_id: couponId,
      },
    };

    let response: Response | null = null;
    let lastError = "";
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
          body: JSON.stringify(orderPayload),
        });
        if (response.ok) break;
        lastError = await response.text();
      } catch (e) {
        lastError = e instanceof Error ? e.message : "network";
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
    if (!response || !response.ok) {
      await supabase.from("love_match_orders").update({ status: "failed" }).eq("order_id", orderId);
      console.error("razorpay failed:", lastError);
      return new Response(JSON.stringify({ error: "Failed to create order. Please try again." }), { status: 502, headers: J });
    }

    const order = await response.json();
    await supabase.from("love_match_orders").update({ razorpay_order_id: order.id }).eq("order_id", orderId);

    return new Response(JSON.stringify({
      orderId: order.id,
      internalOrderId: orderId,
      amount: order.amount,
      currency: order.currency,
      keyId,
      originalPrice: BASE_PRICE,
      discountApplied,
      finalPrice: finalAmount,
    }), { headers: J, status: 200 });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Failed to create order" }), { status: 400, headers: J });
  }
});
