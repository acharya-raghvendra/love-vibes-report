// admin-create-affiliate — creates a new auth user (email confirmed) and grants 'affiliate' role.
import { corsHeaders, J, requireAdmin } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "valid email required" }), { status: 422, headers: J });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "password must be at least 8 chars" }), { status: 422, headers: J });
    }

    const { data: created, error: createErr } = await auth.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !created?.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "create failed" }), { status: 400, headers: J });
    }

    const { error: roleErr } = await auth.admin.from("user_roles").insert({
      user_id: created.user.id,
      role: "affiliate",
    });
    if (roleErr) {
      // Best-effort rollback of the auth user so state stays consistent.
      await auth.admin.auth.admin.deleteUser(created.user.id).catch(() => {});
      return new Response(JSON.stringify({ error: roleErr.message }), { status: 400, headers: J });
    }

    return new Response(JSON.stringify({
      affiliate: {
        user_id: created.user.id,
        email: created.user.email,
        created_at: created.user.created_at,
      },
    }), { headers: J });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "failed" }), { status: 400, headers: J });
  }
});
