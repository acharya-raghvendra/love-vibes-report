// admin-list-affiliates — returns { user_id, email }[] for users with the 'affiliate' role.
import { corsHeaders, J, requireAdmin } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { data: roles, error: rolesErr } = await auth.admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "affiliate");
    if (rolesErr) throw rolesErr;

    const ids = (roles ?? []).map((r: { user_id: string }) => r.user_id);
    if (ids.length === 0) return new Response(JSON.stringify({ affiliates: [] }), { headers: J });

    // Look up emails via auth admin API.
    const affiliates: { user_id: string; email: string | null; created_at: string }[] = [];
    for (const id of ids) {
      const { data, error } = await auth.admin.auth.admin.getUserById(id);
      if (error || !data?.user) continue;
      affiliates.push({
        user_id: data.user.id,
        email: data.user.email ?? null,
        created_at: data.user.created_at,
      });
    }
    affiliates.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));

    return new Response(JSON.stringify({ affiliates }), { headers: J });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "failed" }), { status: 400, headers: J });
  }
});
