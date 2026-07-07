import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

const successSearchSchema = z.object({
  order_id: z.string().optional(),
});

export const Route = createFileRoute("/success")({
  validateSearch: successSearchSchema,
  head: () => ({
    meta: [
      { title: "Report Unlocked — Love Match" },
      {
        name: "description",
        content: "Your Love Match compatibility report is on its way to your WhatsApp.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessSeal() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="relative mx-auto flex h-32 w-32 items-center justify-center lg:h-36 lg:w-36">
      {/* Halo rings */}
      <span className="absolute inset-0 rounded-full border border-primary/25" />
      <span className="absolute inset-3 rounded-full border border-primary/20" />
      <span className="absolute inset-6 rounded-full border border-primary/15" />
      {/* Soft glow */}
      <span className="absolute inset-4 rounded-full bg-primary/25 blur-2xl" aria-hidden="true" />
      {/* Gold disc */}
      <span
        className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-container via-primary to-primary-fixed shadow-[0_0_30px_rgba(242,202,80,0.35)] transition-all duration-700 lg:h-24 lg:w-24 ${
          visible ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        <span
          className="material-symbols-outlined text-on-primary-fixed"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 700", fontSize: "3rem" }}
        >
          check
        </span>
      </span>
    </div>
  );
}

function NextStep({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <li className="flex gap-4 py-4">
      <span className="glass-card mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
          {icon}
        </span>
      </span>
      <div className="min-w-0">
        <div className="font-label-md text-label-md uppercase tracking-widest text-primary">
          {title}
        </div>
        <p className="mt-1 font-body-md text-on-surface-variant">{body}</p>
      </div>
    </li>
  );
}

function SuccessPage() {
  const { order_id } = useSearch({ from: "/success" });

  // Clear stored input once the flow completes.
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

      <main className="relative mx-auto flex min-h-screen max-w-[560px] items-center px-margin-mobile pt-28 pb-24 lg:px-6">
        <div className="glass-card relative w-full overflow-hidden rounded-3xl border border-primary/25 p-8 shadow-2xl lg:p-12">
          <span className="ornate-corner top-left" aria-hidden="true" />
          <span className="ornate-corner bottom-right" aria-hidden="true" />

          <div className="text-center">
            <SuccessSeal />

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-container/20 px-4 py-1.5 text-label-sm uppercase tracking-[0.25em] text-primary-fixed">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                verified
              </span>
              Payment received
            </div>

            <h1 className="mt-6 font-display-lg-mobile text-display-lg-mobile text-on-surface lg:text-display-lg">
              Your report is <span className="text-gold-gradient">on its way</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md font-body-lg text-body-lg text-on-surface-variant">
              The cosmos has aligned. Your personalised numerology compatibility report is being prepared and will be delivered shortly.
            </p>
          </div>

          {/* Order reference */}
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-outline-variant/25 bg-surface-container/40 px-5 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                Order Reference
              </div>
              <div className="mt-1 font-mono text-body-md text-on-surface">
                {order_id ? `#${order_id.slice(0, 8).toUpperCase()}` : "Awaiting confirmation"}
              </div>
            </div>
            <span className="material-symbols-outlined text-primary">receipt_long</span>
          </div>

          {/* Next steps */}
          <div className="mt-8">
            <h2 className="text-center font-label-md text-label-md uppercase tracking-widest text-primary">
              What happens next
            </h2>
            <ul className="mt-4 divide-y divide-outline-variant/15">
              <NextStep
                icon="chat"
                title="WhatsApp delivery"
                body="Your full 12-page report arrives on WhatsApp within the next few minutes."
              />
              <NextStep
                icon="mark_email_read"
                title="Email receipt"
                body="A payment receipt has been sent for your records."
              />
              <NextStep
                icon="favorite"
                title="Read together"
                body="Set aside a quiet evening — the insights land deepest when shared."
              />
            </ul>
          </div>

          {/* Trust line */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">lock</span>
            Secured by Razorpay · 7-day satisfaction guarantee
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-surface-container/50 px-6 py-3 font-label-md text-label-md text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              Open WhatsApp
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-container to-primary px-6 py-3 font-label-md text-label-md uppercase tracking-widest text-on-primary-fixed shadow-lg"
            >
              Return home
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
