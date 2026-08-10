import { createFileRoute } from "@tanstack/react-router";
import { isUuid } from "@/lib/report-pipeline.server";

// Public, read-only delivery status for the success page poller.
// Returns ONLY status fields — never person data, email or phone.
export const Route = createFileRoute("/api/public/love-match-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const orderId = new URL(request.url).searchParams.get("order_id");
        if (!isUuid(orderId)) {
          return Response.json({ error: "invalid_order_id" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("love_match_orders")
          .select("status, pdf_url, error_message, attempt_count, whatsapp_sent, email_sent")
          .eq("order_id", orderId)
          .maybeSingle();

        if (!order) return Response.json({ error: "not_found" }, { status: 404 });

        const status = order.status ?? "created";
        const ready = status === "ready" || status === "delivered";
        const emailSent = order.email_sent === true;
        const whatsappSent = order.whatsapp_sent === true;

        return Response.json(
          {
            order_id: orderId,
            status,
            ready,
            // An order counts as delivered when EITHER channel succeeded.
            delivered: emailSent || whatsappSent,
            email_sent: emailSent,
            whatsapp_sent: whatsappSent,

            pdf_url: ready ? order.pdf_url : null,
            error_message:
              status === "failed"
                ? (order.error_message ?? "Report generation failed.")
                : null,
            can_retry: status === "failed" && (order.attempt_count ?? 0) < 5,
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
