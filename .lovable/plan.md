# Replace buildReportHtml.ts with uploaded multilingual version

## Goal
Swap `supabase/functions/_shared/buildReportHtml.ts` to the exact contents of the uploaded `buildReportHtml-7.ts`, which externalizes fixed strings to `_shared/reportStrings.ts` and Indic font handling to `_shared/fonts/indic.ts` so the report can render in Tamil, Telugu, Kannada, and Malayalam in addition to English and Hindi.

## Changes

### 1. `supabase/functions/_shared/buildReportHtml.ts`
- Overwrite with the uploaded file contents (418 lines).
- New imports:
  - `import { getStrings, scriptFor } from "./reportStrings.ts";`
  - `import { familyFor, lineHeightFor, type ScriptKey } from "./fonts/indic.ts";`
- Removes inline `SECTION_TITLES_EN` / `SECTION_TITLES_HI` tables and inline language ternaries; all fixed copy now comes from `getStrings(language)`.
- Adds script-aware CSS (`body.ind`) and typography overrides for non-Devanagari Indic scripts.
- Keeps the existing `cobrand` / `ttgLogoUrl` cover block and `showUpsell` behavior unchanged.

### 2. Verification
- Run `deno check supabase/functions/_shared/buildReportHtml.ts` and confirm no type errors.

## Non-goals / Must not change
- No edits to `_shared/reportStrings.ts`, `_shared/fonts/indic.ts`, or any other file.
- No changes to callers (`generate-report.ts`, `partner-generate-full`, `admin-create-free-report`).
