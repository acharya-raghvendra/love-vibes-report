import { useSiteLanguage } from "@/lib/site-language";
import { HEADER_COPY } from "@/lib/site-copy";

/** Compact हिंदी | English switch. Choice persists across the funnel. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const [lang, setLang] = useSiteLanguage();
  const options = [
    { value: "hi" as const, label: "हिंदी" },
    { value: "en" as const, label: "English" },
  ];

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
            onClick={() => setLang(o.value)}
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
