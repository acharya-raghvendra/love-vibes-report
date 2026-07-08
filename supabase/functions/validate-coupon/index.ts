// validate-coupon — lightweight, no-side-effects coupon check for /preview.
// Reads love_match_pricing (offer vs list) and returns the discounted price.
// Actual authoritative re-check still happens in create-love-match-order.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const J = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!code) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid coupon code" }), { headers: J, status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Pricing (single row).
    let BASE_PRICE = 599;
    let LIST_PRICE = 999;
    try {
      const { data: pricing } = await supabase
        .from("love_match_pricing")
        .select("list_price, offer_price, offer_ends_at")
        .limit(1).maybeSingle();
      if (pricing) {
        LIST_PRICE = pricing.list_price;
        const offerLive = pricing.offer_ends_at
          ? new Date(pricing.offer_ends_at) > new Date()
          : true;
        BASE_PRICE = offerLive ? pricing.offer_price : pricing.list_price;
      }
    } catch (_) { /* fallback */ }

    const { data: coupon } = await supabase
      .from("coupon_codes")
      .select("id, code, discount_type, discount_amount, is_active, expires_at, max_uses, usage_count")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid coupon code" }), { headers: J, status: 200 });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "Coupon has expired" }), { headers: J, status: 200 });
    }
    if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ valid: false, error: "Coupon usage limit reached" }), { headers: J, status: 200 });
    }

    let discount = coupon.discount_type === "percentage"
      ? Math.round((BASE_PRICE * coupon.discount_amount) / 100)
      : coupon.discount_amount;
    discount = Math.min(discount, BASE_PRICE - 1); // never zero-rupee
    const finalPrice = BASE_PRICE - discount;

    return new Response(JSON.stringify({
      valid: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountAmount: coupon.discount_amount,
      calculatedDiscount: discount,
      listPrice: LIST_PRICE,
      originalPrice: BASE_PRICE,
      finalPrice,
    }), { headers: J, status: 200 });
  } catch (_) {
    return new Response(JSON.stringify({ valid: false, error: "Could not validate coupon" }), { headers: J, status: 200 });
  }
});
