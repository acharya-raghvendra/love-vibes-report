import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

const successSearchSchema = z.object({
  order_id: z.string().optional(),
  phone: z.string().optional(),
});

export const Route = createFileRoute("/success")({
  validateSearch: successSearchSchema,
  head: () => ({
    meta: [
      { title: "Payment Successful — Love Match" },
      {
        name: "description",
        content: "Your Love Match compatibility report is being prepared and will arrive on WhatsApp shortly.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function maskPhone(raw: string | undefined): string {
  if (!raw) return "+91 XXXXXXXX21";
  const digits = raw.replace(/\D/g, "").slice(-10);
  if (digits.length < 4) return "+91 XXXXXXXXXX";
  return `+91 ${digits.slice(0, 2)}XXXXXX${digits.slice(-2)}`;
}

function StepDone({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
          <span
            className="material-symbols-outlined text-background"
            style={{ fontSize: "16px", fontVariationSettings: "'wght' 700" }}
          >
            check
          </span>
        </div>
        <div className="absolute top-6 left-1/2 h-8 w-px -translate-x-1/2 bg-primary/30" />
      </div>
      <div>
        <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface">
          {label}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant/70">{sub}</p>
      </div>
    </div>
  );
}

function StepActive({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/50">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        </div>
        <div className="absolute top-6 left-1/2 h-8 w-px -translate-x-1/2 bg-outline-variant/30" />
      </div>
      <div>
        <p className="font-label-md text-label-md uppercase tracking-wider text-primary">
          {label}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant/70">{sub}</p>
      </div>
    </div>
  );
}

function StepPending({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/50">
        <span
          className="material-symbols-outlined text-on-surface-variant/70"
          style={{ fontSize: "14px" }}
        >
          schedule
        </span>
      </div>
      <div>
        <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant/50">{sub}</p>
      </div>
    </div>
  );
}

function SuccessPage() {
  const { phone } = useSearch({ from: "/success" });

  useEffect(() => {
    try {
      sessionStorage.removeItem("loveMatch:input");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="nebula-glow absolute top-[-10%] right-[-10%] h-[70vw] w-[70vw] rounded-full bg-tertiary" />
        <div
          className="nebula-glow absolute bottom-[-10%] left-[-10%] h-[55vw] w-[55vw] rounded-full bg-primary-container"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col items-center px-margin-mobile pt-28 pb-16 lg:px-6">
        {/* Seal */}
        <section className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary-container/20">
            <span className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" aria-hidden="true" />
            <span
              className="material-symbols-outlined relative text-primary"
              style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary">Payment Successful</h1>
          <p className="mt-2 max-w-[300px] font-body-lg text-body-lg text-on-surface-variant">
            Your full report is being prepared by the stars.
          </p>
        </section>

        {/* Status card */}
        <div className="glass-card mb-6 w-full rounded-2xl border border-outline-variant/25 p-8 shadow-2xl">
          <div className="space-y-8">
            <StepDone label="Payment received" sub="Verified & secured" />
            <StepActive label="Generating report" sub="Calculating cosmic alignment…" />
            <StepPending label="Sending on WhatsApp" sub="Awaiting generation" />
          </div>
        </div>

        {/* WhatsApp delivery card */}
        <div className="mb-10 flex w-full items-center gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container/50 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.744-2.834-2.5-2.916-2.61-.086-.109-.67-.891-.67-1.701 0-.81.423-1.209.573-1.371.144-.153.315-.192.42-.192l.3.003c.101.002.212-.005.319.231.109.24.379.921.412.989.033.07.054.15.008.243-.046.092-.07.15-.139.23-.07.081-.149.18-.212.242-.07.07-.143.146-.062.285.081.139.361.595.776.967.534.477.985.626 1.125.696.14.07.223.059.305-.035.081-.094.346-.403.438-.54.092-.138.185-.116.312-.069.127.047.806.38 1.012.433.208.053.277.081.319.15.042.069.042.4-.102.805z" />
            </svg>
          </div>
          <div className="min-w-0 flex-grow">
            <p className="font-label-md text-label-md text-on-surface">
              Deliver to: {maskPhone(phone)}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              PDF will arrive in 2–3 minutes
            </p>
          </div>
        </div>

        {/* Disabled online view CTA */}
        <div className="w-full">
          <button
            type="button"
            disabled
            className="group relative flex h-14 w-full cursor-not-allowed flex-col items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/5 font-label-md text-primary/50"
          >
            <span className="z-10">View Report Online</span>
            <span className="z-10 text-[10px] opacity-60">Waiting for generation…</span>
            <div className="absolute inset-0 -translate-x-full bg-primary/10 transition-transform duration-1000 group-hover:translate-x-full" />
          </button>
        </div>

        {/* Support */}
        <footer className="mt-auto pt-10 text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Didn't receive it?
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
              className="ml-1 font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-all hover:decoration-primary"
            >
              WhatsApp us
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
