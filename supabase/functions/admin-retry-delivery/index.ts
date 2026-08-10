// admin-retry-delivery — re-run generation for a paid-but-failed order.
//
// Two callers allowed:
//   1. An admin user (Authorization bearer, has_role 'admin').
//   2. Trusted server-side code in this app, which presents the service-role
//      key in x-internal-key (used by the public retry + reconciler routes,
//      which do their own eligibility checks before calling).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, corsHeaders, J } from "../_shared/admin-auth.ts";
import { generateReport } from "../_shared/generate-report.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.order_id === "string" ? body.order_id : "";
    if (!UUID_RE.test(orderId)) {
      return new Response(JSON.stringify({ error: "invalid_order_id" }), { status: 400, headers: J });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalKey = req.headers.get("x-internal-key") ?? "";

    // Self-validating internal auth: the presented key must actually be a
    // service-role key. love_match_cache denies anon/authenticated entirely,
    // so a successful read proves service-role privileges. This avoids
    // depending on both runtimes seeing the identical key string.
    let isInternal = false;
    let internalClient: ReturnType<typeof createClient> | null = null;
    if (internalKey.length > 20) {
      const candidate = createClient(Deno.env.get("SUPABASE_URL")!, internalKey);
      const probe = await candidate.from("love_match_cache").select("cache_key").limit(1);
      if (!probe.error) {
        isInternal = true;
        internalClient = candidate;
      }
    }

    let admin;
    if (isInternal && internalClient) {
      admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
    } else {
      const auth = await requireAdmin(req);
      if (!auth.ok) return auth.response;
      admin = auth.admin;
    }


    // force: admins/reconciler may re-run past the normal attempt cap and
    // may take over a stale `generating` row.
    const run = await generateReport(admin, orderId, { force: Boolean(body?.force) || !isInternal, allowStale: true });
    if (!run.started) {
      return new Response(
        JSON.stringify({ order_id: orderId, skipped: run.reason }),
        { status: run.reason === "not_found" ? 404 : 200, headers: J },
      );
    }
    if (!run.outcome?.ok) {
      return new Response(
        JSON.stringify({ order_id: orderId, status: "failed", error: run.outcome?.reason }),
        { status: 200, headers: J },
      );
    }
    return new Response(
      JSON.stringify({ order_id: orderId, status: run.outcome.status, pdf_url: run.outcome.pdf_url }),
      { status: 200, headers: J },
    );
  } catch (_err) {
    return new Response(JSON.stringify({ error: "internal" }), { status: 500, headers: J });
  }
});
