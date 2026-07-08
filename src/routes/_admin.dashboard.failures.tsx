import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/_admin/dashboard/failures")({
  component: FailuresPage,
});

type FailureRow = {
  order_id: string;
  status: string;
  whatsapp_sent: boolean;
  failure_reason: string | null;
  created_at: string;
  person_a: { first?: string; last?: string; phone?: string };
};

async function invokeEdge(fn: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke(fn, {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  return res;
}

function FailuresPage() {
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<FailureRow[]>({
    queryKey: ["admin-failures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("love_match_orders")
        .select("order_id, status, whatsapp_sent, failure_reason, created_at, person_a")
        .or("status.eq.failed,and(status.eq.delivered,whatsapp_sent.eq.false)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as FailureRow[];
    },
  });

  const retryMut = useMutation({
    mutationFn: async (order_id: string) => {
      const res = await invokeEdge("admin-retry-delivery", { order_id });
      const msg = res.error
        ? res.error.message
        : (res.data as { error?: string } | null)?.error ?? "Retry queued";
      setNotice(msg);
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-headline-md font-semibold">Delivery Failures</h1>
      {notice && (
        <div className="rounded-md bg-blue-500/10 px-3 py-2 text-label-sm text-blue-500">{notice}</div>
      )}
      {isLoading && <div className="text-on-surface-variant">Loading…</div>}
      {error && <div className="text-error">{(error as Error).message}</div>}
      {!isLoading && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-body-sm">
            <thead className="bg-surface-container text-left text-label-sm text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Failure Reason</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map((r) => (
                <tr key={r.order_id} className="hover:bg-surface-container/50">
                  <td className="px-4 py-3 font-mono">{r.person_a?.phone ?? "—"}</td>
                  <td className="px-4 py-3">{[r.person_a?.first, r.person_a?.last].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">{r.whatsapp_sent ? "Sent" : "No"}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{r.failure_reason ?? "—"}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => retryMut.mutate(r.order_id)}
                      disabled={retryMut.isPending}
                      className="rounded-md border border-border px-3 py-1 text-label-sm hover:bg-surface-container disabled:opacity-50"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">No failures 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
