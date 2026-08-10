# Devanagari PDF verification + one hardening fix

## Verification results (done, no code changed)

**1. How the PDF is made:** the report HTML is built in `supabase/functions/_shared/buildReportHtml.ts` and POSTed as raw `html` to Browserless (headless Chrome) `/pdf` — `generate-report.ts` line ~418. So it is Chrome text shaping, not a PDF drawing library.

**2. Fonts already embedded:** the template loads Google Fonts `Fraunces`, `Inter`, and **`Noto Sans Devanagari` (400/500/600/700)** via `<link>`, and already switches `body.hi { font-family:'Noto Sans Devanagari' }` when `facts.language === "hi"`. So a Devanagari-capable font is present — nothing to add.

**3. Test render (headless Chromium, same font stack + same `body.hi` rules):** produced `/tmp/browser/hi/hi.pdf`. Screenshot reviewed:

- "आपका रिश्ता मजबूत और सुंदर है। जीवन पथ अंक 7 है।" renders perfectly.
- Conjuncts and matras correct: श्त in रिश्ता, जबू in मजबूत, plus क्ष त्र ज्ञ श्री द्ध and कि की कु कू के कै को कौ कं कः.
- `pdffonts` confirms `NotoSansDevanagari-Regular` is **embedded and subset** in the PDF. No tofu boxes anywhere.

## The one real risk to fix

Devanagari works only if the webfont finishes downloading before Chrome prints. The Browserless call currently sends just `{ html, options }` with no font/network wait, so a slow Google Fonts response can silently print with a fallback face and produce boxes intermittently.

**Change:** in `generate-report.ts` and `partner-generate-full/index.ts`, add to the Browserless payload:

- `gotoOptions: { waitUntil: "networkidle0" }`
- `waitForFunction`/`waitForTimeout` guard on `document.fonts.ready`

and, as belt-and-braces, extend the CSS stacks so every family ends in `'Noto Sans Devanagari'` (headings use `Fraunces`, which has no Devanagari glyphs — today it only works because the `body.hi .serif` stack already lists Noto second; the remaining `.serif`-styled numeric/label rules should get the same treatment).

No new font files, no new dependency.

## After approval
Apply the two Browserless payload changes plus the font-stack tightening, re-render a Hindi PDF end to end through the real pipeline, and paste the page image before we build the language selector on the form.
