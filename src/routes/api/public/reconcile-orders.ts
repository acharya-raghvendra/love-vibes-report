import { createFileRoute } from "@tanstack/react-router";
import { isRazorpayOrderPaid, triggerGeneration } from "@/lib/report-pipeline.server";

// Safety net for paid orders that never reached a terminal state.
// Idempotent and safe to call repeatedly (cron or manual):
//   1. Flip stale `generating` rows (> 6 min) to `failed` so nothing hangs.
//   2. Find recent `created`/`paid`/`failed` rows, verify payment at the
//      gateway, and re-drive generation through the shared pipeline.

const STALE_MS = 6 * 60 * 1000;
const LOOKBACK_MS = 48 * 60 * 60 * 1000;
const MAX_PER_RUN = 5;

export const Route = createFileRoute("/api/public/reconcile-orders")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. Stale generating -> failed (never leave a row hanging).
        const staleCutoff = new Date(Date.now() - STALE_MS).toISOString();
        const { data: expired } = await supabaseAdmin
          .from("love_match_orders")
          .update({
            status: "failed",
            failure_reason: "generation_timeout",
            error_message: "Report generation took too long and was stopped. Please retry.",
          })
          .eq("status", "generating")
          .lt("generation_started_at", staleCutoff)
          .select("order_id");

        // 2. Paid-but-unfinished orders (missed or failed webhook).
        const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
        const { data: candidates } = await supabaseAdmin
          .from("love_match_orders")
          .select("order_id, status, razorpay_order_id, attempt_count")
          .in("status", ["created", "paid", "failed"])
          .gte("created_at", since)
          .not("razorpay_order_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(30);

        const results: Array<{ order_id: string; action: string }> = [];
        for (const order of candidates ?? []) {
          if (results.length >= MAX_PER_RUN) break;
          if ((order.attempt_count ?? 0) >= 5) continue;
          const paid = await isRazorpayOrderPaid(order.razorpay_order_id);
          if (!paid) continue;
          await supabaseAdmin
            .from("love_match_orders")
            .update({ status: "paid" })
            .eq("order_id", order.order_id)
            .eq("status", "created");
          const run = await triggerGeneration(order.order_id, { force: true });
          results.push({
            order_id: order.order_id,
            action: run.status ?? run.skipped ?? run.error ?? "unknown",
          });
        }

        return Response.json({
          expired: (expired ?? []).map((r) => r.order_id),
          reconciled: results,
        });
      },
    },
  },
});
