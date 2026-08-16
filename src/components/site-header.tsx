import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { LanguageToggle } from "@/components/language-toggle";
import { CTA_LABEL, HEADER_COPY, NEW_PAIR_LABEL } from "@/lib/site-copy";
import { useSiteLanguage } from "@/lib/site-language";
import logoAsset from "@/assets/talktoguruji-logo.png.asset.json";


function Logo() {
  return (
    <Link to="/" className="flex items-center" aria-label="Talk To Guruji home">
      <img
        src={logoAsset.url}
        alt="Talk To Guruji"
        className="h-9 w-auto brand-logo lg:h-10"
      />
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [lang] = useSiteLanguage();
  const copy = HEADER_COPY[lang];
  const cta = CTA_LABEL[lang];
  const newPair = NEW_PAIR_LABEL[lang];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Robust to /preview, /preview/, /success, /success/ so the gold CTA never
  // reappears on trailing-slash variants of the report/success pages.
  const isNoCtaPage = /^\/(preview|success)\/?$/.test(pathname);


  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        lang={lang}
        className="fixed inset-x-0 top-0 z-50 border-b border-primary/15 bg-background/70 backdrop-blur-2xl"
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 lg:h-[72px] lg:px-6">
          <Logo />

          {/* Desktop nav */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2"
          >
            {copy.nav.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="nav-link font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:gap-3">
            <LanguageToggle />

            {/* Desktop CTA: low-emphasis text link on report/success pages so
                the single page goal isn't competing with a gold button. */}
            {isNoCtaPage ? (
              <Link
                to="/input"
                className="hidden lg:inline-flex items-center font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                {newPair}
              </Link>
            ) : (
              <Link
                to="/input"
                className="hidden lg:inline-flex items-center rounded-xl bg-gradient-to-r from-primary-container to-primary px-5 py-2.5 font-label-md text-label-md text-on-primary-fixed shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:scale-[0.98] active:scale-95 transition-transform"
              >
                {cta}
              </Link>
            )}


            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label={copy.openMenu}
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 text-primary"
            >
              <Icon name="menu" size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer */}
      <div
        lang={lang}
        className={`lg:hidden fixed inset-0 z-[70] transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={`glass-card absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col border-l border-primary/20 shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 h-16">
            <Logo />
            <button
              type="button"
              aria-label={copy.closeMenu}
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant"
            >
              <Icon name="close" size={24} />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 px-5 py-6">
            {copy.nav.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-label-md text-label-md py-3 text-on-surface hover:text-primary transition-colors border-b border-outline-variant/10"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-5">
              <LanguageToggle />
            </div>
          </nav>
          <div className="p-5 pb-8">
            {isNoCtaPage ? (
              <Link
                to="/input"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                {newPair}
              </Link>
            ) : (
              <Link
                to="/input"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-container to-primary py-4 font-label-md text-label-md text-on-primary-fixed shadow-lg"
              >
                {cta}
              </Link>
            )}
          </div>

        </aside>
      </div>
    </>
  );
}
