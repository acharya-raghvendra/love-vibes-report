import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_affiliate/portal/sales")({
  component: MySalesPage,
});

type Order = {
  order_id: string;
  person_a: { first?: string } | null;
  coupon_code: string | null;
  final_price: number | null;
  discount_applied: number;
  created_at: string;
  status: string;
};

function MySalesPage() {
  const { user } = useRole();
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");

  const { data: orders, isLoading } = useQuery<Order[]>({
    enabled: !!user,
    queryKey: ["affiliate-sales", user?.id],
    queryFn: async () => {
      const { data: coupons } = await supabase
        .from("coupon_codes")
        .select("code")
        .eq("affiliate_user_id", user!.id);
      const codes = (coupons ?? []).map((c: { code: string }) => c.code);
      if (codes.length === 0) return [];
      const { data, error } = await supabase
        .from("love_match_orders")
        .select("order_id, person_a, coupon_code, final_price, discount_applied, created_at, status")
        .in("coupon_code", codes)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const filtered = useMemo(() => {
    const list = orders ?? [];
    const start = startStr ? new Date(startStr) : null;
    const end = endStr ? new Date(endStr) : null;
    if (end) end.setHours(23, 59, 59, 999);
    return list.filter((o) => {
      const t = new Date(o.created_at);
      if (start && t < start) return false;
      if (end && t > end) return false;
      return true;
    });
  }, [orders, startStr, endStr]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce((s, o) => s + (o.final_price ?? 0), 0);
    const discount = filtered.reduce((s, o) => s + (o.discount_applied ?? 0), 0);
    return { count: filtered.length, revenue, discount };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-semibold">My Sales</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Every delivered report bought with your coupon</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface-container-low p-4">
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">From</label>
          <input type="date" value={startStr} onChange={(e) => setStartStr(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-body-sm" />
        </div>
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">To</label>
          <input type="date" value={endStr} onChange={(e) => setEndStr(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-body-sm" />
        </div>
        {(startStr || endStr) && (
          <button onClick={() => { setStartStr(""); setEndStr(""); }} className="rounded-md border border-border px-3 py-2 text-body-sm">
            Clear
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Sales" value={totals.count} />
        <SummaryCard label="Revenue" value={`₹${totals.revenue.toLocaleString("en-IN")}`} />
        <SummaryCard label="Discount given" value={`₹${totals.discount.toLocaleString("en-IN")}`} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-body-sm">
          <thead className="bg-surface-container text-left text-label-sm text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Coupon</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((o) => (
              <tr key={o.order_id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{o.person_a?.first ?? "—"}</td>
                <td className="px-4 py-3"><code className="font-mono">{o.coupon_code ?? "—"}</code></td>
                <td className="px-4 py-3 text-green-500">-₹{(o.discount_applied ?? 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 font-semibold">₹{(o.final_price ?? 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">No sales in this range</td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-container-low p-5">
      <div className="text-label-md text-on-surface-variant">{label}</div>
      <div className="mt-2 text-headline-md font-semibold text-on-surface">{value}</div>
    </div>
  );
}
