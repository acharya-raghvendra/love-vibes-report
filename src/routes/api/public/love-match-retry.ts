import { createFileRoute } from "@tanstack/react-router";
import { isUuid, isRazorpayOrderPaid, triggerGeneration } from "@/lib/report-pipeline.server";

// Public retry for a paid order whose report generation failed.
// Guarded: the order must exist, must be verified paid at the gateway, and
// must be in a retryable state with attempts left. No PII is returned.
export const Route = createFileRoute("/api/public/love-match-retry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { order_id?: unknown };
        if (!isUuid(body.order_id)) {
          return Response.json({ error: "invalid_order_id" }, { status: 400 });
        }
        const orderId = body.order_id;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("love_match_orders")
          .select("status, razorpay_order_id, attempt_count")
          .eq("order_id", orderId)
          .maybeSingle();

        if (!order) return Response.json({ error: "not_found" }, { status: 404 });
        if (order.status === "ready" || order.status === "delivered") {
          return Response.json({ order_id: orderId, status: order.status });
        }
        if (order.status === "generating") {
          return Response.json({ order_id: orderId, status: "generating" });
        }
        if ((order.attempt_count ?? 0) >= 5) {
          return Response.json({ error: "too_many_attempts" }, { status: 429 });
        }

        const paid = await isRazorpayOrderPaid(order.razorpay_order_id);
        if (!paid) return Response.json({ error: "not_paid" }, { status: 402 });

        const run = await triggerGeneration(orderId, { force: true });
        return Response.json({
          order_id: orderId,
          status: run.status ?? (run.ok ? "generating" : "failed"),
          skipped: run.skipped ?? null,
        });
      },
    },
  },
});
