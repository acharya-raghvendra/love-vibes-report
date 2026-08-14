# Preview page: Devanagari Hindi, lock tease, floating CTA, polish

All pricing, coupon, order, payment, webhook and delivery logic stays untouched. Only preview copy (server-generated) and the preview page's presentation change.

## 1. Hindi copy → Devanagari

Rewrite every Hindi string in the server copy library (`_shared/previewCopy.ts`) from Roman Hinglish into conversational Devanagari:

- Band labels, score lines, friction lines
- Dimension names: भावनात्मक बंधन / बातचीत / लंबे समय का साथ
- Verdict labels: मज़बूत / सुधार ज़रूरी / टकराव
- All 13 Life Path readings (Hindi set)
- All 4 chemistry paragraphs (Hindi set)
- 10 locked-section titles + one-liners
- Specs line, refund line, and the headings dictionary ("आप दोनों के अपने अंक", "आपकी केमिस्ट्री", "आगे पढ़ने के लिए unlock करें", "रिपोर्ट unlock करें", etc.)

Tone: everyday spoken Hindi, common English words kept in Latin where people actually say them (unlock, report, coupon). Numbers, %, ₹ stay Latin digits. English variant copy unchanged.

Cache: bump the preview cache key so old Hinglish payloads aren't served, then redeploy the generate function.

## 2. Devanagari typography

- Load Noto Sans Devanagari (body) and Noto Serif Devanagari (headings) via the existing Google Fonts `<link>` block in the root route.
- Add `--font-devanagari` / `--font-devanagari-display` tokens in `src/styles.css` and append them to the existing display/body stacks, so Hindi never falls back to a system font.
- Apply `lang="hi"` on the preview content wrapper when the report language is Hindi.

## 3. Visual lock tease (decorative only)

- Under the free chemistry paragraph: 3–4 skeleton-style bars (pure CSS, no text nodes) with blur and a bottom gradient fade into the unlock panel. Nothing readable is ever rendered — no real report prose is sent to the client for locked content.
- Locked dimension row: a short blurred stub bar after the dimension name instead of a verdict label.

## 4. Floating buy CTA

- Compact sticky CTA that appears only after the score section scrolls out of view, and hides again while the price card is in view (IntersectionObserver on both, same pattern as the landing page sticky).
- Mobile: bottom bar. Desktop: bottom-right pill.
- Contents: strikethrough + final price from the existing pricing state, and a button labelled "रिपोर्ट unlock करें" / "Unlock Full Report" that smooth-scrolls to the price card.
- Replaces the current always-on mobile sticky bar so two CTAs are never visible at once.

## 5. Polish

- Capitalize display names (first letter per word) wherever names render on the page.
- Score ring: sweep the arc from 0 alongside the existing count-up, ~1.2s ease-out, runs once.
- Verdict colour coding: strong = gold check, workable = amber dot, friction = muted rose dot, locked = neutral lock icon — using existing semantic tokens.
- Small stylized "report preview" mock near the price card: a generic multi-page card graphic (CSS/inline SVG, abstract lines and a heart motif, no real content) to make the 12-page product feel tangible.

## Technical notes

- Files touched: `supabase/functions/_shared/previewCopy.ts`, `supabase/functions/love-match-generate/index.ts` (cache key + redeploy only), `src/routes/preview.tsx`, `src/styles.css`, `src/routes/__root.tsx` (font link).
- No changes to `create-love-match-order`, `love-match-finalize`, `_shared/generate-report.ts`, or `_shared/engine/*`.
- Verification: fetch the preview payload for a Hindi and an English order and confirm the copy, then render both in a headless browser with screenshots of the score ring, blur tease, floating CTA and price card mock.
