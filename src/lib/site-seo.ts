import type { SiteLanguage } from "@/lib/site-language";

export const SITE_ORIGIN = "https://love.talktoguruji.com";

/**
 * Absolute URL for a page in a language. English keeps the original
 * unprefixed URLs; Hindi lives under /hi. `page` is "" or "/input".
 */
export function langUrl(lang: SiteLanguage, page: string): string {
  if (lang === "hi") return `${SITE_ORIGIN}/hi${page}`;
  return page === "" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${page}`;
}

/**
 * Head fragment for a language-prefixed page: localized title/description/OG,
 * a self-referencing canonical and en/hi hreflang alternates (x-default = en).
 */
export function langHead(args: {
  lang: SiteLanguage;
  /** Path after the language prefix: "" for the landing page, "/input", … */
  page: string;
  title: string;
  description: string;
  noindex?: boolean;
  twitterCard?: "summary" | "summary_large_image";
}) {
  const { lang, page, title, description, noindex } = args;
  const url = langUrl(lang, page);

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:locale", content: lang === "hi" ? "hi_IN" : "en_IN" },
    { name: "twitter:card", content: args.twitterCard ?? "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (noindex) meta.push({ name: "robots", content: "noindex" });

  const links: Array<Record<string, string>> = [{ rel: "canonical", href: url }];
  // hreflang is only meaningful for indexable pages.
  if (!noindex) {
    links.push(
      { rel: "alternate", hrefLang: "en", href: langUrl("en", page) },
      { rel: "alternate", hrefLang: "hi", href: langUrl("hi", page) },
      { rel: "alternate", hrefLang: "x-default", href: langUrl("en", page) },
    );
  }

  return { meta, links };
}
