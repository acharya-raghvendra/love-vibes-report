# Meta Pixel tracking (shared pixel 933965172294987)

Add Meta Pixel to the Love Match funnel, reusing the existing account-wide pixel ID. No pricing, coupon, order, payment, webhook, delivery or preview content logic changes.

## 1. Single config + base code

- New `src/lib/meta-pixel.ts` holding the only copy of the pixel ID plus small helpers:
  - `PIXEL_ID = "933965172294987"`
  - `trackPageView()`, `trackOnce(key, name, params, options?)` (sessionStorage-guarded), `initAdvancedMatching({ email, phone })` with SHA-256 hashing via Web Crypto (email trimmed + lowercased, phone digits-only with `91` country code).
  - All calls are no-ops when `window.fbq` is missing (SSR-safe).
- Root document (`src/routes/__root.tsx`): inject the standard async `fbq` bootstrap + `fbq('init', PIXEL_ID)` + one initial `PageView`, plus the `<noscript>` tracking-image fallback, so it loads once for every page.

## 2. SPA route tracking

- A small client component mounted once in the root subscribes to router navigation (`router.subscribe("onResolved")`) and fires `PageView` on each route change.
- The first resolved route is skipped, because `fbq('init')` already sends one PageView. No PageView on refresh duplication.

## 3. Funnel events

All events carry `content_name: "love_match_report"`.

| Event | Trigger | Params | Once-guard key |
|---|---|---|---|
| Lead | `/input` form passes validation, just before navigating to `/preview` | `content_name` only (no PII) | per submitted-input hash |
| ViewContent | `/preview` finishes rendering a real score | `content_name`, `value` = current final price, `currency: "INR"` | per preview payload id |
| InitiateCheckout | Unlock button opens Razorpay (price card **and** floating CTA share one handler, so one call site) | `content_name`, `value` = final price, `currency: "INR"` | per preview id + price |
| Purchase | `/success` only, after the status poll confirms the order is paid/generating/ready (never on click) | `content_name`, `value` = amount actually paid, `currency: "INR"`, 4th arg `{ eventID: order_id }` | per `order_id` |

Guards use `sessionStorage` flags so re-renders, refreshes and back/forward navigation cannot re-fire an event.

## 4. Advanced matching

After a successful `/input` submit, hash the already-normalised email and phone client-side (SHA-256 hex, Web Crypto) and call `fbq('init', PIXEL_ID, { em, ph })`. Raw values never reach `fbq`.

## 5. One small backend read change (needed for Purchase value)

`src/routes/api/public/love-match-status.ts` currently returns no amount. It will also return the order's paid amount (a non-PII numeric field) so `/success` can send an accurate `value`. Nothing else in that endpoint changes; no pricing logic is touched.

## 6. Verification

Drive the funnel in a browser and assert the `fbq` call log: PageView on load and once per route change, Lead once on submit, ViewContent once on preview, InitiateCheckout once per checkout open, Purchase once on `/success` with the right value and `eventID`. Re-check that refresh and back-navigation add no duplicates.

## Technical notes

- Web Crypto `crypto.subtle.digest` requires a secure context; localhost and the published HTTPS site both qualify.
- Purchase fires from the existing status poller's data, so it is naturally tied to server-confirmed payment state.
