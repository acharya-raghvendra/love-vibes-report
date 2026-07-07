import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const NAV_LINKS = [
  { href: "/#hero", label: "Home" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#faq", label: "FAQ" },
];

function Logo() {
  return (
    <a href="#hero" className="flex items-center gap-2 group" aria-label="Love Match home">
      <span className="text-primary text-xl leading-none group-hover:rotate-12 transition-transform">✦</span>
      <span
        className="text-gold-gradient text-xl leading-none"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
      >
        Love Match
      </span>
    </a>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-primary/15 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 lg:h-[72px] lg:px-6">
          <Logo />

          {/* Desktop nav */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="nav-link font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <a
            href="#hero"
            className="hidden lg:inline-flex items-center rounded-xl bg-gradient-to-r from-primary-container to-primary px-5 py-2.5 font-label-md text-label-md uppercase tracking-wider text-on-primary-fixed shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:scale-[0.98] active:scale-95 transition-transform"
          >
            Check Compatibility
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 text-primary"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Drawer */}
      <div
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
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 px-5 py-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-label-md text-label-md py-3 text-on-surface hover:text-primary transition-colors border-b border-outline-variant/10"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="p-5 pb-8">
            <a
              href="#hero"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-container to-primary py-4 font-label-md text-label-md uppercase tracking-widest text-on-primary-fixed shadow-lg"
            >
              Check Compatibility
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
