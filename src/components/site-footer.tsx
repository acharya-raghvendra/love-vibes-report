import { Link } from "@tanstack/react-router";

const QUICK_LINKS = [
  { to: "/" as const, label: "Home" },
  { to: "/privacy" as const, label: "Privacy Policy" },
  { to: "/terms" as const, label: "Terms" },
  { to: "/refund" as const, label: "Refund Policy" },
  { to: "/contact" as const, label: "Contact" },
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
    <footer className="relative border-t border-primary/15 bg-background/60 backdrop-blur-xl pb-24 lg:pb-0">
      <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Brand */}
          <div>
            <img
              src="/talktoguruji-logo-dark.png"
              alt="Talk To Guruji"
              className="h-12 w-auto mb-4"
            />
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
              <Link
                key={l.label}
                to={l.to}
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors w-fit"
              >
                {l.label}
              </Link>
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
