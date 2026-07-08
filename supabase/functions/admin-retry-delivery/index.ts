// admin-retry-delivery — placeholder for retrying a failed order delivery.
// Currently returns 501 Not Implemented; UI wires the button but no retry logic yet.
import { corsHeaders, J, requireAdmin } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), { status: 422, headers: J });
    }
    // Confirm the order exists before returning the stub response.
    const { data, error } = await auth.admin
      .from("love_match_orders")
      .select("order_id, status, whatsapp_sent")
      .eq("order_id", order_id)
      .maybeSingle();
    if (error || !data) {
      return new Response(JSON.stringify({ error: "order not found" }), { status: 404, headers: J });
    }
    return new Response(
      JSON.stringify({ error: "Retry pipeline not implemented yet", order_id }),
      { status: 501, headers: J },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "failed" }), { status: 400, headers: J });
  }
});
