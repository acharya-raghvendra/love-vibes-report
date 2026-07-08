import { createFileRoute, Outlet, Navigate, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_affiliate")({
  ssr: false,
  component: AffiliateLayout,
});

const items = [
  { to: "/portal", label: "Overview", icon: "dashboard" },
  { to: "/portal/coupons", label: "My Coupons", icon: "sell" },
  { to: "/portal/sales", label: "My Sales", icon: "trending_up" },
] as const;

function AffiliateLayout() {
  const { loading, user, isAffiliate, isAdmin } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-body-md text-on-surface-variant">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/dashboard/login" replace />;
  if (!isAffiliate && !isAdmin) return <Navigate to="/" replace />;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/dashboard/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface-container-low">
        <div className="px-5 py-6">
          <div className="text-label-sm uppercase tracking-widest text-primary">Love Match</div>
          <div className="mt-1 text-title-md font-semibold text-on-surface">Affiliate</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active =
              item.to === "/portal"
                ? pathname === "/portal"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-body-md transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
