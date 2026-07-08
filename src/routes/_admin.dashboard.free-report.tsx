import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/dashboard/free-report")({
  component: FreeReportPage,
});

type Result = {
  order_id: string;
  status: string;
  pdf_url: string | null;
  whatsapp_sent: boolean;
  score: number;
  band: string;
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
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
      const data = res.data as Result & { error?: string };
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAFirst(""); setALast(""); setADob(""); setPhone("");
    setBFirst(""); setBLast(""); setBDob("");
    setLanguage("en"); setSendWhatsapp(false);
    setResult(null); setError(null);
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
          <div className="text-title-md font-medium text-on-surface">Delivered ✓</div>
          <div className="text-body-md text-on-surface-variant">
            Order <span className="font-mono">{result.order_id}</span> · Score {result.score} ({result.band})
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
          <div className="text-body-sm text-on-surface-variant">
            WhatsApp: {result.whatsapp_sent ? "sent" : "not sent"}
          </div>
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
