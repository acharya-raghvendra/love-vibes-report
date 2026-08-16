import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { supabase } from "@/integrations/supabase/client";
import { couponSearch, resolveCoupon, storeCoupon, validateCouponSearch } from "@/lib/coupon-link";
import { trackOnce } from "@/lib/meta-pixel";


export const Route = createFileRoute("/preview")({
  validateSearch: validateCouponSearch,
  head: () => ({
    meta: [
      { title: "Your Compatibility Preview — Love Match" },
      {
        name: "description",
        content:
          "Preview your cosmic compatibility score and unlock the full 12-page numerology report.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PreviewPage,
});

type InputPayload = {
  person_a: { first: string; last: string; dob: string; phone: string; email?: string };
  person_b: { first: string; last: string; dob: string };
  language?: "en" | "hi";
};

type PreviewDimension = {
  key: string;
  name: string;
  locked: boolean;
  verdict?: "strong" | "workable" | "friction";
  verdictLabel?: string;
};

// Everything below is produced server-side by love-match-generate. Nothing on
// this page computes report content, and no locked prose is ever received.
type PreviewData = {
  order_id: string;
  data: {
    score: number;
    band: string;
    names: { a: string; b: string };
    shared?: string[];
    chemistry_teaser: { level: string };
    band_label: string;
    score_line: string;
    dimensions: PreviewDimension[];
    life_paths: { name: string; number: number; heading: string; reading: string }[];
    chemistry: { visible: string };
    friction_line: string;
    locked_sections: { icon: string; title: string; line: string }[];
    specs_line: string;
    refund_line: string;
    refund_link_label: string;
    headings: Record<string, string>;
  };
};

type OrderQuote = {
  orderId: string;
  internalOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  listPrice: number;
  originalPrice: number;
  discountApplied: number;
  finalPrice: number;
};

// Single source of truth for every price rendered on this page.
type Pricing = {
  listPrice: number;
  originalPrice: number;
  discountApplied: number;
  finalAmount: number;
};

// Saving shown on the card is always strikethrough − final price (whole rupees),
// never just the coupon cut, so it matches the two numbers on screen.
function savingsFrom(p: Pricing): { amount: number; percent: number } {
  const amount = Math.round(p.listPrice - p.finalAmount);
  const percent = p.listPrice > 0 ? Math.round((amount / p.listPrice) * 100) : 0;
  return { amount, percent };
}

// Gateway handoff data only — never read for display.
type GatewayOrder = {
  orderId: string;
  internalOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  couponCode: string | null;
};

// Locked-section titles/lines and the readable chemistry paragraph now come
// from the server response; nothing about report content lives in this bundle.
// The only local strings are the pre-payload loading/error states, which by
// definition cannot use server copy.
const ERROR_COPY = {
  en: {
    title: "We couldn't read the stars just now",
    body: "Please try again in a moment.",
    retry: "Try again",
  },
  hi: {
    title: "Abhi sitare padhe nahi ja sake",
    body: "Kuch pal baad dobara koshish karein.",
    retry: "Dobara koshish karein",
  },
} as const;



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
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

// Display-only: "raghav kumar" → "Raghav Kumar". Never used for anything sent
// to the server; the stored order keeps whatever the user typed.
function titleCase(s: string): string {
  return s.replace(/(^|[\s'’-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

// Purely decorative blurred bars standing in for locked prose. No report text
// is rendered here — the strings below are non-existent; only empty divs.
function LockTease() {
  const widths = ["96%", "88%", "93%", "62%"];
  return (
    <div aria-hidden="true" className="lock-tease mt-4 space-y-2.5">
      {widths.map((w, i) => (
        <div key={i} className="lock-tease-bar" style={{ width: w }} />
      ))}
    </div>
  );
}

// Abstract mock of the delivered PDF — generic lines and a heart, no content.
function ReportMock({ title, line }: { title?: string; line?: string }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-4">
      <div aria-hidden="true" className="relative h-28 w-22 shrink-0">
        <div className="absolute inset-0 translate-x-2 translate-y-1 rotate-6 rounded-lg border border-outline-variant/30 bg-surface-container/70" />
        <div className="absolute inset-0 -rotate-3 rounded-lg border border-primary/30 bg-background/80 p-2.5">
          <div className="mx-auto mb-2 flex h-5 w-5 items-center justify-center">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: "1rem" }}
            >
              favorite
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="h-1 w-full rounded-full bg-primary/40" />
            <div className="h-1 w-4/5 rounded-full bg-on-surface/15" />
            <div className="h-1 w-full rounded-full bg-on-surface/15" />
            <div className="h-1 w-3/5 rounded-full bg-on-surface/15" />
            <div className="h-1 w-11/12 rounded-full bg-on-surface/15" />
            <div className="h-1 w-2/3 rounded-full bg-on-surface/15" />
          </div>
        </div>
      </div>
      <div className="text-left">
        <div className="font-label-md text-label-md text-on-surface">{title}</div>
        <div className="mt-1 text-label-sm text-on-surface-variant">{line}</div>
      </div>
    </div>
  );
}

function ScoreDial({ score, label }: { score: number; label: string }) {
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
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
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
          {label}
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
  const { coupon: urlCoupon } = Route.useSearch();
  // Coupon carried from the affiliate link / earlier funnel step.
  const [carriedCoupon, setCarriedCoupon] = useState<string | null>(null);
  const autoAppliedRef = useRef(false);
  useEffect(() => {
    setCarriedCoupon(resolveCoupon(urlCoupon));
  }, [urlCoupon]);
  const [input, setInput] = useState<InputPayload | null>(null);
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "error" } | { kind: "ready"; data: PreviewData }
  >({ kind: "loading" });
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [order, setOrder] = useState<GatewayOrder | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  // Bumped on every coupon apply/remove; late in-flight responses with an
  // older generation are discarded so they cannot clobber the shown price.
  const priceGenRef = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // Floating CTA: shown only after the score section leaves the viewport, and
  // hidden again whenever the price card itself is on screen.
  const scoreRef = useRef<HTMLElement | null>(null);
  const priceRef = useRef<HTMLElement | null>(null);
  const [scoreVisible, setScoreVisible] = useState(true);
  const [priceVisible, setPriceVisible] = useState(false);

  useEffect(() => {
    if (state.kind !== "ready") return;
    const observers: IntersectionObserver[] = [];
    const watch = (el: Element | null, set: (v: boolean) => void) => {
      if (!el) return;
      const io = new IntersectionObserver(([e]) => set(e.isIntersecting), { threshold: 0.05 });
      io.observe(el);
      observers.push(io);
    };
    watch(scoreRef.current, setScoreVisible);
    watch(priceRef.current, setPriceVisible);
    return () => observers.forEach((o) => o.disconnect());
  }, [state.kind]);

  const showFloatingCta = state.kind === "ready" && !scoreVisible && !priceVisible;

  const scrollToPrice = useCallback(() => {
    priceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);


  // Read input from session storage; bounce to /input if missing (keeping the coupon).
  useEffect(() => {
    const back = () => navigate({ to: "/input", search: couponSearch(resolveCoupon(urlCoupon)) });
    try {
      const raw = sessionStorage.getItem("loveMatch:input");
      if (!raw) {
        back();
        return;
      }
      setInput(JSON.parse(raw) as InputPayload);
    } catch {
      back();
    }
  }, [navigate, urlCoupon]);

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
          language: payload.language ?? "hi",
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

  // Server-sent copy dictionary for the static UI strings (EN/HI).
  const t = useMemo<Record<string, string>>(
    () => (state.kind === "ready" ? (state.data.data.headings ?? {}) : {}),
    [state],
  );
  const lang: "en" | "hi" = input?.language === "en" ? "en" : "hi";

  const createOrder = useCallback(
    async (couponCode: string | null): Promise<OrderQuote | null> => {
      if (!input) return null;
      const { data, error } = await supabase.functions.invoke("create-love-match-order", {
        body: {
          person_a: {
            first: input.person_a.first,
            last: input.person_a.last,
            dob: input.person_a.dob,
            phone: input.person_a.phone,
            email: input.person_a.email,
          },
          person_b: {
            first: input.person_b.first,
            last: input.person_b.last,
            dob: input.person_b.dob,
          },
          language: input.language ?? "hi",
          // No amount is ever sent; the server is authoritative on price.
          couponCode: couponCode ?? undefined,
        },
      });
      if (error || !data?.orderId) return null;
      return data as OrderQuote;
    },
    [input],
  );

  // Pre-fetch server-authoritative pricing once the preview is ready.
  useEffect(() => {
    if (state.kind !== "ready" || !input || pricing) return;
    const gen = priceGenRef.current;
    (async () => {
      const q = await createOrder(null);
      if (!q || gen !== priceGenRef.current) return; // stale — a coupon was applied meanwhile
      setPricing({
        listPrice: q.listPrice,
        originalPrice: q.originalPrice,
        discountApplied: q.discountApplied,
        finalAmount: q.finalPrice,
      });
      setOrder({
        orderId: q.orderId,
        internalOrderId: q.internalOrderId,
        amount: q.amount,
        currency: q.currency,
        keyId: q.keyId,
        couponCode: null,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind, input]);

  // Meta Pixel: ViewContent once per couple per session, with the live price.
  // Keyed off the couple (not the server order id, which is regenerated on
  // every preview render) so refresh and back/forward never re-fire it.
  useEffect(() => {
    if (state.kind !== "ready" || !pricing || !input) return;
    const key = `${input.person_a.first}|${input.person_a.dob}|${input.person_b.first}|${input.person_b.dob}`;
    trackOnce("ViewContent", key, {
      value: Math.round(pricing.finalAmount),
      currency: "INR",
    });
  }, [state, pricing, input]);


  // Single apply path for the box and for an auto-applied carried coupon.
  const applyCoupon = useCallback(
    async (rawCode: string, opts: { silent?: boolean } = {}) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return;
      setApplyingCoupon(true);
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { code },
      });
      setApplyingCoupon(false);
      if (error || !data) {
        if (!opts.silent) showToast("Couldn't apply coupon. Try again.");
        return;
      }
      if (!data.valid) {
        // Server rejected it (unknown / inactive / expired / exhausted) —
        // pricing stays at the base price and the code is not marked applied.
        showToast(data.error ?? "Invalid coupon code");
        return;
      }
      priceGenRef.current += 1; // invalidate any in-flight base-price response
      setPricing({
        listPrice: data.listPrice,
        originalPrice: data.originalPrice,
        discountApplied: data.calculatedDiscount,
        finalAmount: data.originalPrice - data.calculatedDiscount,
      });
      setOrder(null); // existing gateway order is stale; a fresh one is created on unlock
      setAppliedCoupon(code);
      setCouponInput(code);
      storeCoupon(code);
      showToast(`Coupon applied — you saved ₹${data.calculatedDiscount}`);
    },
    [showToast],
  );

  // Auto-apply a coupon carried from the affiliate link / earlier step, once.
  useEffect(() => {
    if (!carriedCoupon || autoAppliedRef.current || appliedCoupon || paying) return;
    if (state.kind !== "ready") return;
    autoAppliedRef.current = true;
    setCouponInput(carriedCoupon);
    void applyCoupon(carriedCoupon, { silent: true });
  }, [carriedCoupon, appliedCoupon, paying, state.kind, applyCoupon]);

  async function onApplyCoupon() {
    if (applyingCoupon || paying) return;
    await applyCoupon(couponInput);
  }

  function onRemoveCoupon() {
    priceGenRef.current += 1;
    setAppliedCoupon(null);
    setCouponInput("");
    setOrder(null);
    setPricing((prev) =>
      prev ? { ...prev, discountApplied: 0, finalAmount: prev.originalPrice } : prev,
    );
    // Clear the mirror and the URL param so it cannot silently come back.
    autoAppliedRef.current = true;
    setCarriedCoupon(null);
    storeCoupon(null);
    if (urlCoupon) navigate({ to: "/preview", search: {}, replace: true });
  }

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
      // Applied code wins; otherwise fall back to the code carried in the
      // URL/session so a discount can never be lost at the last step. The
      // server re-validates it and recomputes the price either way.
      const effectiveCoupon = appliedCoupon ?? carriedCoupon;
      let o = order && order.couponCode === effectiveCoupon ? order : null;
      if (!o) {
        const gen = priceGenRef.current;
        const q = await createOrder(effectiveCoupon);
        if (!q) {
          showToast("Payment could not start. Try again.");
          setPaying(false);
          return;
        }
        o = {
          orderId: q.orderId,
          internalOrderId: q.internalOrderId,
          amount: q.amount,
          currency: q.currency,
          keyId: q.keyId,
          couponCode: effectiveCoupon,
        };
        if (gen === priceGenRef.current) {
          // Reconcile the displayed amount with the authoritative server price.
          setOrder(o);
          setPricing({
            listPrice: q.listPrice,
            originalPrice: q.originalPrice,
            discountApplied: q.discountApplied,
            finalAmount: q.finalPrice,
          });
        }
      }
      const gatewayOrder = o;
      // Meta Pixel: one InitiateCheckout per gateway order (price card and
      // floating CTA share this handler, so it cannot double-fire).
      trackOnce("InitiateCheckout", gatewayOrder.internalOrderId, {
        value: Math.round(gatewayOrder.amount / 100),
        currency: "INR",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: gatewayOrder.keyId,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        name: "Love Match",
        description: "Compatibility Report",
        order_id: gatewayOrder.orderId,
        prefill: {
          name: `${input.person_a.first} ${input.person_a.last}`.trim(),
          contact: input.person_a.phone,
        },
        theme: { color: "#f2ca50" },
        handler: () => {
          navigate({
            to: "/success",
            search: { order_id: gatewayOrder.internalOrderId, phone: input.person_a.phone },
          });
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

      <main
        lang={lang}
        className="relative mx-auto max-w-[720px] px-margin-mobile pt-28 pb-32 lg:pt-32 lg:pb-24 lg:px-6"
      >
        {state.kind === "loading" && (
          <div className="glass-card rounded-3xl border border-outline-variant/25 p-8 lg:p-12">
            <Skeleton />
          </div>
        )}

        {state.kind === "error" && (
          <div className="glass-card rounded-3xl border border-outline-variant/25 p-8 text-center lg:p-12">
            <span className="material-symbols-outlined text-5xl text-primary">error</span>
            <h2 className="mt-4 font-headline-sm text-headline-sm text-on-surface">
              {ERROR_COPY[lang].title}
            </h2>
            <p className="mt-2 font-body-md text-on-surface-variant">{ERROR_COPY[lang].body}</p>
            <button
              type="button"
              onClick={() => input && fetchPreview(input)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary-fixed"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              {ERROR_COPY[lang].retry}
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
                    {titleCase(state.data.data.names.a)}
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
                    {titleCase(state.data.data.names.b)}
                  </div>
                  <div className="mt-1 text-label-sm uppercase tracking-widest text-on-surface-variant">
                    {formatDob(input.person_b.dob)}
                  </div>
                </div>
              </div>
            </section>

            {/* Score dial + server-derived framing */}
            <section ref={scoreRef} className="mb-10 flex flex-col items-center">
              <ScoreDial score={state.data.data.score} label={t.compatibility ?? "Compatibility"} />
              <div className="mt-6 rounded-full border border-primary/30 bg-primary-container/20 px-5 py-2 text-center font-label-md text-label-md text-primary-fixed">
                {state.data.data.band_label}
              </div>
              <p className="mt-4 max-w-lg px-2 text-center font-body-md text-body-md text-on-surface">
                {state.data.data.score_line}
              </p>
              {state.data.data.shared && state.data.data.shared.length > 0 && (
                <p className="mt-3 max-w-md px-4 text-center font-body-md text-body-md text-on-surface-variant">
                  {t.youShare}: {state.data.data.shared.join(" · ")}
                </p>
              )}

              {/* 3-dimension mini breakdown (locked one carries no text) */}
              <ul className="glass-card mt-6 w-full divide-y divide-outline-variant/15 overflow-hidden rounded-2xl border border-outline-variant/25">
                {state.data.data.dimensions.map((d) => (
                  <li key={d.key} className="flex items-center justify-between px-5 py-3.5">
                    <span className="font-body-md text-on-surface">{d.name}</span>
                    {d.locked ? (
                      <span className="flex items-center gap-2">
                        {/* decorative only — no verdict text is sent for the locked row */}
                        <span aria-hidden="true" className="lock-tease-stub" />
                        <span className="material-symbols-outlined text-on-surface-variant/60 text-base">
                          lock
                        </span>
                      </span>
                    ) : (
                      <span
                        className={`flex items-center gap-1.5 text-label-sm ${
                          d.verdict === "strong"
                            ? "text-primary"
                            : d.verdict === "friction"
                              ? "text-error"
                              : "text-tertiary"
                        }`}
                      >
                        {d.verdictLabel}
                        <span
                          className="material-symbols-outlined text-base"
                          style={
                            d.verdict === "strong"
                              ? { fontVariationSettings: "'FILL' 1" }
                              : undefined
                          }
                        >
                          {d.verdict === "strong"
                            ? "check_circle"
                            : d.verdict === "friction"
                              ? "warning"
                              : "circle"}
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Individual numbers — fully readable sample chapter */}
            <section className="mb-10">
              <h2 className="mb-4 text-center font-headline-sm text-headline-sm text-on-surface">
                {t.individualNumbers}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {state.data.data.life_paths.map((lp) => (
                  <div
                    key={`${lp.name}-${lp.number}`}
                    className="glass-card rounded-2xl border border-outline-variant/25 p-5"
                  >
                    <div className="mb-2 font-label-md text-label-md text-primary">
                      {titleCase(lp.heading)}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {lp.reading}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Chemistry — first full paragraph free, rest not sent to the browser */}
            <section className="mb-10">
              <h2 className="mb-4 text-center font-headline-sm text-headline-sm text-on-surface">
                {t.chemistry}
              </h2>
              <div className="glass-card relative overflow-hidden rounded-2xl border border-outline-variant/25 p-6 lg:p-8">
                <p className="font-body-lg text-body-lg text-on-surface">
                  {state.data.data.chemistry.visible}
                </p>
                {/* Decorative blurred stand-in for the locked continuation */}
                <LockTease />
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary-container/10 px-4 py-3">
                  <span className="material-symbols-outlined text-primary text-base">lock</span>
                  <span className="text-label-sm uppercase tracking-widest text-primary">
                    {t.unlockMore}
                  </span>
                </div>
              </div>
              <p className="mt-4 rounded-xl border border-tertiary/30 bg-tertiary/10 px-4 py-3 text-center font-body-md text-body-md text-on-surface">
                {state.data.data.friction_line}
              </p>
            </section>

            {/* Locked sections */}
            <section className="mb-10">
              <h3 className="mb-4 text-center font-label-md text-label-md uppercase tracking-widest text-primary">
                {t.inFullReport}
              </h3>
              <ul className="glass-card divide-y divide-outline-variant/15 rounded-2xl border border-outline-variant/25 overflow-hidden">
                {state.data.data.locked_sections.map((s) => (
                  <li key={s.title} className="flex items-start justify-between gap-3 px-5 py-4">
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="material-symbols-outlined text-primary/80">{s.icon}</span>
                      <span className="min-w-0">
                        <span className="block font-body-md text-on-surface">{s.title}</span>
                        <span className="mt-0.5 block text-label-sm text-on-surface-variant">
                          {s.line}
                        </span>
                      </span>
                    </span>
                    <span className="material-symbols-outlined shrink-0 text-on-surface-variant/60">
                      lock
                    </span>
                  </li>
                ))}
              </ul>
            </section>


            {/* Price card — the single purchase surface on every breakpoint */}
            <section ref={priceRef}>
              <div className="glass-card rounded-2xl border border-primary/25 p-6 text-center shadow-2xl lg:p-8">
                <ReportMock title={t.reportMockTitle} line={t.reportMockLine} />
                <p className="mb-3 font-body-md text-label-sm text-on-surface-variant">
                  {state.data.data.specs_line}
                </p>
                <div className="mb-2 text-label-sm uppercase tracking-widest text-primary">
                  {pricing && pricing.discountApplied > 0 ? t.couponApplied : t.introPrice}
                </div>
                <div className="mb-1 flex items-baseline justify-center gap-3">
                  {pricing ? (
                    <>
                      <span
                        className="text-gold-gradient"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "3rem",
                        }}
                      >
                        ₹{pricing.finalAmount}
                      </span>
                      {pricing.listPrice > pricing.finalAmount && (
                        <span className="text-body-lg text-on-surface-variant line-through">
                          ₹{pricing.listPrice}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="h-[3rem] w-32 animate-pulse rounded-full bg-surface-container" />
                  )}
                </div>
                {pricing && savingsFrom(pricing).amount > 0 && (
                  <div className="mb-2 text-label-sm text-primary">
                    {t.youSave} ₹{savingsFrom(pricing).amount} ({savingsFrom(pricing).percent}%{" "}
                    {t.off})
                  </div>
                )}
                <p className="mx-auto mb-6 max-w-md font-body-md text-on-surface-variant">
                  {t.oneTime}
                </p>

                {/* Coupon input */}
                <div className="mx-auto mb-6 flex max-w-sm items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={t.couponPlaceholder}
                    disabled={applyingCoupon || paying || !!appliedCoupon}
                    className="flex-1 rounded-full border border-outline-variant/30 bg-background/60 px-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/60 focus:outline-none disabled:opacity-60"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="rounded-full border border-outline-variant/40 px-4 py-2.5 font-label-md text-label-md text-on-surface-variant"
                    >
                      {t.remove}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onApplyCoupon}
                      disabled={applyingCoupon || paying || !couponInput.trim()}
                      className="rounded-full border border-primary/40 bg-primary-container/20 px-4 py-2.5 font-label-md text-label-md text-primary disabled:opacity-50"
                    >
                      {applyingCoupon ? "…" : t.apply}
                    </button>
                  )}
                </div>

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
                  {paying ? t.opening : t.unlock}
                </button>
                <p className="mt-4 font-body-md text-label-sm text-on-surface-variant">
                  {state.data.data.refund_line}{" "}
                  <Link to="/refund" className="underline hover:text-primary">
                    {state.data.data.refund_link_label}
                  </Link>
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Floating CTA — appears past the score section, hides near the price card.
          Mobile: bottom bar. Desktop: bottom-right pill. Scrolls to the price card. */}
      {state.kind === "ready" && (
        <div
          aria-hidden={!showFloatingCta}
          className={`fixed z-[60] transition-opacity duration-300 inset-x-0 bottom-0 lg:inset-x-auto lg:right-6 lg:bottom-6 ${
            showFloatingCta ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="border-t border-primary/20 bg-background/90 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:rounded-full lg:border lg:p-2 lg:pl-5 lg:shadow-2xl">
            <div className="mx-auto flex max-w-container-max items-center gap-3">
              <span className="flex items-baseline gap-2">
                {pricing ? (
                  <>
                    <span
                      className="text-gold-gradient"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "1.5rem",
                      }}
                    >
                      ₹{pricing.finalAmount}
                    </span>
                    {pricing.listPrice > pricing.finalAmount && (
                      <span className="text-label-sm text-on-surface-variant line-through">
                        ₹{pricing.listPrice}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="h-6 w-16 animate-pulse rounded-full bg-surface-container" />
                )}
              </span>
              <button
                type="button"
                onClick={scrollToPrice}
                className="shimmer flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 font-label-md text-label-md text-on-primary-fixed shadow-lg lg:flex-none"
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock_open
                </span>
                {t.unlock}
              </button>
            </div>
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
