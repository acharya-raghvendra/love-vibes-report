import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function routeByRole(userId: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (data ?? []).map((r: { role: string }) => r.role);
    if (roles.includes("admin")) navigate({ to: "/dashboard", replace: true });
    else if (roles.includes("affiliate")) navigate({ to: "/portal", replace: true });
    else navigate({ to: "/", replace: true });
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) routeByRole(data.user.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error || !data.user) {
      setError(error?.message ?? "Sign in failed");
      return;
    }
    routeByRole(data.user.id);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-label-sm uppercase tracking-widest text-primary">Love Match</div>
          <h1 className="mt-1 text-headline-sm font-semibold text-on-surface">Admin Sign In</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface-container-low p-6 shadow-xl">
          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="rounded-md bg-error/10 px-3 py-2 text-label-sm text-error">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-body-md font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
