# Test a Tamil report end to end

Goal: produce one free report with language `ta`, show the full `font_probe` log line, and show the resulting PDF.

Today this is not possible: the free-report generator hard-codes two languages and still uses the Devanagari-only font pipeline, so a `ta` request would silently become Hindi.

## What changes

In `supabase/functions/admin-create-free-report/index.ts` only:

1. Accept any language that exists in the report string table instead of collapsing everything to `en`/`hi`:
   `const language = isReportLang(body.language) ? body.language : "hi";`
2. Swap the font imports from `_shared/fonts/devanagari.ts` to `_shared/fonts/indic.ts` (`loadFontFaceCss`, `assertScriptRendered`, `describeFontProbe`) plus `scriptFor` from `_shared/reportStrings.ts` — the same migration already applied to `_shared/generate-report.ts`.
3. Load the face for the order's script: `const script = scriptFor(language) as ScriptKey;` then `loadFontFaceCss(supabase, script)`.
4. Replace the Hindi-only probe with `if (script !== "latin") { … assertScriptRendered(html, browserlessKey, script) … }`, logging `[free-report] font_probe ${describeFontProbe(probe)}` and failing the order with `pdf_font_missing` when the probe is not ok.

Nothing else in the file changes: auth gate, prose, guard, PDF, upload, and email stay as they are. No other file changes.

## Verification

- `deno check` the function, then deploy it.
- Invoke it once with an admin session and `language: "ta"`, Latin partner names, delivery email off.
- Poll the order until it is delivered or failed.
- Paste the complete `font_probe` log line from the function logs.
- Render the PDF pages to images and show the Tamil pages, so the Tamil glyphs are visible rather than just asserted.

If the probe fails, report the exact reason line and stop rather than patching around it.

## Notes

- `ta` is already an enabled row in `report_languages` and the Tamil 400/600 faces are already in the `report-fonts` bucket, so no database or storage work is needed.
- The admin form's language dropdown stays English/Hindi for now; this test calls the function directly. Say the word if you want the extra languages added to that dropdown too.
