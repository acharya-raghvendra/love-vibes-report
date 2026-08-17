import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Icon } from "@/components/icon";
import { trackOnce } from "@/lib/meta-pixel";
import { usePageLanguage, type SiteLanguage } from "@/lib/site-language";
import { langHead } from "@/lib/site-seo";

const SUCCESS_META: Record<SiteLanguage, { title: string; description: string }> = {
  hi: {
    title: "Payment successful — आपकी report तैयार हो रही है | TalkToGuruji",
    description:
      "आपकी Love Match report बन रही है और WhatsApp + email पर भेज दी जाएगी.",
  },
  en: {
    title: "Payment Successful — Your Report Is On Its Way | TalkToGuruji",
    description:
      "Your Love Match compatibility report is being prepared and will be sent on WhatsApp and email.",
  },
};

const successSearchSchema = z.object({
  order_id: z.string().optional(),
  phone: z.string().optional(),
});

export const Route = createFileRoute("/$lang/success")({
  validateSearch: successSearchSchema,
  head: ({ params }) => {
    const lang = (params.lang === "en" ? "en" : "hi") as SiteLanguage;
    return langHead({ lang, page: "/success", noindex: true, ...SUCCESS_META[lang] });
  },
  component: SuccessPage,
});

type OrderStatus = {
  status: string;
  ready: boolean;
  delivered: boolean;
  language?: string;
  amount?: number | null;
  email_sent?: boolean;
  whatsapp_sent?: boolean;

  pdf_url: string | null;
  error_message: string | null;
  can_retry: boolean;
};

// Explicit "you can close this page" reassurance — delivery is server-side.
const REASSURANCE: Record<"en" | "hi", string> = {
  en: "Payment received. Your full report is being prepared and will arrive on your WhatsApp and email within a few minutes — you can safely close this page.",
  hi: "Payment mil gaya. Aapki poori report taiyaar ho rahi hai — kuch hi minute me WhatsApp aur email par aa jayegi. Aap yeh page band kar sakte hain.",
};


function maskPhone(raw: string | undefined): string {
  if (!raw) return "+91 XXXXXXXX21";
  const digits = raw.replace(/\D/g, "").slice(-10);
  if (digits.length < 4) return "+91 XXXXXXXXXX";
  return `+91 ${digits.slice(0, 2)}XXXXXX${digits.slice(-2)}`;
}

type StepState = "done" | "active" | "pending" | "failed";

function Step({
  state,
  label,
  sub,
  last,
}: {
  state: StepState;
  label: string;
  sub: string;
  last?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative">
        {state === "done" ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Icon name="check" size={16} className="text-background" />
          </div>
        ) : state === "active" ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/50">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          </div>
        ) : state === "failed" ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-error/60 bg-error/10">
            <Icon name="close" size={14} className="text-error" />
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/50">
            <Icon name="schedule" size={14} className="text-on-surface-variant/70" />
          </div>
        )}
        {!last && (
          <div
            className={`absolute top-6 left-1/2 h-8 w-px -translate-x-1/2 ${
              state === "done" ? "bg-primary/30" : "bg-outline-variant/30"
            }`}
          />
        )}
      </div>
      <div>
        <p
          className={`font-label-md text-label-md uppercase tracking-wider ${
            state === "active"
              ? "text-primary"
              : state === "failed"
                ? "text-error"
                : state === "done"
                  ? "text-on-surface"
                  : "text-on-surface-variant"
          }`}
        >
          {label}
        </p>
        <p
          className={`font-body-md text-body-md ${
            state === "pending" ? "text-on-surface-variant/50" : "text-on-surface-variant/70"
          }`}
        >
          {sub}
        </p>
      </div>
    </div>
  );
}

function SuccessPage() {
  const lang = usePageLanguage();
  const { phone, order_id: orderId } = useSearch({ from: "/$lang/success" });
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    try {
      sessionStorage.removeItem("loveMatch:input");
    } catch {
      /* ignore */
    }
  }, []);

  const fetchStatus = useCallback(async (): Promise<OrderStatus | null> => {
    if (!orderId) return null;
    try {
      const res = await fetch(
        `/api/public/love-match-status?order_id=${encodeURIComponent(orderId)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as OrderStatus;
      setOrder(data);
      return data;
    } catch {
      return null;
    }
  }, [orderId]);

  // Poll status until the order reaches a terminal state.
  useEffect(() => {
    if (!orderId) return;
    stopped.current = false;
    let timer: ReturnType<typeof setTimeout>;
    let elapsed = 0;
    let reconciled = false;

    const tick = async () => {
      const data = await fetchStatus();
      if (stopped.current) return;
      if (data && (data.ready || data.status === "failed")) return;

      // If nothing has started ~25s after payment, the webhook likely never
      // arrived — nudge the reconciler once, then keep polling.
      if (!reconciled && elapsed >= 25_000 && (!data || data.status === "created" || data.status === "paid")) {
        reconciled = true;
        fetch("/api/public/reconcile-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        }).catch(() => {});

      }

      const delay = elapsed < 60_000 ? 4_000 : 8_000;
      elapsed += delay;
      timer = setTimeout(tick, delay);
    };

    tick();
    return () => {
      stopped.current = true;
      clearTimeout(timer);
    };
  }, [orderId, fetchStatus]);

  const onRetry = async () => {
    if (!orderId || retrying) return;
    setRetrying(true);
    setNotice(null);
    try {
      const res = await fetch("/api/public/love-match-retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = (await res.json()) as { error?: string; status?: string };
      if (!res.ok) {
        setNotice(
          data.error === "too_many_attempts"
            ? "Too many attempts. Please message us on WhatsApp and we'll deliver it manually."
            : "Retry couldn't start. Please message us on WhatsApp.",
        );
      } else {
        setNotice(data.status === "failed" ? "Retry failed again." : "Retry started.");
      }
      await fetchStatus();
    } catch {
      setNotice("Retry couldn't start. Please message us on WhatsApp.");
    } finally {
      setRetrying(false);
    }
  };

  // Meta Pixel: Purchase fires only once the server confirms the order left
  // "created" (i.e. payment verified), never on a button click. The eventID is
  // our order_id so a future Conversions API event deduplicates against it.
  useEffect(() => {
    if (!orderId || !order) return;
    const paid = ["paid", "generating", "ready", "delivered"].includes(order.status);
    if (!paid) return;
    trackOnce(
      "Purchase",
      orderId,
      {
        value: typeof order.amount === "number" ? order.amount : undefined,
        currency: "INR",
        language: lang,
      },
      { eventID: orderId },
    );
  }, [orderId, order, lang]);

  const status = order?.status ?? (orderId ? "loading" : "created");
  const isReady = Boolean(order?.ready);
  const isFailed = status === "failed";
  const isGenerating = status === "generating" || status === "paid" || status === "created" || status === "loading";

  const genState: StepState = isFailed ? "failed" : isReady ? "done" : "active";
  const deliverState: StepState = order?.delivered || isReady ? "done" : "pending";

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
            <Icon name="check_circle" size={48} filled className="relative text-primary" />
          </div>
          <h1 className="font-headline-md text-headline-md text-primary">Payment Successful</h1>
          <p className="mt-2 max-w-[340px] font-body-lg text-body-lg text-on-surface-variant">
            {isReady
              ? "Your full report is ready."
              : isFailed
                ? "We hit a snag while preparing your report."
                : REASSURANCE[lang]}
          </p>
        </section>


        {/* Status card */}
        <div className="glass-card mb-6 w-full rounded-2xl border border-outline-variant/25 p-8 shadow-2xl">
          <div className="space-y-8">
            <Step state="done" label="Payment received" sub="Verified & secured" />
            <Step
              state={genState}
              label="Generating report"
              sub={
                isFailed
                  ? (order?.error_message ?? "Generation failed.")
                  : isReady
                    ? "Report generated"
                    : "Calculating cosmic alignment…"
              }
            />
            <Step
              state={deliverState}
              label="Delivering your report"
              sub={
                order?.email_sent
                  ? "Sent to your inbox"
                  : order?.whatsapp_sent
                    ? "Sent on WhatsApp"
                    : order?.delivered
                      ? "Delivered"
                      : isReady
                        ? "Ready to download above"
                        : "Awaiting generation"
              }

              last

            />
          </div>
        </div>

        {isFailed && (
          <div className="mb-6 w-full rounded-2xl border border-error/30 bg-error/5 p-6">
            <p className="font-label-md text-label-md text-error">Report generation failed</p>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              {order?.error_message ?? "Something went wrong."} Your payment is safe — retry below or
              message us and we'll deliver it manually.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {order?.can_retry !== false && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={retrying}
                  className="flex h-11 items-center justify-center rounded-full bg-primary px-6 font-label-md text-on-primary disabled:opacity-60"
                >
                  {retrying ? "Retrying…" : "Retry generation"}
                </button>
              )}
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-center rounded-full border border-outline-variant/40 px-6 font-label-md text-on-surface"
              >
                WhatsApp support
              </a>
            </div>
            {notice && (
              <p className="mt-3 font-body-md text-body-md text-on-surface-variant">{notice}</p>
            )}
          </div>
        )}

        {/* Email delivery card */}
        <div className="mb-10 flex w-full items-center gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container/50 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Icon name="mail" size={22} />
          </div>
          <div className="min-w-0 flex-grow">
            <p className="font-label-md text-label-md text-on-surface">
              Updates on: {maskPhone(phone)}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              Your PDF is emailed to you and stays available here for 30 days
            </p>
          </div>
        </div>

        {/* Online view CTA */}
        <div className="w-full">
          {isReady && order?.pdf_url ? (
            <a
              href={order.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="flex h-14 w-full items-center justify-center rounded-full bg-primary font-label-md text-on-primary shadow-lg transition-transform hover:scale-[1.01]"
            >
              View Report Online
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="group relative flex h-14 w-full cursor-not-allowed flex-col items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/5 font-label-md text-primary/50"
            >
              <span className="z-10">View Report Online</span>
              <span className="z-10 text-[10px] opacity-60">
                {isFailed ? "Unavailable — retry above" : isGenerating ? "Waiting for generation…" : "Waiting…"}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-primary/10 transition-transform duration-1000 group-hover:translate-x-full" />
            </button>
          )}
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
