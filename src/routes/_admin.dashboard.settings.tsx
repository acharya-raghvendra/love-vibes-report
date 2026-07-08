import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";

export const Route = createFileRoute("/_admin/dashboard/settings")({
  ssr: false,
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAdmin();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user?.email) {
      setError("No signed-in user found.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (next === current) {
      setError("New password must be different from the current password.");
      return;
    }

    setLoading(true);
    // 1. Verify current password by re-authenticating.
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInErr) {
      setLoading(false);
      setError("Current password is incorrect.");
      return;
    }

    // 2. Update to the new password.
    const { error: updateErr } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    toast.success("Password updated");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-headline-sm font-semibold text-on-surface">Settings</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Manage your admin account.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface-container-low p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-title-md font-semibold text-on-surface">Change password</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Signed in as <span className="text-on-surface">{user?.email ?? "…"}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            label="Current password"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={next}
            onChange={setNext}
            show={showNext}
            onToggle={() => setShowNext((v) => !v)}
            autoComplete="new-password"
            hint="At least 8 characters."
          />
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            autoComplete="new-password"
          />

          {error && (
            <div className="rounded-md bg-error/10 px-3 py-2 text-label-sm text-error">{error}</div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-2.5 text-body-md font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-label-sm text-on-surface-variant">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-11 text-body-md text-on-surface outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-2 flex items-center rounded-md px-1.5 text-on-surface-variant hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-xl">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {hint && <p className="mt-1 text-label-sm text-on-surface-variant">{hint}</p>}
    </div>
  );
}
