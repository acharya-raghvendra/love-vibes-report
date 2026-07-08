import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/dashboard/pricing")({
  component: PricingPage,
});

type Pricing = {
  id: number;
  list_price: number;
  offer_price: number;
  offer_ends_at: string | null;
  updated_at: string;
};

async function invokeEdge(fn: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke(fn, {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function PricingPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<{ list_price: number; offer_price: number; offer_ends_at: string | null }>({
    list_price: 0, offer_price: 0, offer_ends_at: null,
  });

  const { data, isLoading } = useQuery<Pricing>({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase.from("love_match_pricing").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({ list_price: data.list_price, offer_price: data.offer_price, offer_ends_at: data.offer_ends_at });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => invokeEdge("admin-update-pricing", form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pricing"] }),
  });

  if (isLoading) return <div className="text-on-surface-variant">Loading…</div>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-headline-md font-semibold">Pricing</h1>
      <div className="space-y-4 rounded-2xl border border-border bg-surface-container-low p-6">
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">List price (₹) — strike-through anchor</label>
          <input type="number" value={form.list_price} onChange={(e) => setForm({ ...form, list_price: Number(e.target.value) })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">Offer price (₹) — what customers pay</label>
          <input type="number" value={form.offer_price} onChange={(e) => setForm({ ...form, offer_price: Number(e.target.value) })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">Offer ends at (leave blank for always-on)</label>
          <input
            type="datetime-local"
            value={form.offer_ends_at ? new Date(form.offer_ends_at).toISOString().slice(0, 16) : ""}
            onChange={(e) => setForm({ ...form, offer_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>
        {saveMut.error instanceof Error && (
          <div className="rounded-md bg-error/10 px-3 py-2 text-label-sm text-error">{saveMut.error.message}</div>
        )}
        {saveMut.isSuccess && (
          <div className="rounded-md bg-green-500/10 px-3 py-2 text-label-sm text-green-500">Saved.</div>
        )}
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="rounded-md bg-primary px-4 py-2 text-body-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saveMut.isPending ? "Saving…" : "Save pricing"}
        </button>
      </div>
      {data && (
        <div className="text-label-sm text-on-surface-variant">
          Last updated: {new Date(data.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
