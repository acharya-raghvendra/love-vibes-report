import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/preview")({
  head: () => ({
    meta: [
      { title: "Your Compatibility Preview — Love Match" },
      {
        name: "description",
        content: "Preview your cosmic compatibility score and unlock the full 12-page numerology report.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PreviewPage,
});

type InputPayload = {
  person_a: { first: string; last: string; dob: string; phone: string };
  person_b: { first: string; last: string; dob: string };
};

type PreviewData = {
  order_id: string;
  data: {
    score: number;
    band: string;
    names: { a: string; b: string };
    shared?: string[];
    chemistry_teaser: { level: string };
  };
};

type OrderQuote = {
  orderId: string;
  internalOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  originalPrice: number;
  discountApplied: number;
  finalPrice: number;
};

const LOCKED_SECTIONS = [
  { icon: "favorite", label: "Full Chemistry Breakdown" },
  { icon: "psychology", label: "Destiny Number Compatibility" },
  { icon: "self_improvement", label: "Soul Urge Alignment" },
  { icon: "auto_stories", label: "Personality Number Blend" },
  { icon: "route", label: "Life Path Journey Together" },
  { icon: "cake", label: "Birthday Number Insights" },
  { icon: "insights", label: "Personal Year Forecast" },
  { icon: "handshake", label: "Communication Style Guide" },
  { icon: "shield", label: "Conflict Resolution Map" },
  { icon: "diamond", label: "Long-term Cosmic Outlook" },
];

const CHEMISTRY_TEASERS: Record<string, string> = {
  strong_pull:
    "There's a magnetic pull between your numbers — an undeniable gravitational force that draws your souls together almost effortlessly.",
  warm_spark:
    "A warm, quietly humming spark lives between you — the kind of chemistry that grows richer with every shared season.",
  slow_burn:
    "Yours is a slow-burn resonance — the numbers whisper of a bond that reveals its depth over time rather than in a single moment.",
  opposites_tension:
    "The tension between your charts creates the classic opposites-attract pattern — full of friction, growth, and unexpected fireworks.",
};


function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function formatDob(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function ScoreDial({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const size = 240;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const dashOffset = circumference - (display / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="scoreGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary-container)" />
            <stop offset="60%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-fixed)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--outline-variant)"
          strokeOpacity="0.35"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#scoreGold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-gold-gradient leading-none"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "4.5rem" }}
        >
          {display}
          <span style={{ fontSize: "1.75rem", verticalAlign: "top", marginLeft: "0.15em" }}>%</span>
        </span>
        <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-primary">
          Compatibility
        </span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="mx-auto h-6 w-64 rounded-full bg-surface-container" />
      <div className="mx-auto h-60 w-60 rounded-full bg-surface-container" />
      <div className="mx-auto h-4 w-40 rounded-full bg-surface-container" />
      <div className="space-y-3">
        <div className="h-3 w-3/4 rounded-full bg-surface-container" />
        <div className="h-3 w-full rounded-full bg-surface-container" />
        <div className="h-3 w-2/3 rounded-full bg-surface-container" />
      </div>
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-primary/30 bg-background/90 px-4 py-2 text-label-sm text-on-surface shadow-xl backdrop-blur-xl lg:bottom-8">
      {msg}
    </div>
  );
}

function PreviewPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState<InputPayload | null>(null);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error" }
    | { kind: "ready"; data: PreviewData }
  >({ kind: "loading" });
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // Read input from session storage; bounce to /input if missing.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("loveMatch:input");
      if (!raw) {
        navigate({ to: "/input" });
        return;
      }
      setInput(JSON.parse(raw) as InputPayload);
    } catch {
      navigate({ to: "/input" });
    }
  }, [navigate]);

  const fetchPreview = useCallback(async (payload: InputPayload) => {
    setState({ kind: "loading" });
    try {
      const { data, error } = await supabase.functions.invoke("love-match-generate", {
        body: {
          person_a: {
            first: payload.person_a.first,
            last: payload.person_a.last,
            dob: payload.person_a.dob,
          },
          person_b: {
            first: payload.person_b.first,
            last: payload.person_b.last,
            dob: payload.person_b.dob,
          },
          language: "en",
        },
      });
      if (error || !data?.data) throw new Error("preview_failed");
      setState({ kind: "ready", data: data as PreviewData });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    if (input) fetchPreview(input);
  }, [input, fetchPreview]);

  const chemistryText = useMemo(() => {
    if (state.kind !== "ready") return "";
    return (
      CHEMISTRY_TEASERS[state.data.data.chemistry_teaser.level] ??
      CHEMISTRY_TEASERS.warm_spark
    );
  }, [state]);

  async function onUnlock() {
    if (!input || paying) return;
    setPaying(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) {
        showToast("Couldn't load payment. Please try again.");
        setPaying(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-love-match-order", {
        body: {
          person_a: {
            first: input.person_a.first,
            last: input.person_a.last,
            dob: input.person_a.dob,
            phone: input.person_a.phone,
          },
          person_b: {
            first: input.person_b.first,
            last: input.person_b.last,
            dob: input.person_b.dob,
          },
          language: "en",
        },
      });
      if (error || !data?.orderId) {
        showToast("Payment could not start. Try again.");
        setPaying(false);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Love Match",
        description: "Compatibility Report",
        order_id: data.orderId,
        prefill: {
          name: `${input.person_a.first} ${input.person_a.last}`.trim(),
          contact: input.person_a.phone,
        },
        theme: { color: "#f2ca50" },
        handler: () => {
          navigate({ to: "/success", search: { order_id: data.internalOrderId, phone: input.person_a.phone } });
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            showToast("Payment cancelled. Ready when you are.");
          },
        },
      });
      rzp.on("payment.failed", () => {
        setPaying(false);
        showToast("Payment failed. Please retry.");
      });
      rzp.open();
    } catch {
      showToast("Something went wrong. Retry.");
      setPaying(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="nebula-glow absolute top-[-10%] right-[-10%] h-[70vw] w-[70vw] rounded-full bg-tertiary" />
        <div
          className="nebula-glow absolute bottom-[-10%] left-[-10%] h-[55vw] w-[55vw] rounded-full bg-primary-container"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <main className="relative mx-auto max-w-[720px] px-margin-mobile pt-28 pb-32 lg:pt-32 lg:pb-24 lg:px-6">
        {state.kind === "loading" && (
          <div className="glass-card rounded-3xl border border-outline-variant/25 p-8 lg:p-12">
            <Skeleton />
          </div>
        )}

        {state.kind === "error" && (
          <div className="glass-card rounded-3xl border border-outline-variant/25 p-8 text-center lg:p-12">
            <span className="material-symbols-outlined text-5xl text-primary">error</span>
            <h2 className="mt-4 font-headline-sm text-headline-sm text-on-surface">
              We couldn't read the stars just now
            </h2>
            <p className="mt-2 font-body-md text-on-surface-variant">
              Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => input && fetchPreview(input)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary-fixed"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Try again
            </button>
          </div>
        )}

        {state.kind === "ready" && input && (
          <>
            {/* Names + heart */}
            <section className="mb-10 text-center">
              <div className="flex items-center justify-center gap-4 sm:gap-8">
                <div className="min-w-0 flex-1 text-right">
                  <div className="font-headline-sm text-headline-sm truncate text-on-surface">
                    {state.data.data.names.a}
                  </div>
                  <div className="mt-1 text-label-sm uppercase tracking-widest text-on-surface-variant">
                    {formatDob(input.person_a.dob)}
                  </div>
                </div>
                <div className="relative shrink-0">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: "2.5rem" }}
                  >
                    favorite
                  </span>
                  <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/20 blur-md" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-headline-sm text-headline-sm truncate text-on-surface">
                    {state.data.data.names.b}
                  </div>
                  <div className="mt-1 text-label-sm uppercase tracking-widest text-on-surface-variant">
                    {formatDob(input.person_b.dob)}
                  </div>
                </div>
              </div>
            </section>

            {/* Score dial */}
            <section className="mb-10 flex flex-col items-center">
              <ScoreDial score={state.data.data.score} />
              <div className="mt-6 rounded-full border border-primary/30 bg-primary-container/20 px-5 py-2 font-label-md text-label-md uppercase tracking-widest text-primary-fixed">
                {state.data.data.band}
              </div>
            </section>

            {/* Chemistry teaser */}
            <section className="mb-10">
              <h2 className="mb-4 text-center font-headline-sm text-headline-sm text-on-surface">
                Your Chemistry
              </h2>
              <div className="glass-card relative overflow-hidden rounded-2xl border border-outline-variant/25 p-6 lg:p-8">
                <p className="font-body-lg text-body-lg text-on-surface">
                  {chemistryText.split(". ").slice(0, 2).join(". ")}
                  {chemistryText.split(". ").length > 2 ? "." : ""}
                </p>
                <div className="relative mt-4">
                  <p className="font-body-lg text-body-lg text-on-surface-variant blur-[6px] select-none">
                    Beyond this, the numbers describe how your daily rhythms
                    align, where friction is most likely to arise, and which
                    years will bring your deepest bonding — a full narrative
                    of what your shared path looks like across decades.
                  </p>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-4 py-2 backdrop-blur-md">
                      <span className="material-symbols-outlined text-primary text-base">
                        lock
                      </span>
                      <span className="text-label-sm uppercase tracking-widest text-primary">
                        Unlock to read more
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Locked sections */}
            <section className="mb-10">
              <h3 className="mb-4 text-center font-label-md text-label-md uppercase tracking-widest text-primary">
                In Your Full Report
              </h3>
              <ul className="glass-card divide-y divide-outline-variant/15 rounded-2xl border border-outline-variant/25 overflow-hidden">
                {LOCKED_SECTIONS.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <span className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary/80">
                        {s.icon}
                      </span>
                      <span className="font-body-md text-on-surface">{s.label}</span>
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant/60">
                      lock
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Desktop inline CTA */}
            <section className="hidden lg:block">
              <div className="glass-card rounded-2xl border border-primary/25 p-8 text-center shadow-2xl">
                <div className="mb-2 text-label-sm uppercase tracking-widest text-primary">
                  Limited introductory price
                </div>
                <div className="mb-1 flex items-baseline justify-center gap-3">
                  <span
                    className="text-gold-gradient"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "3rem" }}
                  >
                    ₹{BASE_PRICE}
                  </span>
                  <span className="text-body-lg text-on-surface-variant line-through">
                    ₹{STRIKE_PRICE}
                  </span>
                </div>
                <p className="mx-auto mb-6 max-w-md font-body-md text-on-surface-variant">
                  One-time payment. Instant access to your full 12-page numerology compatibility report.
                </p>
                <button
                  type="button"
                  onClick={onUnlock}
                  disabled={paying}
                  className="shimmer mx-auto inline-flex items-center justify-center gap-3 rounded-full px-10 py-4 font-bold text-on-primary-fixed shadow-[0_0_20px_rgba(242,202,80,0.3)] transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  {paying ? "Opening checkout…" : "Unlock Full Report"}
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Mobile sticky CTA */}
      {state.kind === "ready" && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-primary/20 bg-background/85 p-4 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-container-max items-center gap-3">
            <div className="flex flex-col leading-tight">
              <span className="flex items-baseline gap-2">
                <span
                  className="text-gold-gradient"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.5rem" }}
                >
                  ₹{BASE_PRICE}
                </span>
                <span className="text-label-sm text-on-surface-variant line-through">
                  ₹{STRIKE_PRICE}
                </span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-primary">
                Full Report
              </span>
            </div>
            <button
              type="button"
              onClick={onUnlock}
              disabled={paying}
              className="shimmer flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-label-md text-label-md uppercase tracking-widest text-on-primary-fixed shadow-lg disabled:opacity-70"
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock_open
              </span>
              {paying ? "…" : "Unlock"}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} />}

      <div className="hidden">
        <Link to="/input">back</Link>
      </div>
    </div>
  );
}
