# Fix: paid reports hard-failing on the number guard

## What actually happened

Order `a01df651-f974-4846-9d65-a56f1139164e` (real payment, webhook fired correctly):

- Gemini returned **HTTP 200, finish_reason=STOP**, complete JSON — twice.
- Both responses were thrown away by the local `validateNoInventedNumbers` guard, which rejects *any* number under 4 digits that isn't in a small allow-list (core numbers plus 1-9, 11, 22, 33). Ordinary prose numbers ("20 points", "10 years") fail the whole paid report.
- The order was marked `failed` with only the friendly text stored; the real reason was never persisted.
- The later admin retry hit a separate transient Gemini `503 UNAVAILABLE`, with no backoff between attempts.

Confirmed: the engine's computed values **are** already sent to the model — `facts.person_a` / `facts.person_b` carry each core number's `display`, `compound` and `score`. So the model is being told the numbers; the deeper bug is only that the guard doesn't compare against them, it compares against a blanket list.

## What changes

### 1. Number guard becomes a verifier, not a gate

Replace the blanket allow-list with a check against the engine's authoritative values:

- Extract stated core-number claims from the prose (a number 1-33 presented as a person's Life Path / Destiny / Soul Urge / Personality).
- Matches the computed value: allow.
- Contradicts it: a real hallucination.
- Incidental numbers (counts, days, ages, percentages, years, money) are never gated.

On contradiction:

1. Regenerate with a corrective instruction naming the exact correct numbers. Cap: 2 content retries.
2. Still contradicting: deterministically rewrite the offending number to the correct value — the values are known, so this is safe.
3. A paid order **never** hard-fails on this guard. Worst case is corrected prose plus a logged incident.

### 2. Transient-error backoff, separate budget

- Retry only on 429, 500, 503 and network/timeout errors. Never on 400/401/403 — those are permanent.
- Exponential backoff with jitter (~1s, 2s, 4s), max 4 attempts, honouring `Retry-After`.
- This budget is independent of the 2 content retries; neither eats the other.
- Total worst-case wall time capped so it stays comfortably under the 6-minute stale-`generating` cutoff, so the reconciler can never fail an order mid-backoff.
- All transient attempts exhausted: fail with `gemini_overloaded` so retry/reconcile can pick it up later. Nothing is left hanging.

### 3. Persist the real failure detail

Add an admin-only `error_detail` column on `love_match_orders` (friendly `error_message` unchanged for customers). It records:

- error type: `number_guard_mismatch` / `gemini_overloaded` / `gemini_http` / `pdf_error` / `storage_error`
- provider status code and a short body excerpt
- offending tokens or short reason
- which stage failed and on which attempt ("text step, retry 2 of 2")

Redacted: no API keys, no customer PII. The public `love-match-status` endpoint keeps its current column list (`status, pdf_url, error_message, attempt_count, whatsapp_sent`) — `error_detail` is not added to it, so it stays out of the public payload. It surfaces in the admin failures view instead.

## Technical notes

- Guard + retry logic: `supabase/functions/_shared/prose.ts` (`validateNoInventedNumbers`, `generateProse`) and the retry loop in `supabase/functions/_shared/generate-report.ts`.
- The corrective-retry and deterministic-correction paths live in the shared pipeline, so `love-match-finalize`, `admin-retry-delivery`, `reconcile`, `admin-create-free-report` and `partner-generate-full` all inherit them.
- The prose cache key stays on the same `prose:v3:` shape; corrected prose is cached only after correction.
- One migration adds the `error_detail` text column (nullable) plus a small admin-visible surface in the failures dashboard.
- Untouched: Razorpay signature verification, status transitions, PDF rendering, storage upload, email delivery, `_shared/engine/*`.

## Verification

Re-run generation for the failed order and confirm it reaches `ready` with a PDF, then check `error_detail` is populated (and public status output unchanged) on a deliberately forced failure.
