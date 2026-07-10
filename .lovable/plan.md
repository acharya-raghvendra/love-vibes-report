## Change

In `src/routes/index.tsx`, replace the four FAQ answer strings in the `FAQS` array with the exact new copy provided. Questions unchanged.

- "How accurate is this?" → new answer (removes the "90% reported resonance" figure).
- "What do I need to provide?" → new answer (removes "Time of birth is optional…" line).
- "Is it private?" → new answer.
- "Can I get a refund?" → new answer (no-refund policy for instant digital reports).

## Sweep for birth-time / accuracy-% mentions elsewhere

Search the codebase for any other user-facing copy referencing birth time or a specific accuracy percentage, and remove those mentions only (no logic changes). Likely candidates to check: `src/routes/input.tsx`, `src/routes/preview.tsx`, `src/routes/success.tsx`, `src/routes/contact.tsx`, `src/routes/privacy.tsx`, `src/routes/refund.tsx`, `src/routes/terms.tsx`, `src/components/site-footer.tsx`, `src/components/site-header.tsx`, and `src/routes/__root.tsx` meta. If a route/form field or label references birth time, remove the copy only — no schema or engine changes (engine already ignores time).

## Out of scope

No changes to edge functions, engine, DB schema, or the compatibility scoring logic.
