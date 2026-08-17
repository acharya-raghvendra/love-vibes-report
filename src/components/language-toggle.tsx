import { useNavigate, useRouterState } from "@tanstack/react-router";
import { HEADER_COPY } from "@/lib/site-copy";
import { langPath } from "@/lib/lang-path";
import { setSiteLanguage, usePageLanguage, type SiteLanguage } from "@/lib/site-language";

/**
 * Compact हिंदी | English switch. Switching navigates to the same page with or
 * without the /hi prefix (the URL is the source of truth) and remembers the
 * choice for the next visit.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const lang = usePageLanguage();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const options: Array<{ value: SiteLanguage; label: string }> = [
    { value: "hi", label: "हिंदी" },
    { value: "en", label: "English" },
  ];

  function switchTo(next: SiteLanguage) {
    if (next === lang) return;
    setSiteLanguage(next);
    // Add or strip the /hi prefix so the visitor stays on the same page,
    // keeping the query string (coupon, order_id) and hash intact.
    const page = location.pathname.replace(/^\/hi/, "").replace(/\/$/, "");
    const href = langPath(next, page);
    navigate({
      href: `${href}${location.searchStr}${location.hash ? `#${location.hash}` : ""}`,
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label={HEADER_COPY[lang].languageLabel}
      className={`inline-flex items-center rounded-full border border-primary/25 bg-surface-container/60 p-0.5 ${className}`}
    >
      {options.map((o) => {
        const active = lang === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            lang={o.value}
            onClick={() => switchTo(o.value)}
            className={`rounded-full px-3 py-1.5 font-label-md text-label-sm transition-colors ${
              active
                ? "bg-primary text-on-primary-fixed"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
