# Hindi landing + input, visible price, one CTA

Goal: the landing and input pages get a proper Devanagari Hindi variant (Hindi by default), the live price is visible before the preview, every CTA uses one label, the mobile sticky CTA never doubles up with the hero button, and Devanagari text stops getting letter-spacing.

No changes to payment, order creation, coupon/pricing logic, or preview report content.

## 1. Site language (new, shared)

New `src/lib/site-language.ts`:
- `useSiteLanguage()` hook — `"hi" | "en"`, default `hi`, persisted in `localStorage` (`ttg_lang`), read after hydration to avoid mismatch, with a window event so header/page/input stay in sync.
- Landing, input and header all read from it; the input form's existing report-language toggle is initialised from it and writing either one updates both.

New `src/lib/site-copy.ts`: one bilingual dictionary (same pattern the preview copy uses) for header, landing, footer and input strings. English entries are today's exact copy.

## 2. Header

Compact `हिंदी | English` segmented toggle next to the logo/CTA (desktop and inside the mobile drawer). Nav labels and the CTA come from the dictionary.

## 3. Landing page Hindi copy

Hero H1, subtext, "3 आसान steps" + 3 step lines, testimonials heading and translated quotes (names unchanged), "आम सवाल" + all four Q&As, trust line, footer tagline and footer links — all from the dictionary, with loanwords (report, unlock, WhatsApp, coupon, score, compatibility, steps) kept in Latin.

## 4. Price line

New read-only public endpoint `src/routes/api/public/love-match-price.ts` returning `{ listPrice, finalPrice }` from the same `love_match_pricing` row the checkout path already reads (offer price when the offer window is live). No second copy of the price in the frontend.

Rendered under the hero CTA and above the input submit button:
- HI `₹<price> में 12-पेज personalized report · WhatsApp + email पर तुरंत`
- EN `₹<price> — 12-page personalized report · instant on WhatsApp + email`

## 5. One CTA label

Header, hero, preview-teaser and mobile sticky all use HI `Compatibility check करें` / EN `Check Compatibility`. The three current variants are removed.

## 6. Mobile sticky CTA

Keep the IntersectionObserver on the hero button; tighten it so the bar is `opacity-0 pointer-events-none aria-hidden` while the hero CTA is on screen and fades in over 300ms once it leaves, with the existing subtle top shadow. Verified so two CTAs are never visible together.

## 7. Input form

Hindi heading `अपनी details भरें`, Hindi field labels (नाम / जन्म-तारीख / लड़का / लड़की), WhatsApp + email labels and helper text, all validation messages, submit button label — all from the dictionary.

Accessibility/UX pass on the same fields: `label for` + `id` (or `aria-label`) on every input, plus `autocomplete="name" | "bday" | "tel" | "email"` and `inputmode="numeric"` on the phone field. Validation rules themselves are unchanged.

## 8. Devanagari letter-spacing

In `src/styles.css`: a `:lang(hi)` / `[lang="hi"]` rule forcing `letter-spacing: normal` (including elements that inherit the uppercase-tracking utilities), and set `lang="hi"` on the Hindi containers. Also fixes the preview score-ring sublabel rendering "मेल" as "मे ल".

## Technical notes

- Files touched: `src/lib/site-language.ts` (new), `src/lib/site-copy.ts` (new), `src/routes/api/public/love-match-price.ts` (new), `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/routes/index.tsx`, `src/routes/input.tsx`, `src/routes/preview.tsx` (sublabel + `lang` attribute only), `src/styles.css`.
- Devanagari fonts are already loaded in the root route; the landing/input pages just reuse those stacks.
- The price endpoint is read-only and returns no PII.

## Verification

Playwright walkthrough of landing → input in both languages: toggle persists across pages and pre-selects the report language, price line matches the value returned by the pricing source, mobile shows exactly one CTA at a time, no English leaks into the Hindi variant, every field has an accessible name, and Devanagari renders without gaps.
