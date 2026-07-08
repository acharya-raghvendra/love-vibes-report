import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/dashboard/")({
  component: DashboardHome,
});

type Stats = {
  totalOrders: number;
  revenue: number;
  thisWeek: number;
  delivered: number;
  failed: number;
  whatsappRate: number | null;
};

function DashboardHome() {
  const { data, isLoading, error } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("love_match_orders")
        .select("status, final_price, whatsapp_sent, created_at");
      if (error) throw error;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let totalOrders = 0;
      let revenue = 0;
      let thisWeek = 0;
      let delivered = 0;
      let failed = 0;
      let deliveredWithWa = 0;

      for (const r of rows ?? []) {
        totalOrders++;
        if (r.status === "delivered") {
          delivered++;
          if (r.final_price) revenue += r.final_price;
          if (r.whatsapp_sent) deliveredWithWa++;
        }
        if (r.status === "failed") failed++;
        if (new Date(r.created_at) >= weekAgo) thisWeek++;
      }

      return {
        totalOrders,
        revenue,
        thisWeek,
        delivered,
        failed,
        whatsappRate: delivered > 0 ? Math.round((deliveredWithWa / delivered) * 100) : null,
      };
    },
  });

  if (isLoading) return <div className="text-on-surface-variant">Loading…</div>;
  if (error) return <div className="text-error">Failed to load stats: {(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-headline-md font-semibold text-on-surface">Overview</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Orders" value={data.totalOrders.toString()} />
        <StatCard label="Revenue (delivered)" value={`₹${data.revenue.toLocaleString("en-IN")}`} />
        <StatCard label="This Week" value={data.thisWeek.toString()} />
        <StatCard label="Delivered" value={data.delivered.toString()} tone="positive" />
        <StatCard label="Failed" value={data.failed.toString()} tone="negative" />
        <StatCard
          label="WhatsApp Success Rate"
          value={data.whatsappRate === null ? "—" : `${data.whatsappRate}%`}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-green-500"
      : tone === "negative"
        ? "text-error"
        : "text-on-surface";
  return (
    <div className="rounded-2xl border border-border bg-surface-container-low p-6">
      <div className="text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div className={`mt-2 text-headline-md font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
