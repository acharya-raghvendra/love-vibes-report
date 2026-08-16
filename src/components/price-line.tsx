import { useLovePrice } from "@/lib/use-love-price";
import type { SiteLanguage } from "@/lib/site-language";

/**
 * Live price line. While the fetch is pending we render a neutral shimmer of
 * the same height (never a half-built "₹ में 12-पेज…" string); if the fetch
 * fails the whole line is hidden and the rest of the page is untouched.
 */
export function PriceLine({
  lang,
  format,
  className = "",
}: {
  lang: SiteLanguage;
  format: (price: number) => string;
  className?: string;
}) {
  const price = useLovePrice();

  if (price.status === "error") return null;

  if (price.status === "loading") {
    return (
      <div
        aria-hidden="true"
        className={`mx-auto h-4 w-64 max-w-full animate-pulse rounded-full bg-surface-variant/50 ${className}`}
      />
    );
  }

  return (
    <p
      lang={lang}
      className={`font-body-md text-label-md text-on-surface-variant ${className}`}
    >
      {format(price.finalPrice)}
    </p>
  );
}
