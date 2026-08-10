# Report language selector (English / हिंदी)

Most of the backend already speaks language; the gap is that the UI never asks and the client hardcodes `"en"`.

## Current state (verified)

- `create-love-match-order` already reads `body.language` (`"hi"` only when explicitly sent, else `"en"`) and stores it on the order row; the `language` column already exists on `love_match_orders`.
- `generate-report.ts` already reads `order.language` into `facts.language` and passes it to `generateProse`, the prose cache key, and the Hindi PDF font/probe path.
- `prosePrompt.ts` already has a hard language rule (line 46): `LANGUAGE RULE: The entire report is in ${langName}. EVERY visible string you output, without exception, must be in ${langName}. ...` with `langName = "Hinglish (Devanagari, casual aam-bolchaal)"` for `hi`.
- `preview.tsx` sends `language: "en"` hardcoded in both the preview call (line 259) and order creation (line 299) — this is the actual bug.
- `numberGuard.ts` matches only Latin digits; Devanagari digits (७) would be silently unverifiable.

## Changes

### 1. `/input` selector
Add a required "Report language" field to `src/routes/input.tsx`, styled to match the existing fields (same label/border/focus treatment, `FieldError` for the invalid case): two mutually exclusive choices, हिंदी and English, defaulting to `hi`. Store as `language: "hi" | "en"` in the `loveMatch:input` sessionStorage payload.

### 2. Carry through preview
`preview.tsx` uses `input.language ?? "hi"` instead of the hardcoded `"en"` in both the preview invoke and `create-love-match-order` body.

### 3. Order creation default flips to Hindi
In `create-love-match-order`: accept only exactly `"en"` or `"hi"`; anything else present and non-empty → `422 { error: "language must be en or hi" }`. Absent → default `"hi"`. Migration sets the column default to `'hi'`.

### 4. Number guard: Devanagari digits
Choose (b) — normalize in the guard, since it is the safety net and must not depend on model compliance. Map `०१२३४५६७८९` to `0-9` before claim extraction and comparison, and keep the deterministic correction writing Latin digits. The prompt also gets one added line requiring Latin digits (0-9) for all numbers even in Hindi prose, so both layers hold.

### 5. Free-report and partner paths
`admin-create-free-report` and `partner-generate-full` default to `hi` when no language is supplied (currently they default to `en`), validating the same two values.

## Technical notes

- Files: `src/routes/input.tsx`, `src/routes/preview.tsx`, `supabase/functions/create-love-match-order/index.ts`, `supabase/functions/_shared/numberGuard.ts`, `supabase/functions/_shared/prosePrompt.ts`, `supabase/functions/admin-create-free-report/index.ts`, `supabase/functions/partner-generate-full/index.ts`, plus one migration for the column default.
- Untouched: scoring engine, Razorpay signature verification, status transitions, PDF layout, font embedding, delivery.
- Prose cache key already includes language, so English and Hindi never collide.

## Verification

- Diff of `input.tsx` showing the selector.
- Confirm the `language` column and its `'hi'` default on `love_match_orders`.
- Unit-check the guard on a Hindi snippet with a wrong Devanagari digit (e.g. "जीवन पथ अंक ८" against a computed 7) and confirm it reports a mismatch and corrects it.
- Run one Hindi order end-to-end and confirm the PDF prose is Hindi and the guard passed.
