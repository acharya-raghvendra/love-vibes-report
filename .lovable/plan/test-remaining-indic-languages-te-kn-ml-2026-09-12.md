# Test remaining Indic languages (te, kn, ml)

## Goal
Verify Telugu, Kannada, and Malayalam reports render correctly end-to-end via `admin-create-free-report`, now that generic Indic font loading is wired into both the free-report function and `generate-report.ts`.

## Background (already confirmed)
- `report-fonts` bucket contains the 8 seeded WOFF2 files (400/600 for Tamil, Telugu, Kannada, Malayalam), all >5,000 bytes and weight pairs distinct.
- `admin-create-free-report` accepts all `reportStrings` languages and uses `loadFontFaceCss` / `assertScriptRendered` / `scriptFor`.
- Tamil test (order `197ad48a`) passed: `font_probe script=tamil ok=true`, 16-page PDF, correct rendering.

## Steps

1. **Trigger three test reports** via the deployed `admin-create-free-report` function (admin JWT minted with `lovable auth-session`), one each with `language: "te"`, `"kn"`, `"ml"`. Use simple Latin-alphabet test names; same minimal payload shape as the Tamil run.

2. **Capture font_probe logs** from each invocation and confirm a line like:
   `font_probe script=telugu ok=true ... shaped=true` (and `kannada`, `malayalam`).
   If any probe fails, the function returns `pdf_font_missing` — report the exact log line and stop.

3. **Verify database state**: each order reaches `status = delivered` with the correct `language` value and a non-null PDF path.

4. **Download the three PDFs** and render key pages to images:
   - Cover page (title, logo chip)
   - One prose/section page (headings in the target script)
   - Final disclaimer page (nine bullets must fit inside the card — the Tamil check just passed; confirm the same for the other three scripts)

5. **Visual QA checklist per PDF**: correct script glyphs (no tofu boxes), Latin digits where numbers appear, no text overflow/clipping, footer in the correct language.

6. **Report results**: paste the three font_probe log lines, page counts, file sizes, and rendered page images. No code changes unless a probe or render fails — in that case, diagnose and propose a fix first.

## Out of scope
- Tamil/other-language prose generation (readings remain English/Hindi per current prose generator).
- Any changes to `fonts/devanagari.ts` or other callers.
