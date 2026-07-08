// admin-update-pricing — update the single love_match_pricing row.
import { corsHeaders, J, requireAdmin } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { list_price, offer_price, offer_ends_at } = await req.json();

    const lp = Number(list_price);
    const op = Number(offer_price);
    if (!Number.isInteger(lp) || lp <= 0) {
      return new Response(JSON.stringify({ error: "list_price invalid" }), { status: 422, headers: J });
    }
    if (!Number.isInteger(op) || op <= 0) {
      return new Response(JSON.stringify({ error: "offer_price invalid" }), { status: 422, headers: J });
    }
    if (op > lp) {
      return new Response(JSON.stringify({ error: "offer_price cannot exceed list_price" }), { status: 422, headers: J });
    }

    const { data, error } = await auth.admin
      .from("love_match_pricing")
      .update({
        list_price: lp,
        offer_price: op,
        offer_ends_at: offer_ends_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: J });
    return new Response(JSON.stringify({ pricing: data }), { headers: J });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "failed" }), { status: 400, headers: J });
  }
});
