Create a standalone string table for Love Match PDF reports

Add `supabase/functions/_shared/reportStrings.ts` containing the exact 531-line TypeScript module supplied by the user. The file exports:
- `ReportLang` union and `REPORT_LANGS` array for the seven report languages: en, hi, mr, ta, te, kn, ml
- `LANG_SCRIPT` mapping to script families (latin, devanagari, tamil, telugu, kannada, malayalam)
- `ReportStrings` interface and per-language string tables (en, hi, mr, ta, te, kn, ml) covering headings, cover text, score labels, section titles, number labels, sign-off, upsell copy, and disclaimer
- `reportStrings`, `getStrings`, `isReportLang`, and `scriptFor` helpers

No other file is touched. The module is intentionally not wired into `buildReportHtml.ts` or any other caller in this step; it is a standalone export for later integration.
