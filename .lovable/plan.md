# Revision: English stays unprefixed, Hindi lives under /hi

## Goal
Undo the `/en` tree and the 301s. The existing unprefixed URLs remain exactly where they are and become the English version; Hindi gets a mirrored `/hi/...` tree. The prefix decides the page language: `/hi/*` = Hindi, everything else = English. The URL still beats localStorage.

## URL map

```text
/  /input  /preview  /success  /contact  /privacy  /terms  /refund      -> English (unchanged, no redirects)
/hi  /hi/input  /hi/preview  /hi/success  /hi/contact  /hi/privacy  /hi/terms  /hi/refund  -> Hindi
```

Admin, affiliate, dashboard and `/api/*` routes stay unprefixed and untouched.

## Changes

### 1. Route tree
- Delete the `$lang` layout and its children; delete the redirect-only stubs currently sitting at `/`, `/input`, `/preview`, `/success`, `/contact`, `/privacy`, `/terms`, `/refund`.
- The full page bodies (currently in the `$lang.*` files) move back to the unprefixed files: `index.tsx`, `input.tsx`, `preview.tsx`, `success.tsx`, `contact.tsx`, `privacy.tsx`, `terms.tsx`, `refund.tsx`. Search-param validation (coupon, order_id, phone) moves with them unchanged.
- Add a Hindi mirror: `hi.tsx` (layout returning `<Outlet />`) plus `hi.index.tsx`, `hi.input.tsx`, `hi.preview.tsx`, `hi.success.tsx`, `hi.contact.tsx`, `hi.privacy.tsx`, `hi.terms.tsx`, `hi.refund.tsx`. Each Hindi leaf is a thin wrapper: it renders the same page component (extracted into a shared component module per page) and supplies its own `head()`. No duplicated page logic.

### 2. Language resolution
- `src/lib/site-language.ts`: `langFromPath()` returns `"hi"` for `/hi` and `/hi/...`, otherwise `"en"`; default becomes `en` for unprefixed URLs. `usePageLanguage()` keeps reading the pathname (identical on server and client, no hydration flip) and keeps mirroring the value into localStorage.
- `language-toggle.tsx`: switching adds or strips the `/hi` prefix on the current path, preserving search params and hash. Same navigate-based approach as now, just one prefix instead of two.
- Internal links: header nav, hero/sticky CTAs, footer links and programmatic `navigate()` calls target the unprefixed route in English and the `/hi/...` route in Hindi (a small helper that maps a page key + language to a route path keeps this in one place).

### 3. SEO per URL
- `src/lib/site-seo.ts`: `langUrl(lang, page)` returns `${ORIGIN}${page}` for `en` and `${ORIGIN}/hi${page}` for `hi`. `langHead()` emits a self-referencing canonical plus `hreflang="en"` -> unprefixed, `hreflang="hi"` -> `/hi`, `hreflang="x-default"` -> unprefixed.
- `/preview` and `/success` keep `robots: noindex` in both trees (canonical still self-references, no hreflang).
- `<html lang>` in `__root.tsx` is `hi` only under `/hi`, else `en`.

### 4. Sitemap and robots
- `sitemap.xml`: emit each indexable page twice — unprefixed and `/hi` — with `hreflang` alternates as above and `x-default` on the unprefixed URL. `/preview` and `/success` stay excluded.
- `robots.txt`: disallow `/preview`, `/success`, `/hi/preview`, `/hi/success`; drop the `/en/*` lines.

### 5. Preview content language vs report language
Site language (URL) and report language (form toggle) are independent, so the preview must not mix them.
- `love-match-generate` is called with the **site/URL language**, so all server-generated preview content (band label, score line, dimension names, Life Path readings, chemistry paragraph, locked-section descriptions, friction line) matches the page chrome.
- The form's report-language choice is stored in the order's `language` field only, and drives the delivered PDF, email and WhatsApp copy plus the delivery link's tree.
- The preview cache key includes the site language so `/preview` and `/hi/preview` never serve each other's copy.

### 6. Unchanged from the approved plan
- Meta Pixel `language` param on `Lead`, `ViewContent`, `InitiateCheckout`, `Purchase`.
- Report-language control on the input form: initialised from the URL prefix, then independently changeable.
- Server-side delivery links (email/WhatsApp/Razorpay callbacks) point at the order's language tree — Hindi orders get `/hi/...`, English orders get the unprefixed path.

## Verification
- All old URLs return 200 with English content — no redirects anywhere.
- Walk `/` and `/hi` end to end (landing -> input -> preview -> success); no page mixes languages.
- Toggle on each page: prefix appears/disappears, copy changes with it, search params survive.
- Open `/` with `hi` stored in localStorage: page renders English.
- Confirm canonical, hreflang pair + x-default, and `<html lang>` in the served HTML for both trees.
- `sitemap.xml` lists both trees; `robots.txt` blocks only the four session pages.
- Pixel events carry `language` with the right value in both trees.
