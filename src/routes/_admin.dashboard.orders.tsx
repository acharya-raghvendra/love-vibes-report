import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/dashboard/orders")({
  component: OrdersPage,
});

type PersonJson = { first?: string; last?: string; phone?: string; dob?: string };

type OrderRow = {
  order_id: string;
  person_a: PersonJson;
  person_b: PersonJson;
  status: string;
  final_price: number | null;
  discount_applied: number;
  coupon_code: string | null;
  whatsapp_sent: boolean;
  pdf_url: string | null;
  created_at: string;
};

function fullName(p: PersonJson) {
  return [p?.first, p?.last].filter(Boolean).join(" ") || "—";
}

function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameQuery, setNameQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);

  const { data, isLoading, error } = useQuery<OrderRow[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("love_match_orders")
        .select("order_id, person_a, person_b, status, final_price, discount_applied, coupon_code, whatsapp_sent, pdf_url, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const nq = nameQuery.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null;
    return data.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (from && new Date(r.created_at).getTime() < from) return false;
      if (to && new Date(r.created_at).getTime() > to) return false;
      if (nq) {
        const hay = `${fullName(r.person_a)} ${fullName(r.person_b)}`.toLowerCase();
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
  }, [data, statusFilter, nameQuery, dateFrom, dateTo]);

  const totals = useMemo(() => {
    let count = 0, revenue = 0, discount = 0;
    for (const r of filtered) {
      count++;
      if (r.status === "delivered" && r.final_price) revenue += r.final_price;
      discount += r.discount_applied ?? 0;
    }
    return { count, revenue, discount };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <h1 className="text-headline-md font-semibold text-on-surface">All Orders</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface-container-low p-4">
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-body-sm">
            <option value="all">All</option>
            <option value="created">Created</option>
            <option value="paid">Paid</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-body-sm" />
        </div>
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-body-sm" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-label-sm text-on-surface-variant">Name search</label>
          <input value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="Search by name" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-body-sm" />
        </div>
      </div>

      <div className="flex gap-6 rounded-2xl border border-border bg-surface-container-low p-4 text-body-sm">
        <div><span className="text-on-surface-variant">Count:</span> <b className="text-on-surface">{totals.count}</b></div>
        <div><span className="text-on-surface-variant">Revenue:</span> <b className="text-on-surface">₹{totals.revenue.toLocaleString("en-IN")}</b></div>
        <div><span className="text-on-surface-variant">Discount:</span> <b className="text-on-surface">₹{totals.discount.toLocaleString("en-IN")}</b></div>
      </div>

      {isLoading && <div className="text-on-surface-variant">Loading…</div>}
      {error && <div className="text-error">Failed to load: {(error as Error).message}</div>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-body-sm">
            <thead className="bg-surface-container text-left text-label-sm text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Person A</th>
                <th className="px-4 py-3">Person B</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Coupon</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">PDF</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.order_id} className="hover:bg-surface-container/50">
                  <td className="px-4 py-3">{fullName(r.person_a)}</td>
                  <td className="px-4 py-3">{fullName(r.person_b)}</td>
                  <td className="px-4 py-3"><StatusChip status={r.status} /></td>
                  <td className="px-4 py-3">{r.final_price ? `₹${r.final_price}` : "—"}</td>
                  <td className="px-4 py-3">{r.discount_applied ? `₹${r.discount_applied}` : "—"}</td>
                  <td className="px-4 py-3">{r.coupon_code || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-sm ${r.whatsapp_sent ? "bg-green-500/15 text-green-500" : "bg-error/15 text-error"}`}>
                      {r.whatsapp_sent ? "Sent" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.pdf_url ? (
                      <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open</a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailOrder(r)} className="text-primary hover:underline">View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-on-surface-variant">No orders match</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detailOrder && <OrderDetail order={detailOrder} onClose={() => setDetailOrder(null)} />}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: "bg-green-500/15 text-green-500",
    paid: "bg-blue-500/15 text-blue-500",
    created: "bg-surface-container-high text-on-surface-variant",
    failed: "bg-error/15 text-error",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-label-sm ${map[status] ?? "bg-surface-container text-on-surface-variant"}`}>{status}</span>;
}

function OrderDetail({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-title-md font-semibold">Order detail</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">✕</button>
        </div>
        <dl className="mt-4 space-y-2 text-body-sm">
          <Row label="Order ID" value={order.order_id} />
          <Row label="Person A" value={`${fullName(order.person_a)} (${order.person_a.dob ?? "?"})`} />
          <Row label="Phone" value={order.person_a.phone ?? "—"} />
          <Row label="Person B" value={`${fullName(order.person_b)} (${order.person_b.dob ?? "?"})`} />
          <Row label="Status" value={order.status} />
          <Row label="Final Price" value={order.final_price ? `₹${order.final_price}` : "—"} />
          <Row label="Discount" value={order.discount_applied ? `₹${order.discount_applied}` : "—"} />
          <Row label="Coupon" value={order.coupon_code || "—"} />
          <Row label="WhatsApp Sent" value={order.whatsapp_sent ? "Yes" : "No"} />
          <Row label="Created" value={new Date(order.created_at).toLocaleString()} />
        </dl>
        {order.pdf_url && (
          <a href={order.pdf_url} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-body-sm text-primary-foreground">Open PDF</a>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-1">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-right text-on-surface">{value}</dd>
    </div>
  );
}
