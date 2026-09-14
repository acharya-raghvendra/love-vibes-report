# Multilingual prose prompt

Replace `supabase/functions/_shared/prosePrompt.ts` with the uploaded version, verbatim. No other file changes.

## What it changes

- Report writing instructions now cover seven languages: English, Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, each with its own tone sample and example phrases.
- Adds a rule that partner names stay in Latin script, plus a self-check so no English paragraphs leak into a non-English report.
- Adds a per-language rule that all numbers must use normal 0-9 digits, keeping the existing number check working.
- English and Hindi wording of the tone samples is unchanged, so those reports read as before.

## Technical notes

- Exported types (`SectionBlock`, `AnalyticalSection`, `StructuredSections`) and the `buildSystemPrompt(A, B, language)` signature stay identical, so `_shared/prose.ts` and all callers keep working.
- Unknown language codes fall back to English.
- The prose cache key is derived from facts, not the prompt text, so existing cached reports are untouched.

## Steps

1. Overwrite `supabase/functions/_shared/prosePrompt.ts` with the uploaded file.
2. Run `deno check` on that file and on `_shared/prose.ts`.
3. Publish.
