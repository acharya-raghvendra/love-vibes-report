import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

const AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDt-OKTZVKg6kxtnJP8FqUZ9iLR5dWf6R7J2SDgZs0HmI0mKLWxo3COwxmC7hL-Jltj7gTVERPQl9YzSIZLSU0HvqYwxaZuxPVKp1NB54LDaJoGEkbg7Pa7m50Y1H3VaLCi3hV3aOuFT2F_vURrBPu740hwYGjBMz8BXLJtH8_PI37c44KyacVOVluc5ztf47OkX9WUdEiQiYdpRUu7NYPrcsXqyyBCLNAelq6nW61hOVB9-HQuDn4A",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA62Nhtdsx5p-FZccE8RJ-Uf3xb9xCOuwGfF9TL8SvmM5msRa8ultWreg3d9n1Ke5-9SwoXz6LuiNxvjb6BhAgIVfh1JXudADgdYHf7i151fF2M7wWf_eY5mY0WYmQdU05opNZX1RUTsIoioeJailLufWjiL8dld0MKBTSn45c2Hxvhokjsjgl5X-SJhUxzMBy_YOcDyUnlvd0E-L5NU0l_9RQrT3xcT4x5l5NsQajHP1ZxqoWYUw7P",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB6crFkvUpkM86O4glIAMz1Dz1Zzk6WJic9qLfpECn2lo75LoatqBeFKM8X4i1a88zIx-iR-4-6vbNy0HCWptZ5Bhx6MW7m9VtfWIY-faT6oSRkr4KL41aEyBsobwd6pCQ8a9Q-P5uxhY7MN89wP8tSg7cqyVYWqW35MkfkEqNXYd-wpnq3t9ovR5PfaKLVttmC4vDxWUfTnQKlB-8vxeAcIF8LnG1l5vASFiBhLURzLnVcbq8yXRtR",
];

const SEEKER_1 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA3BlWZCoioKN5m0Dt3YlffdzjlaScPgDda141KKy17LayZLTSeq-pE4av__8kaCGkVR5fxu6g7kqpLyi0y8G-Vzlok5nbwBLDtrFrYvtX2UuwONxFGpvjH-JxE8Z8HFk4x59HDRanOMGwpHSBGwYIqMDQ5E4w_9tuuHX2JnG4GNrxoUIUv3i9XWtIV_1KW5CtAD-g2CUvpLARcGtlQ9QHJiMNZCAZigzorWglBi2Bi0sF2OCdn34aY";
const SEEKER_2 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA15iLR7wD8hXjzx-x-97UDn_USJkdYAza-xTliijx30nms8O4MyCC-hmnYdJwpi7kTiC5-OkesLLjLLW7fD-GrM-SnhTDSvtfKSXIuFY2MiDnj1juSYW8Xm5nQ3PihzcQhKssrB88wU3BCCYFYlJ1WX1rKzpAHkVjZttwcCmCJGQce6ZwN6Qwl6pR_kkYcMERWkmtgXeYNPYrSnhQf9cHyjKGsQTV5rUBrI1qFgXikqi8zZrfcucx5";

const TESTIMONIALS = [
  {
    quote:
      "The accuracy was breathtaking. It felt like Guruji was reading the very blueprint of our souls. We finally understand why we connect the way we do.",
    name: "Aria K.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAB9QO2thZvBa8itnYArzcktLm7CQo8iXZ0eq-jK-VcF-atgOLs0IyxPs9PYSuwDgF2lA7TyWS-Hh9mm9gyPNa1Q_MqJuMpfWczUvACuoD4_nCf0N8cCR4_PyBrOTXCuxY7XbAMTceG56qBDxSYvlFdZ9D3MFgNbeTATS-To--QxY16h6lcTb0XKGQGzaWIxkvZ5ue943Pp5npZxMG6XTWfXtvMOgohYOePGR6sV5L1XtA9gCey4rLZ",
  },
  {
    quote:
      "Guided us through a tough transition. The numerical insights gave us a common language to discuss our differences without friction.",
    name: "Leo M.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEqjQhmKZDBODqdyFCtrxiuyI7uG6o5ZtYE2B4TXjNeBxvzOekyXuMis501Y1q6_ZUrKihuRcVNl_htJ4aAZzGzpxbITfEtJh8zcbTYI0YZf42-1WJTa-VW7YPxKyaCfiHI_M4B-fpYIy3mlA9y3YflmHa00onq9ShO3yH57mp9JhtEomEUOeQmaaHiD0zo-lZEQVN4DP6MuDehLXyCtXJ4JnPoEhT6eypTndJPnoAN6KiBuZW4mjG",
  },
];

const FAQS = [
  {
    q: "How accurate is this?",
    a: "Our algorithm uses millennia-old Vedic numerology systems cross-referenced with modern personality mapping to provide insights with over 90% reported resonance.",
  },
  {
    q: "What do I need to provide?",
    a: "Simply provide your full birth names and exact birth dates. Time of birth is optional but adds another layer of cosmic depth to your report.",
  },
  {
    q: "Is it private?",
    a: "Your sacred data is encrypted and never shared. We treat your personal journey with the highest level of spiritual and digital integrity.",
  },
  {
    q: "Can I get a refund?",
    a: "If the insights do not resonate with your soul within 7 days, we offer a full cosmic satisfaction guarantee. Just reach out to our guides.",
  },
];

function Icon({ name, filled = false, className = "" }: { name: string; filled?: boolean; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
      {/* Global nebula background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="nebula-glow absolute top-[-10%] right-[-10%] h-[80vw] w-[80vw] rounded-full bg-tertiary" />
        <div
          className="nebula-glow absolute bottom-[-10%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-primary-container"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <div className="relative mx-auto max-w-container-max">
        <main className="pt-24 pb-32">
          {/* Hero */}
          <section className="px-margin-mobile relative mb-16 text-center">
            <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface mb-6 leading-tight">
              Discover if Your Souls are Aligned by the{" "}
              <span className="text-gold-gradient">Numbers</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mx-auto mb-10 max-w-sm">
              Enter your destinies to reveal the cosmic connection between you.
            </p>
            <button
              type="button"
              className="w-full rounded-xl bg-gradient-to-r from-primary-container to-primary py-5 font-label-md text-label-md uppercase tracking-widest text-on-primary-fixed shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-transform hover:scale-[0.98] active:scale-95"
            >
              Check Your Compatibility
            </button>
          </section>

          {/* Social proof */}
          <section className="px-margin-mobile mb-20 flex flex-col items-center">
            <div className="mb-4 flex -space-x-3">
              {AVATARS.map((src, i) => (
                <div
                  key={i}
                  className="h-12 w-12 rounded-full border-2 border-background bg-cover bg-center"
                  style={{ backgroundImage: `url('${src}')` }}
                  aria-hidden="true"
                />
              ))}
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-primary-container font-label-md text-label-sm text-on-primary-container">
                +50k
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" filled />
                ))}
              </div>
              <span className="font-label-md text-label-md text-on-surface">
                Trusted by 50,000+ Seekers
              </span>
            </div>
          </section>

          {/* Path to Clarity */}
          <section className="px-margin-mobile mb-24">
            <h2 className="font-headline-sm text-headline-sm mb-12 text-center text-on-surface">
              The Path to Clarity
            </h2>
            <div className="relative space-y-12">
              <div className="absolute top-6 bottom-6 left-6 w-px bg-gradient-to-b from-primary/40 via-primary/10 to-transparent" />
              {[
                { icon: "edit_calendar", title: "1. Enter Details", body: "Share your birth dates and names for precise cosmic calculation." },
                { icon: "analytics", title: "2. Get Score", body: "See your instant affinity score based on ancient numerology." },
                { icon: "lock_open", title: "3. Unlock Full Report", body: "Deep dive into destiny numbers, soul urges, and future paths." },
              ].map((step) => (
                <div key={step.title} className="relative flex gap-6">
                  <div className="glass-card z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-primary/30">
                    <Icon name={step.icon} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-label-md text-label-md mb-1 uppercase tracking-wider text-primary">
                      {step.title}
                    </h3>
                    <p className="font-body-md text-on-surface-variant">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Preview */}
          <section className="px-margin-mobile mb-24">
            <div className="glass-card relative overflow-hidden rounded-3xl border border-outline-variant/30 p-8 shadow-2xl">
              <div className="absolute top-4 right-4 rounded-full border border-primary/20 bg-primary-container/20 px-3 py-1 font-label-md text-label-sm text-primary-fixed backdrop-blur-md">
                Sample Preview
              </div>
              <div className="pointer-events-none space-y-6 opacity-60 blur-[4px]">
                <div className="flex items-end justify-between">
                  <div className="flex-1 text-center">
                    <div
                      className="mx-auto mb-2 h-16 w-16 rounded-full border border-primary/20 bg-cover bg-center"
                      style={{ backgroundImage: `url('${SEEKER_1}')` }}
                    />
                    <span className="text-label-sm">Seeker 1</span>
                  </div>
                  <div className="flex-shrink-0 pb-4 text-center">
                    <span className="font-headline-md text-headline-md text-primary">88%</span>
                    <div className="text-[10px] uppercase tracking-widest text-primary">
                      Compatibility
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <div
                      className="mx-auto mb-2 h-16 w-16 rounded-full border border-primary/20 bg-cover bg-center"
                      style={{ backgroundImage: `url('${SEEKER_2}')` }}
                    />
                    <span className="text-label-sm">Seeker 2</span>
                  </div>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full w-[88%] bg-primary" />
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-3/4 rounded-full bg-surface-variant" />
                  <div className="h-3 w-1/2 rounded-full bg-surface-variant" />
                  <div className="h-3 w-full rounded-full bg-surface-variant" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-background/20 p-6 backdrop-blur-[2px]">
                <div className="text-center">
                  <Icon name="auto_fix_high" className="mb-4 text-display-lg text-primary" />
                  <h3 className="font-headline-sm text-headline-sm mb-4">
                    Your Destiny Awaits
                  </h3>
                  <p className="font-body-md text-on-surface-variant mb-6">
                    Unlock your personalized 12-page compatibility report today.
                  </p>
                  <button
                    type="button"
                    className="rounded-xl bg-primary px-8 py-3 font-label-md text-label-md text-on-primary-fixed"
                  >
                    Unlock Now
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="px-margin-mobile mb-24">
            <h2 className="font-headline-sm text-headline-sm mb-10 text-center">
              Whispers of Truth
            </h2>
            <div className="space-y-6">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="glass-card relative rounded-2xl border border-outline-variant/20 p-6"
                >
                  <span
                    className="material-symbols-outlined absolute -top-2 -left-2 rotate-12 scale-150 text-primary/20"
                    style={{ fontSize: "3.5rem" }}
                  >
                    format_quote
                  </span>
                  <p className="font-body-md relative z-10 mb-4 italic text-on-surface">
                    “{t.quote}”
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full bg-surface-variant bg-cover bg-center"
                      style={{ backgroundImage: `url('${t.img}')` }}
                    />
                    <span className="font-label-md text-label-md text-primary">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="px-margin-mobile mb-24">
            <h2 className="font-headline-sm text-headline-sm mb-10 text-center">
              Common Inquiries
            </h2>
            <div className="space-y-4">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group glass-card rounded-xl border border-outline-variant/20 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between p-5">
                    <span className="font-label-md text-label-md text-on-surface">{f.q}</span>
                    <Icon
                      name="expand_more"
                      className="text-primary transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="font-body-md px-5 pb-5 text-on-surface-variant">{f.a}</div>
                </details>
              ))}
            </div>
          </section>
        </main>

        {/* Sticky CTA */}
        <div className="fixed right-0 bottom-0 left-0 z-[60] border-t border-primary/20 bg-background/80 p-4 backdrop-blur-2xl">
          <div className="mx-auto max-w-container-max">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-container to-primary py-4 font-label-md text-label-md text-on-primary-fixed shadow-lg transition-transform active:scale-95"
            >
              <Icon name="favorite" filled />
              CHECK YOUR COMPATIBILITY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
