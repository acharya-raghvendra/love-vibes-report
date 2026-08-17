import type { SiteLanguage } from "@/lib/site-language";

/**
 * Path for a funnel page in a given language. English is the unprefixed
 * (original) URL set; Hindi lives under /hi.
 *   langPath("en", "/input") -> "/input"
 *   langPath("hi", "/input") -> "/hi/input"
 *   langPath("hi", "")       -> "/hi"
 */
export function langPath(lang: SiteLanguage, page: string): string {
  if (lang === "hi") return `/hi${page}`;
  return page === "" ? "/" : page;
}
