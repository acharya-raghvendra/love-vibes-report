import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/dashboard/affiliates")({
  component: AffiliatesPage,
});

type Affiliate = { user_id: string; email: string | null; created_at: string };

async function invokeEdge(fn: string, body: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke(fn, {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (res.error) {
    // Try to surface the JSON body's error field.
    const ctx = (res.error as unknown as { context?: { body?: unknown } })?.context?.body;
    let msg = res.error.message;
    try {
      const parsed = typeof ctx === "string" ? JSON.parse(ctx) : ctx;
      if (parsed && typeof parsed === "object" && "error" in parsed) msg = String((parsed as { error: string }).error);
    } catch {/* keep default */}
    throw new Error(msg);
  }
  return res.data;
}

function AffiliatesPage() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: affiliates, isLoading, error } = useQuery<Affiliate[]>({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const data = await invokeEdge("admin-list-affiliates");
      return (data as { affiliates: Affiliate[] }).affiliates ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: { email: string; password: string }) => invokeEdge("admin-create-affiliate", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
      setAdding(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-md font-semibold">Affiliates</h1>
        <button
          onClick={() => setAdding(true)}
          className="rounded-md bg-primary px-4 py-2 text-body-sm text-primary-foreground hover:bg-primary/90"
        >
          + Add affiliate
        </button>
      </div>

      {error && <div className="rounded-md bg-error/10 px-3 py-2 text-label-sm text-error">{(error as Error).message}</div>}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-body-sm">
          <thead className="bg-surface-container text-left text-label-sm text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">User ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(affiliates ?? []).map((a) => (
              <tr key={a.user_id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3 font-medium">{a.email ?? "—"}</td>
                <td className="px-4 py-3">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-mono text-label-sm text-on-surface-variant">{a.user_id.slice(0, 8)}…</td>
              </tr>
            ))}
            {!isLoading && (affiliates ?? []).length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant">No affiliates yet</td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && (
        <AddAffiliateModal
          onSave={(p) => createMut.mutate(p)}
          onCancel={() => setAdding(false)}
          saving={createMut.isPending}
          error={createMut.error instanceof Error ? createMut.error.message : null}
        />
      )}
    </div>
  );
}

function AddAffiliateModal({
  onSave, onCancel, saving, error,
}: {
  onSave: (p: { email: string; password: string }) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-title-md font-semibold">Add affiliate</h2>
        <p className="text-body-sm text-on-surface-variant">
          Creates a user account with the affiliate role. Share the email and password with them; they sign in at <span className="font-mono">/dashboard/login</span>.
        </p>
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-label-sm text-on-surface-variant">Temporary password (min 8 chars)</label>
          <input
            type="text" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono"
          />
        </div>
        {error && <div className="rounded-md bg-error/10 px-3 py-2 text-label-sm text-error">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-body-sm">Cancel</button>
          <button
            disabled={saving || !email || password.length < 8}
            onClick={() => onSave({ email, password })}
            className="rounded-md bg-primary px-4 py-2 text-body-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
