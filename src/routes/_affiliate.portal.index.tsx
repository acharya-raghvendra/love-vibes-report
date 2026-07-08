import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_affiliate/portal/")({
  component: AffiliateHome,
});

type Stats = { totalCoupons: number; totalSales: number; totalRevenue: number; totalDiscount: number };

function AffiliateHome() {
  const { user } = useRole();

  const { data: stats, isLoading } = useQuery<Stats>({
    enabled: !!user,
    queryKey: ["affiliate-stats", user?.id],
    queryFn: async () => {
      const { data: coupons } = await supabase
        .from("coupon_codes")
        .select("code")
        .eq("affiliate_user_id", user!.id);
      const codes = (coupons ?? []).map((c: { code: string }) => c.code);
      if (codes.length === 0) {
        return { totalCoupons: 0, totalSales: 0, totalRevenue: 0, totalDiscount: 0 };
      }
      const { data: orders } = await supabase
        .from("love_match_orders")
        .select("final_price, discount_applied, status")
        .in("coupon_code", codes)
        .eq("status", "delivered");
      const totalRevenue = (orders ?? []).reduce((s: number, o: { final_price: number | null }) => s + (o.final_price ?? 0), 0);
      const totalDiscount = (orders ?? []).reduce((s: number, o: { discount_applied: number | null }) => s + (o.discount_applied ?? 0), 0);
      return {
        totalCoupons: codes.length,
        totalSales: (orders ?? []).length,
        totalRevenue,
        totalDiscount,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-semibold">Welcome back</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Track your referrals and earnings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="My Coupons" value={stats?.totalCoupons ?? 0} icon="sell" hint="Active coupon codes" loading={isLoading} />
        <StatCard label="Total Sales" value={stats?.totalSales ?? 0} icon="trending_up" hint="Reports delivered" loading={isLoading} />
        <StatCard label="Total Revenue" value={`₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`} icon="currency_rupee" hint="From your referrals" loading={isLoading} />
      </div>

      <div className="rounded-2xl border border-border bg-surface-container-low p-6">
        <h2 className="text-title-md font-semibold">Quick tips</h2>
        <ol className="mt-4 space-y-3 text-body-md text-on-surface-variant">
          <li><span className="font-semibold text-on-surface">1. Share your coupon code</span> — copy it from <em>My Coupons</em> and share with your audience for a discount at checkout.</li>
          <li><span className="font-semibold text-on-surface">2. Track your sales</span> — see every delivered order under <em>My Sales</em>, filter by date.</li>
          <li><span className="font-semibold text-on-surface">3. Grow your network</span> — the more you share, the more you earn.</li>
        </ol>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, hint, loading }: { label: string; value: string | number; icon: string; hint: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-container-low p-5">
      <div className="flex items-center justify-between">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
      </div>
      <div className="mt-2 text-headline-md font-semibold text-on-surface">
        {loading ? "—" : value}
      </div>
      <div className="mt-1 text-label-sm text-on-surface-variant">{hint}</div>
    </div>
  );
}
