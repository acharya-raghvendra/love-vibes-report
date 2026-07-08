import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/dashboard/free-report")({
  component: FreeReportPage,
});

type Result = {
  order_id: string;
  status: string;
  pdf_url: string | null;
  email_sent: boolean;
  failure_reason?: string | null;
};


function FreeReportPage() {
  const [aFirst, setAFirst] = useState("");
  const [aLast, setALast] = useState("");
  const [aDob, setADob] = useState("");
  const [phone, setPhone] = useState("");
  const [bFirst, setBFirst] = useState("");
  const [bLast, setBLast] = useState("");
  const [bDob, setBDob] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
  }, []);

  function startPolling(orderId: string) {
    const startedAt = Date.now();
    const MAX_MS = 3 * 60 * 1000;
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      const { data, error: qErr } = await supabase
        .from("love_match_orders")
        .select("order_id, status, pdf_url, whatsapp_sent, failure_reason")
        .eq("order_id", orderId)
        .maybeSingle();
      if (qErr) return;
      if (!data) return;
      setResult({
        order_id: data.order_id,
        status: data.status,
        pdf_url: data.pdf_url,
        whatsapp_sent: !!data.whatsapp_sent,
        failure_reason: data.failure_reason,
      });
      if (data.status === "delivered" || data.status === "failed") {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setSubmitting(false);
      } else if (Date.now() - startedAt > MAX_MS) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setSubmitting(false);
        setTimedOut(true);
      }
    }, 2000);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setTimedOut(false);
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-create-free-report", {
        body: {
          person_a: { first: aFirst, last: aLast, dob: aDob, phone },
          person_b: { first: bFirst, last: bLast, dob: bDob },
          language,
          send_whatsapp: sendWhatsapp,
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as { order_id?: string; error?: string };
      if (data?.error) throw new Error(data.error);
      if (!data?.order_id) throw new Error("No order_id returned");
      setResult({ order_id: data.order_id, status: "processing", pdf_url: null, whatsapp_sent: false });
      startPolling(data.order_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setSubmitting(false);
    }
  }

  function reset() {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
    setAFirst(""); setALast(""); setADob(""); setPhone("");
    setBFirst(""); setBLast(""); setBDob("");
    setLanguage("en"); setSendWhatsapp(false);
    setResult(null); setError(null); setTimedOut(false);
    setSubmitting(false);
  }


  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-6">
        <h1 className="text-headline-sm font-semibold text-on-surface">Create Free Report</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Generate a full Love Match report at no cost. Runs the same pipeline as a paid order
          (compute → prose → PDF → optional WhatsApp) and stores an order row with final price 0.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-surface-container-low p-6">
        <fieldset className="space-y-3">
          <legend className="text-title-md font-medium text-on-surface">Person A (recipient)</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" value={aFirst} onChange={setAFirst} required />
            <Field label="Last name" value={aLast} onChange={setALast} />
            <Field label="Date of birth" type="date" value={aDob} onChange={setADob} required />
            <Field label="WhatsApp phone (with country code)" value={phone} onChange={setPhone} placeholder="91XXXXXXXXXX" />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-title-md font-medium text-on-surface">Person B (partner)</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" value={bFirst} onChange={setBFirst} required />
            <Field label="Last name" value={bLast} onChange={setBLast} />
            <Field label="Date of birth" type="date" value={bDob} onChange={setBDob} required />
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-label-md text-on-surface-variant">Language</span>
            <select
              className="rounded-lg border border-border bg-surface px-3 py-2 text-body-md"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </label>
          <label className="mt-6 flex items-center gap-2 text-body-md text-on-surface">
            <input
              type="checkbox"
              checked={sendWhatsapp}
              onChange={(e) => setSendWhatsapp(e.target.checked)}
            />
            Send PDF via WhatsApp (requires phone)
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-body-sm text-error">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary px-5 py-2 text-label-lg text-on-primary transition-opacity disabled:opacity-60"
          >
            {submitting ? "Generating (30–60s)…" : "Generate free report"}
          </button>
          {result && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-border px-5 py-2 text-label-lg text-on-surface"
            >
              Create another
            </button>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-6 space-y-2 rounded-2xl border border-border bg-surface-container-low p-6">
          {result.status === "delivered" && (
            <div className="text-title-md font-medium text-on-surface">Delivered ✓</div>
          )}
          {result.status === "failed" && (
            <div className="text-title-md font-medium text-error">
              Failed: {result.failure_reason ?? "unknown reason"}
            </div>
          )}
          {result.status !== "delivered" && result.status !== "failed" && (
            <div className="flex items-center gap-2 text-title-md font-medium text-on-surface">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              {timedOut
                ? "Still generating — check the Orders page in a minute"
                : "Generating (30–90s)…"}
            </div>
          )}
          <div className="text-body-md text-on-surface-variant">
            Order <span className="font-mono">{result.order_id}</span>
          </div>
          {result.pdf_url && (
            <a
              href={result.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-full bg-primary px-4 py-1.5 text-label-lg text-on-primary"
            >
              Open PDF
            </a>
          )}
          {result.status === "delivered" && (
            <div className="text-body-sm text-on-surface-variant">
              WhatsApp: {result.whatsapp_sent ? "sent" : "not sent"}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-md text-on-surface-variant">
        {label}{required && <span className="text-error"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-body-md"
      />
    </label>
  );
}
