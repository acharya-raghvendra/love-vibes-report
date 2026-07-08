import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/dashboard/coupons")({
  component: CouponsPage,
});

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_amount: number;
  max_uses: number | null;
  expires_at: string | null;
  is_active: boolean;
  usage_count: number;
  affiliate_user_id: string | null;
  created_at: string;
};

type OrderForCoupon = {
  coupon_code: string | null;
  final_price: number | null;
  discount_applied: number;
  status: string;
};

type Affiliate = { user_id: string; email: string | null };

async function invokeEdge(fn: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke(fn, {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function CouponsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);

  const { data: coupons } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupon_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: orders } = useQuery<OrderForCoupon[]>({
    queryKey: ["admin-coupon-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("love_match_orders").select("coupon_code, final_price, discount_applied, status");
      if (error) throw error;
      return (data ?? []) as OrderForCoupon[];
    },
  });

  const statsByCoupon = useMemo(() => {
    const map = new Map<string, { uses: number; revenue: number; discount: number }>();
    for (const o of orders ?? []) {
      if (!o.coupon_code) continue;
      const s = map.get(o.coupon_code) ?? { uses: 0, revenue: 0, discount: 0 };
      s.uses++;
      if (o.status === "delivered" && o.final_price) s.revenue += o.final_price;
      s.discount += o.discount_applied ?? 0;
      map.set(o.coupon_code, s);
    }
    return map;
  }, [orders]);

  const saveMut = useMutation({
    mutationFn: (payload: Partial<Coupon>) => invokeEdge("admin-upsert-coupon", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => invokeEdge("admin-delete-coupon", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  function copyLink(code: string) {
    const url = `${window.location.origin}/?coupon=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-md font-semibold">Coupons</h1>
        <button
          onClick={() => setEditing({ discount_type: "fixed", discount_amount: 100, is_active: true })}
          className="rounded-md bg-primary px-4 py-2 text-body-sm text-primary-foreground hover:bg-primary/90"
        >
          + New Coupon
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-body-sm">
          <thead className="bg-surface-container text-left text-label-sm text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Discount Given</th>
              <th className="px-4 py-3">Max Uses</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(coupons ?? []).map((c) => {
              const s = statsByCoupon.get(c.code);
              return (
                <tr key={c.id} className="hover:bg-surface-container/50">
                  <td className="px-4 py-3 font-mono">{c.code}</td>
                  <td className="px-4 py-3">{c.discount_type}</td>
                  <td className="px-4 py-3">{c.discount_type === "percentage" ? `${c.discount_amount}%` : `₹${c.discount_amount}`}</td>
                  <td className="px-4 py-3">{s?.uses ?? 0}</td>
                  <td className="px-4 py-3">₹{(s?.revenue ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">₹{(s?.discount ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{c.max_uses ?? "∞"}</td>
                  <td className="px-4 py-3">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-label-sm ${c.is_active ? "bg-green-500/15 text-green-500" : "bg-surface-container-high text-on-surface-variant"}`}>
                      {c.is_active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                    <button onClick={() => copyLink(c.code)} className="text-primary hover:underline">Copy link</button>
                    <button onClick={() => setEditing(c)} className="text-primary hover:underline">Edit</button>
                    <button onClick={() => confirm(`Delete ${c.code}?`) && deleteMut.mutate(c.id)} className="text-error hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
            {(coupons ?? []).length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-on-surface-variant">No coupons yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <CouponEditor
          coupon={editing}
          onSave={(payload) => saveMut.mutate(payload)}
          onCancel={() => setEditing(null)}
          saving={saveMut.isPending}
          error={saveMut.error instanceof Error ? saveMut.error.message : null}
        />
      )}
    </div>
  );
}

function CouponEditor({
  coupon, onSave, onCancel, saving, error,
}: {
  coupon: Partial<Coupon>;
  onSave: (p: Partial<Coupon>) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<Partial<Coupon>>(coupon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-title-md font-semibold">{coupon.id ? "Edit coupon" : "New coupon"}</h2>
        <Field label="Code">
          <input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono uppercase" />
        </Field>
        <Field label="Type">
          <select value={form.discount_type ?? "fixed"} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="fixed">Fixed (₹)</option>
            <option value="percentage">Percentage (%)</option>
          </select>
        </Field>
        <Field label="Amount">
          <input type="number" value={form.discount_amount ?? 0} onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value) })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
        </Field>
        <Field label="Max uses (blank = unlimited)">
          <input type="number" value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
        </Field>
        <Field label="Expires at">
          <input type="datetime-local" value={form.expires_at ? new Date(form.expires_at).toISOString().slice(0, 16) : ""} onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
        </Field>
        <label className="flex items-center gap-2 text-body-sm">
          <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
        {error && <div className="rounded-md bg-error/10 px-3 py-2 text-label-sm text-error">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-body-sm">Cancel</button>
          <button disabled={saving} onClick={() => onSave(form)} className="rounded-md bg-primary px-4 py-2 text-body-sm text-primary-foreground disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-label-sm text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}
