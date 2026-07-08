// admin-delete-coupon — delete a coupon_codes row by id.
import { corsHeaders, J, requireAdmin } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "id required" }), { status: 422, headers: J });
    }
    const { error } = await auth.admin.from("coupon_codes").delete().eq("id", id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: J });
    return new Response(JSON.stringify({ ok: true }), { headers: J });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "failed" }), { status: 400, headers: J });
  }
});
