import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAdmin } from "@/hooks/use-admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  component: AdminLayout,
});

function AdminLayout() {
  const { loading, user, isAdmin } = useAdmin();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-body-md text-on-surface-variant">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/dashboard/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
