# Enrich the free preview page

All new free content is computed inside the `love-match-generate` edge function from the same deterministic engine the paid report uses, and returned in its response. The browser only renders what the server sent; no locked/paid text is ever sent to the browser. Pricing, coupon, order creation, payment, webhook, delivery and the "You save" maths are untouched.

## 1. Server: what `love-match-generate` starts returning

The function already computes the full engine result (score, band, per-number breakdown, shared numbers). It currently throws most of that away. It will now also return, inside `data`:

- `band_label` and `score_line` — tension-based framing for the score, in the requested language:
  - 75+ : "Strong match — par ek kamzori hai" / "Strong match — but there's one weak spot"
  - 55-74: "Strong base, kuch friction zones" / "Strong base, some friction zones"
  - 40-54: "Kaafi kuch samajhna zaroori hai" / "There's a lot here worth understanding"
  - <40: "Challenges hain — aur unke upay bhi" / "There are challenges — and remedies for them"
  - `score_line` turns the number into the question the report answers, with the real score interpolated. No doom words anywhere; low scores always pair the challenge with "upay/remedies".
- `dimensions` — three dimensions derived from the existing breakdown points:
  - Emotional bond = Soul Urge pair points
  - Communication = Personality pair points
  - Long-term stability = weighted Life Path (0.6) + Destiny (0.4)
  Each gets a verdict from its points (`strong` >= 75, `workable` 50-74, `friction` < 50) plus a label. The server marks the highest and the lowest as visible and the middle one as `locked: true`, sending **no** verdict or label for the locked one — only its name. So the two honest extremes are shown and the third is a genuine lock.
- `life_paths` — for each partner: first name, Life Path display number, and a curated 3-4 line reading pulled from a server-side text library keyed by number (1-9, 11, 22, 33) and language. Deterministic, instant, no LLM on free traffic, and consistent with the paid report's numbers.
- `chemistry` — `{ visible: string }`: the first full paragraph of the chemistry read (a longer, language-aware version of the existing teaser library, keyed by teaser level). The second paragraph onward is not generated or sent at all.
- `friction_line` — one honest line naming the real weakest dimension, ending with "full report me iska solution diya gaya hai" / "the full report gives you the fix". Derived from the lowest-scoring dimension, so it is always true of this couple.
- `locked_sections` — the 10 titles, each with a one-line description of what it answers, in the requested language.
- `specs_line` — "12-page personalized report · Hindi ya English · WhatsApp + email par delivery within minutes." (EN variant too).

The response cache key already includes the reference year; it gains a language component so EN and HI payloads never collide. Existing fields (`score`, `band`, `names`, `shared`, `chemistry_teaser`) stay for backwards compatibility.

## 2. Client: `/preview` renders it

- Score section: `band_label` chip replaces the raw band, `score_line` under it, then a three-row dimension strip — visible rows show `Strong ✓` / `Workable` / `Friction ⚠`, the locked row shows only its name with a 🔒 and no text.
- New "Individual Numbers" section above chemistry: one card per partner, "Rahul — Life Path 8" plus the reading, fully readable.
- Chemistry section: renders `chemistry.visible` as the readable paragraph. The blurred placeholder paragraph currently hardcoded in the component is deleted; the lock state becomes a short "Unlock to read the rest" panel with no hidden prose behind it.
- `friction_line` renders as a single highlighted line under chemistry.
- Locked list shows title + its one-line description.
- `specs_line` renders above the price on the desktop card and above the mobile sticky row.
- A refund line next to both Unlock buttons, using the actual policy wording ("Reports are digital — no refunds after delivery. Read the Refund Policy.") linking to `/refund`. No guarantee is invented.
- Whole page bilingual: a single `copy` dictionary in the route holds EN/HI for the static UI strings (headings, CTA labels, coupon field, price-card labels, loading/error states) chosen by `input.language`. Price values, coupon calls, order creation and `savingsFrom` are not touched — labels only.

## Technical notes

- Files: `supabase/functions/love-match-generate/index.ts`, one new `supabase/functions/_shared/previewCopy.ts` (band labels, dimension verdicts, Life Path library, locked-section lines, specs line — EN + HI), and `src/routes/preview.tsx`.
- Untouched: `_shared/engine/*`, `_shared/generate-report.ts`, `create-love-match-order`, `love-match-finalize`, `prosePrompt.ts`, reconcile endpoints.
- `love-match-cache` payloads from the old shape are versioned out by bumping the cache key prefix, so no stale payload can render a half-empty page.

## Verification

- Run a preview for a test couple in Playwright and paste the `love-match-generate` network response, showing the new fields come from the server.
- Grep the rendered DOM for the locked chemistry continuation and locked-dimension verdict — must be absent.
- Cross-check `dimensions` against a direct run of the engine scorer for the same couple.
- Force three score ranges and confirm the band label mapping.
- Render the same couple with `language: "hi"` and `"en"` and screenshot both.
