# Devanagari PDF verification + one hardening fix

## Verification results (done, no code changed)

**1. How the PDF is made:** the report HTML is built in `supabase/functions/_shared/buildReportHtml.ts` and POSTed as raw `html` to Browserless (headless Chrome) `/pdf` — `generate-report.ts` line ~418. So it is Chrome text shaping, not a PDF drawing library.

**2. Fonts already embedded:** the template loads Google Fonts `Fraunces`, `Inter`, and **`Noto Sans Devanagari` (400/500/600/700)** via `<link>`, and already switches `body.hi { font-family:'Noto Sans Devanagari' }` when `facts.language === "hi"`. So a Devanagari-capable font is present — nothing to add.

**3. Test render (headless Chromium, same font stack + same `body.hi` rules):** produced `/tmp/browser/hi/hi.pdf`. Screenshot reviewed:

- "आपका रिश्ता मजबूत और सुंदर है। जीवन पथ अंक 7 है।" renders perfectly.
- Conjuncts and matras correct: श्त in रिश्ता, जबू in मजबूत, plus क्ष त्र ज्ञ श्री द्ध and कि की कु कू के कै को कौ कं कः.
- `pdffonts` confirms `NotoSansDevanagari-Regular` is **embedded and subset** in the PDF. No tofu boxes anywhere.

## The one real risk — and why a wait guard is not enough

Today the font comes from the Google Fonts CDN at print time. Answering the question directly: **a `waitUntil` / `document.fonts.ready` guard does NOT fail the render.** `networkidle0` resolves once the network is quiet — including when the font request errored — and `document.fonts.ready` resolves whether each face loaded or failed. Chrome then prints with a fallback face. If Chrome's fallback has no Devanagari coverage, that is a silently shipped tofu PDF on a paid order. So a wait guard is the wrong fix.

## Fix: self-host Noto Sans Devanagari, no CDN at render time

- Bundle the Devanagari-subset woff2 for weights 400 and 600 (measured: ~121 KB and ~14 KB) as base64 in a new `supabase/functions/_shared/fonts/notoSansDevanagari.ts`, exported as `@font-face` CSS with `src: url(data:font/woff2;base64,…)`.
- `buildReportHtml.ts` inlines that `@font-face` block in `<style>` and drops `Noto+Sans+Devanagari` from the Google Fonts `<link>`. Zero network dependency for Hindi glyphs — the font is inside the HTML payload Browserless receives, so it cannot be slow or unreachable.
- Extend the CSS stacks so every family ends in `'Noto Sans Devanagari'`. `Fraunces` has no Devanagari glyphs; today only `body.hi .serif` lists Noto as a second choice, so the remaining `.serif` numeric/label rules get the same treatment.
- Latin faces (`Inter`, `Fraunces`) stay on the CDN — a Latin fallback is cosmetic, not a correctness failure.

### Fail-loud backstop (so tofu can never ship silently)

After the PDF comes back, for Hindi orders extract its text with a light check and assert the Devanagari font is actually embedded; a missing Devanagari face fails the stage as `pdf_font_missing`, which routes into the existing retry/reconcile path instead of delivering. Applied in `generate-report.ts` and `partner-generate-full/index.ts`.

## After approval
Bundle the fonts, wire the inline `@font-face`, tighten the stacks, add the backstop, then render a Hindi PDF end to end through the real pipeline **with the CDN blocked** and paste the page image — proving Hindi is correct with zero external font access, before we build the language selector on the form.
