// admin-upsert-coupon — create or update a coupon_codes row.
import { corsHeaders, J, requireAdmin } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const {
      id,
      code,
      discount_type,
      discount_amount,
      max_uses,
      expires_at,
      is_active,
      affiliate_user_id,
    } = body ?? {};

    if (typeof code !== "string" || code.trim().length === 0) {
      return new Response(JSON.stringify({ error: "code required" }), { status: 422, headers: J });
    }
    if (discount_type !== "percentage" && discount_type !== "fixed") {
      return new Response(JSON.stringify({ error: "discount_type must be percentage or fixed" }), { status: 422, headers: J });
    }
    const amount = Number(discount_amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "discount_amount must be positive integer" }), { status: 422, headers: J });
    }

    const row: Record<string, unknown> = {
      code: code.trim().toUpperCase(),
      discount_type,
      discount_amount: amount,
      max_uses: max_uses === null || max_uses === undefined || max_uses === "" ? null : Number(max_uses),
      expires_at: expires_at || null,
      is_active: is_active !== false,
      affiliate_user_id: affiliate_user_id || null,
    };

    if (id) {
      const { data, error } = await auth.admin.from("coupon_codes").update(row).eq("id", id).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: J });
      return new Response(JSON.stringify({ coupon: data }), { headers: J });
    } else {
      row.created_by = auth.userId;
      const { data, error } = await auth.admin.from("coupon_codes").insert(row).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: J });
      return new Response(JSON.stringify({ coupon: data }), { headers: J });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "failed" }), { status: 400, headers: J });
  }
});
