import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_affiliate/portal/coupons")({
  component: MyCouponsPage,
});

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_amount: number;
  is_active: boolean;
  usage_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
};

function MyCouponsPage() {
  const { user } = useRole();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    enabled: !!user,
    queryKey: ["affiliate-coupons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupon_codes")
        .select("*")
        .eq("affiliate_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function statusOf(c: Coupon): { label: string; tone: string } {
    if (!c.is_active) return { label: "Inactive", tone: "bg-surface-container-high text-on-surface-variant" };
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: "Expired", tone: "bg-error/15 text-error" };
    if (c.max_uses !== null && c.usage_count >= c.max_uses) return { label: "Limit Reached", tone: "bg-surface-container-high text-on-surface-variant" };
    return { label: "Active", tone: "bg-green-500/15 text-green-500" };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-semibold">My Coupons</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Share these codes to earn referrals</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-body-sm">
          <thead className="bg-surface-container text-left text-label-sm text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(coupons ?? []).map((c) => {
              const s = statusOf(c);
              const link = `${window.location.origin}/?coupon=${encodeURIComponent(c.code)}`;
              return (
                <tr key={c.id} className="hover:bg-surface-container/50">
                  <td className="px-4 py-3"><code className="font-mono font-bold text-body-md">{c.code}</code></td>
                  <td className="px-4 py-3">
                    {c.discount_type === "percentage" ? `${c.discount_amount}% off` : `₹${c.discount_amount} off`}
                  </td>
                  <td className="px-4 py-3">{c.usage_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ""}</td>
                  <td className="px-4 py-3">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-label-sm ${s.tone}`}>{s.label}</span></td>
                  <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                    <button onClick={() => copy(c.code, `code-${c.id}`)} className="text-primary hover:underline">
                      {copied === `code-${c.id}` ? "Copied!" : "Copy code"}
                    </button>
                    <button onClick={() => copy(link, `link-${c.id}`)} className="text-primary hover:underline">
                      {copied === `link-${c.id}` ? "Copied!" : "Copy link"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && (coupons ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">You don't have any coupon codes yet. Contact admin to get one assigned.</td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
