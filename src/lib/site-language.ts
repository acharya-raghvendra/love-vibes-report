import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

// UI language for the marketing funnel (/hi/… and /en/…).
// The URL prefix is the single source of truth: localStorage only remembers
// the last choice so the entry point (/) can send a returning visitor to the
// tree they used before.
export type SiteLanguage = "en" | "hi";

const KEY = "ttg_lang";
const EVENT = "ttg-lang-change";

export const DEFAULT_LANGUAGE: SiteLanguage = "hi";

/** Language carried by the current URL prefix, e.g. /hi/preview -> "hi". */
export function langFromPath(pathname: string): SiteLanguage | null {
  const m = /^\/(hi|en)(\/|$)/.exec(pathname);
  return m ? (m[1] as SiteLanguage) : null;
}

/**
 * The page language, read from the URL prefix. Works anywhere in the tree
 * (including shared chrome rendered by __root) and is identical on the server
 * and the client, so there is no hydration flip. The prefix is mirrored into
 * localStorage so it stays the remembered preference.
 */
export function usePageLanguage(): SiteLanguage {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = langFromPath(pathname) ?? DEFAULT_LANGUAGE;
  useEffect(() => {
    if (readStoredLanguage() !== lang) setSiteLanguage(lang);
  }, [lang]);
  return lang;
}


export function readStoredLanguage(): SiteLanguage {
  try {
    const v = localStorage.getItem(KEY);
    return v === "en" || v === "hi" ? v : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function setSiteLanguage(lang: SiteLanguage) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<SiteLanguage>(EVENT, { detail: lang }));
  }
}

/**
 * Shared language state. SSR and the first client render always use the
 * default so hydration matches; the stored choice is applied in an effect.
 */
export function useSiteLanguage(): [SiteLanguage, (lang: SiteLanguage) => void] {
  const [lang, setLang] = useState<SiteLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLang(readStoredLanguage());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<SiteLanguage>).detail;
      setLang(detail === "en" ? "en" : "hi");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLang(readStoredLanguage());
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return [lang, setSiteLanguage];
}

/**
 * Keeps the browser tab title and the share-preview tags in sync with the
 * active UI language. Route head() still ships the Hindi (default) tags for
 * crawlers; this only corrects the tags when a visitor picks English.
 */
export function useLocalizedMeta(meta: { title: string; description: string }) {
  useEffect(() => {
    document.title = meta.title;
    const set = (selector: string, content: string) => {
      const el = document.head.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute("content", content);
    };
    set('meta[name="description"]', meta.description);
    set('meta[property="og:title"]', meta.title);
    set('meta[property="og:description"]', meta.description);
    set('meta[name="twitter:title"]', meta.title);
    set('meta[name="twitter:description"]', meta.description);
  }, [meta.title, meta.description]);
}
