# Header CTA on /preview and /success

## Goal
On `/preview` and `/success`, remove the gold "Check Compatibility" CTA button from the site header so the page has only one clear conversion action (unlock report / view status). Replace it with a small, low-emphasis text link that lets users start a new pair: HI "नई जोड़ी check करें" / EN "Check a new pair". Nav links (Home / How It Works / FAQ) stay unchanged. Landing and all other pages keep the existing gold CTA.

## Changes

### 1. Copy dictionary
`src/lib/site-copy.ts`
- Add a new entry `NEW_PAIR_LINK` (or similar) under `HEADER_COPY` or as a standalone record, with bilingual strings:
  - hi: "नई जोड़ी check करें"
  - en: "Check a new pair"

### 2. Header component
`src/components/site-header.tsx`
- Import `useRouterState` from `@tanstack/react-router`.
- Read the current pathname with `useRouterState({ select: (s) => s.location.pathname })`.
- Define `isNoCtaPage = pathname === "/preview" || pathname === "/success"`.
- Desktop header:
  - When `isNoCtaPage` is true, render a plain text `<Link to="/input">` (e.g. `text-on-surface-variant hover:text-primary font-label-md text-label-md`) instead of the gold gradient button.
  - On all other routes, keep the gold gradient button exactly as it is today.
- Mobile drawer:
  - Apply the same conditional at the bottom of the drawer. Use the low-emphasis text link in place of the gold full-width button on `/preview` and `/success`.
- Keep the language toggle and hamburger/menu icons unchanged on all routes.

### 3. Verification
- Load `/` and `/input` in both languages; confirm the gold CTA is still present and labeled correctly.
- Load `/preview` and `/success`; confirm the gold CTA is gone and the low-emphasis text link appears in both languages, pointing to `/input`.
- Confirm nav links still render and work on `/preview` and `/success`.
- Confirm no visual layout break (the header height stays consistent).
