import { LangLink } from "@/components/lang-link";
import { langPath } from "@/lib/lang-path";
import { Icon } from "@/components/icon";
import { FOOTER_COPY } from "@/lib/site-copy";
import { usePageLanguage } from "@/lib/site-language";

const QUICK_LINKS = [
  { key: "/", page: "" },
  { key: "/privacy", page: "/privacy" },
  { key: "/terms", page: "/terms" },
  { key: "/refund", page: "/refund" },
  { key: "/contact", page: "/contact" },
] as const;

function TrustChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="glass-card inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-1.5 text-label-sm text-on-surface">
      <Icon name={icon} size={16} className="text-primary" />
      {label}
    </span>
  );
}

export function SiteFooter() {
  const lang = usePageLanguage();
  const copy = FOOTER_COPY[lang];

  return (
    <footer
      lang={lang}
      className="relative border-t border-primary/15 bg-background/60 backdrop-blur-xl pb-24 lg:pb-0"
    >
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
              {copy.tagline}
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer" className="flex flex-col gap-3">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
              {copy.quickLinks}
            </h3>
            {QUICK_LINKS.map((l) => (
              <LangLink
                key={l.key}
                to={langPath(lang, l.page)}
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors w-fit"
              >
                {copy.links[l.key]}
              </LangLink>
            ))}
          </nav>

          {/* Support */}
          <div className="flex flex-col gap-4">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
              {copy.trust}
            </h3>
            <div className="flex flex-wrap gap-2">
              <TrustChip icon="lock" label={copy.razorpay} />
              <TrustChip icon="account_balance" label={copy.upi} />
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-2 font-body-md text-body-md text-on-surface hover:text-primary transition-colors w-fit"
            >
              <Icon name="chat" size={20} className="text-primary" />
              {copy.whatsapp}
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
