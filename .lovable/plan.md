# Language-prefixed URLs for the Love Match funnel

## Goal
Every visitor-facing page lives under a language prefix: `/hi/...` and `/en/...`. The prefix — not localStorage — decides the page language. Old URLs permanently redirect into the Hindi tree so live ads, WhatsApp and email links keep working.

## URL map

```text
/                 -> 301 /hi
/input            -> 301 /hi/input
/preview          -> 301 /hi/preview
/success          -> 301 /hi/success   (search params preserved: order_id, phone, coupon)
/contact          -> 301 /hi/contact
/privacy|terms|refund -> 301 /hi/<same>

/hi  /hi/input  /hi/preview  /hi/success  /hi/contact  /hi/privacy  /hi/terms  /hi/refund
/en  /en/input  /en/preview  /en/success  /en/contact  /en/privacy  /en/terms  /en/refund
```

Admin, affiliate, dashboard and `/api/*` routes stay exactly as they are (no prefix).

## Changes

### 1. Route tree
- New layout route `src/routes/$lang.tsx`: validates the param (`hi` | `en`; anything else -> not found), renders `<Outlet />`, and exposes the language.
- Move the current page bodies into `$lang.index.tsx`, `$lang.input.tsx`, `$lang.preview.tsx`, `$lang.success.tsx`, `$lang.contact.tsx`, `$lang.privacy.tsx`, `$lang.terms.tsx`, `$lang.refund.tsx`. Existing search-param validation (coupon, order_id, phone) moves with them unchanged.
- The old files (`index.tsx`, `input.tsx`, `preview.tsx`, `success.tsx`, `contact.tsx`, `privacy.tsx`, `terms.tsx`, `refund.tsx`) become redirect-only routes: `beforeLoad` throws a permanent redirect to the `/hi` equivalent, forwarding search params.

### 2. Language resolution (URL wins)
- `src/lib/site-language.ts`: add `usePageLanguage()` which reads the `lang` route param and returns it (default `hi` outside the tree, e.g. dashboard). An effect mirrors the prefix into localStorage so it stays the remembered preference.
- Pages and shared components (`site-header`, `site-footer`, `price-line`) switch from `useSiteLanguage()` to `usePageLanguage()`. Because the prefix is known during SSR, the first render is already in the right language — the current "default-then-swap" hydration dance and `useLocalizedMeta` are removed.
- `language-toggle.tsx`: instead of writing state, it navigates to the same route under the other prefix, preserving path and search params, and writes the new choice to localStorage. Form state on `/input` is preserved via the existing sessionStorage payload where present.
- All internal `<Link to="/input">` / `to="/preview"` / `to="/success"` / `to="/refund"` and `navigate({to})` calls become param-aware links to the `$lang` routes with `params={{ lang }}`. Header nav hash links (`/#hero`, `/#how-it-works`, `/#faq`) become prefix-aware too.

### 3. SEO per URL
- Each leaf route's `head()` returns: language-specific `title`, `description`, `og:title`, `og:description`, `og:url`, plus `links` with a self-referencing `canonical` and hreflang alternates:
  - `hreflang="hi"` -> `https://love.talktoguruji.com/hi/<page>`
  - `hreflang="en"` -> `https://love.talktoguruji.com/en/<page>`
  - `hreflang="x-default"` -> the `/hi` URL
- `/preview` and `/success` keep `robots: noindex` (and therefore no hreflang value for search, but the canonical stays self-referencing).
- `<html lang>` in `__root.tsx`'s shell is derived from the current pathname prefix (`hi`/`en`) instead of the hardcoded `en`.

### 4. Report language on /input
Initialised from the URL prefix, then independently changeable — switching the report-language control no longer navigates or changes the site language, and the chosen value is what gets sent to order creation.

### 5. Meta Pixel
`src/lib/meta-pixel.ts` gains a `language` param alongside `content_name`, and `Lead`, `ViewContent`, `InitiateCheckout` and `Purchase` call sites pass the current page language (`hi` | `en`).

## Verification
- Hit every old URL and confirm a 301 into `/hi/...` with search params intact.
- Walk `/hi` and `/en` end to end (landing -> input -> preview) and confirm no page mixes languages.
- Toggle on each page: URL prefix and rendered copy change together; localStorage updates.
- Open `/hi` with `en` stored in localStorage: page renders Hindi.
- Confirm canonical, hreflang and `<html lang>` per URL in the served HTML.
- Confirm pixel events carry `language` with the right value in both trees.
