const QUICK_LINKS = [
  { href: "#hero", label: "Home" },
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms" },
  { href: "#", label: "Refund Policy" },
  { href: "#", label: "Contact" },
];

function TrustChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="glass-card inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-1.5 text-label-sm text-on-surface">
      <span className="material-symbols-outlined text-primary" style={{ fontSize: "16px" }}>
        {icon}
      </span>
      {label}
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-primary/15 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary text-2xl leading-none">✦</span>
              <span
                className="text-gold-gradient text-2xl leading-none"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Love Match
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              Ancient numerology, decoded for modern seekers. Discover the cosmic
              blueprint between two souls.
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer" className="flex flex-col gap-3">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
              Quick Links
            </h3>
            {QUICK_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors w-fit"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Support */}
          <div className="flex flex-col gap-4">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
              Trust &amp; Support
            </h3>
            <div className="flex flex-wrap gap-2">
              <TrustChip icon="lock" label="Razorpay Secure" />
              <TrustChip icon="account_balance" label="UPI" />
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-2 font-body-md text-body-md text-on-surface hover:text-primary transition-colors w-fit"
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
                chat
              </span>
              WhatsApp Support
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-outline-variant/20 pt-6 text-center">
          <p className="text-label-sm text-on-surface-variant">
            © 2026 Inno-One Service LLP
          </p>
        </div>
      </div>
    </footer>
  );
}
