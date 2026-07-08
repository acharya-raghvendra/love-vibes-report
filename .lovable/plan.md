## Findings for order 22dbefbf-cdf6-46e0-8030-c015533dcb68

- Gemini HTTP: **200 OK** on both attempts (no `gemini_http`, `gemini_envelope_parse`, `gemini_empty_candidates`, or `gemini_content_parse` errors).
- Failure type: **validate failure** — `validateNoInventedNumbers` rejected both attempts.
- Model: **`gemini-2.5-flash`** confirmed via `[free-report] gemini_model=gemini-2.5-flash`.
- Rejected previews (truncated at 300 chars) mention `34`, `3`, `22` — all of which *are* in the allow-list, so the offending number is further in the prose beyond the 300-char preview.

## Root cause hypothesis

`validateNoInventedNumbers` in `admin-create-free-report/index.ts` returns `false` on the first number in the prose that isn't in `allowedNumberSet`. The allow-list currently covers: score, each person's `lifePath/destiny/soulUrge/personality/maturity` (display/compound/score), `personalYear`, digits 1–9, master numbers 11/22/33, and 4-digit years 19xx/20xx.

Common things Gemini legitimately mentions that fall outside this set:
- Compatibility percentages (e.g. "40%", "60%") from breakdown weights.
- The count of shared numbers (e.g. "2 shared numbers").
- Two-digit ages, day-of-month, month numbers from DOBs.
- Intermediate compound sums not exposed on `cn[k]`.

We can't confirm which without seeing the exact rejected token.

## Plan

1. **Tighten the diagnostic** in `supabase/functions/admin-create-free-report/index.ts`:
   - Change `validateNoInventedNumbers` to return the first offending number (or `null` on success) instead of a bool.
   - In the retry loop, log `[free-report] gemini_invented_number attempt=N n=<offender> preview=<800-char>` (widen preview to 800 chars so context around the number is visible).
   - Keep `gemini_model` and `gemini_validate_failed` lines for continuity.
2. **Redeploy** `admin-create-free-report`.
3. **Ask the user to trigger one more free report**, then pull logs to identify the exact invented number(s).
4. **Fix the allow-list** based on findings — likely one of:
   - Add breakdown weight percentages / raw breakdown scores to `allowedNumberSet`.
   - Add DOB day/month/year components for both people.
   - Add shared-count and any other structured numeric facts passed into `facts`.
   - Or: loosen validator to allow 1–2 digit numbers only when clearly non-numerological (harder — prefer widening the allow-list).
5. **Remove the temporary diagnostic logs** and redeploy clean.

No changes to `love-match-finalize` or any other file.

### Technical notes

- File touched: `supabase/functions/admin-create-free-report/index.ts` (function bodies at lines 117–127 and 204–216).
- No schema, RLS, or client changes.
- Two deploys total: one to add the tightened diagnostic, one to remove it after the fix lands.