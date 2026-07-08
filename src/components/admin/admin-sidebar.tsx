import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

const items = [
  { to: "/dashboard", label: "Overview", icon: "dashboard" },
  { to: "/dashboard/orders", label: "Orders", icon: "receipt_long" },
  { to: "/dashboard/coupons", label: "Coupons", icon: "sell" },
  { to: "/dashboard/pricing", label: "Pricing", icon: "payments" },
  { to: "/dashboard/failures", label: "Delivery Failures", icon: "error" },
  { to: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/dashboard/login", replace: true });
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface-container-low">
      <div className="px-5 py-6">
        <div className="text-label-sm uppercase tracking-widest text-primary">Love Match</div>
        <div className="mt-1 text-title-md font-semibold text-on-surface">Admin</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active =
            item.to === "/dashboard"
              ? pathname === "/dashboard"
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
  );
}
