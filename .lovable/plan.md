# Fix: paid orders never generate a report

## Diagnosis (verified before writing this plan)

**(a) NO invocation.** The report-generation function `love-match-finalize` has **zero log entries** — it has never been invoked. There is no error text because nothing ran.

**Order rows confirm it.** Every recent order sits at `status = 'created'` with `failure_reason = NULL`, `pdf_url = NULL`, `whatsapp_sent = false`:

```text
db2b5b65…  created  2026-08-10 06:47  coupon OFF100  ₹10
2cf08832…  created  2026-08-10 06:47  —              ₹599
11ebb372…  created  2026-08-08 12:01  —              ₹599
…  (all 12 recent paid/attempted orders: created)
```

The only `delivered` rows are `ADMIN_FREE` reports from the admin free-report path — never a Razorpay-paid one.

**Root cause:** generation is triggered exclusively by the Razorpay webhook, and that webhook never reaches us. Contributing factors in code:

- The webhook is not being delivered/matched at all (no invocation), so the pipeline is a dead branch today.
- `love-match-finalize` matches the order **only** via `payload.payment.entity.notes.order_id`. Notes are set on the Razorpay *order*, and payment-entity notes are not guaranteed to carry them — so even once delivery works, matching can silently fail with `no_order`.
- It only accepts `event === "payment.captured"`; `order.paid` is ignored.
- The success page (`src/routes/success.tsx`) never reads any status — the three steps are hardcoded decoration, so it always shows "Generating report" forever.
- There is no `generating` state, no timeout guard, and `admin-retry-delivery` is a 501 stub.

Note: there is no "Complete tier / birth time" concept in this product — inputs are names + DOB only, so that failure mode does not apply here.

## What gets built

### 1. Order row schema (migration)
- `status` state machine values: `created → paid → generating → ready → delivered`, plus `failed`.
- Add `error_message text`, `generation_started_at timestamptz`, `ready_at timestamptz`, `delivered_at timestamptz`, `attempt_count int default 0`.
- Keep existing `failure_reason` and `whatsapp_sent` (delivered flag) untouched for admin screens; `error_message` holds the human-readable detail.
- No anon access added; reads for the success page go through a dedicated function.

### 2. Webhook handler (`love-match-finalize`)
- Signature verification, payment capture and coupon logic stay exactly as-is.
- Accept both `payment.captured` and `order.paid`.
- Order matching order of precedence: `notes.order_id` → lookup by `razorpay_order_id` from the payload's order id. Unmatched → 200 with a logged reason (never retried forever).
- **Idempotency keyed on order id:** a conditional claim update (`set status='generating', generation_started_at=now() where order_id=… and status in ('created','paid','failed')`). If the claim returns 0 rows, another invocation already owns it → return 200 immediately. `ready`/`delivered` rows short-circuit to 200.
- Every step writes status; all work wrapped so any throw sets `status='failed'`, `error_message`, `failure_reason` — never left in `generating`.
- On success: `ready` (+`pdf_url`) → after email send `delivered`. Email failure leaves the order `ready` (report is viewable) rather than failed.

### 3. Webhook-independent safety net
Because the observed cause is non-delivery, add a reconciler so a paid order still gets a report if the webhook is silent:
- `POST /api/public/reconcile-orders` (TanStack public server route, shared-secret header) that finds orders older than ~2 minutes still in `created`, asks the Razorpay Orders API whether they are paid, and invokes the generation pipeline for those that are.
- The same route flips **stale `generating`** rows (older than 6 minutes) to `failed` with `error_message = 'generation_timeout'` — satisfying the "must reach a terminal state" guard.
- Schedulable by pg_cron; I'll wire the schedule after approval.

### 4. Public status endpoint
New `order-status` function (`verify_jwt = false`) returning only `{ status, ready, pdf_url?, error_message? }` for a given `order_id` — no PII, no person data.

### 5. Success page (`src/routes/success.tsx`)
- Polls `order-status` every 4s (stops on terminal state, backs off after ~5 min).
- `created/paid` → "Confirming payment"; `generating` → animated "Generating report"; `ready/delivered` → steps complete and **"View Report Online"** enabled, linking to the signed PDF URL.
- `failed` → real error message, **Retry** button, and a WhatsApp fallback link. No infinite spinner in any state.

### 6. Retry path
- Implement `admin-retry-delivery` for real: admin-authenticated, resets a `failed`/stale order and re-runs the pipeline (reusing the shared generation module).
- The success page Retry button calls a narrow public retry endpoint that only accepts an order id whose status is `failed` and whose payment is confirmed paid with Razorpay, rate-limited by `attempt_count` (max 3).

## Technical notes
- The generation body of `love-match-finalize` is extracted into `supabase/functions/_shared/generate-report.ts` so the webhook, the reconciler, and both retry paths run identical code. Prose/PDF/prompt/engine files are unchanged.
- Coupon validation, price calculation, and payment capture logic are not touched.
- **Action needed from you:** the Razorpay dashboard webhook must point at this project's `love-match-finalize` URL with `payment.captured` and `order.paid` enabled and the secret matching `RAZORPAY_WEBHOOK_SECRET`. I'll give you the exact URL and the secret name to verify; the reconciler above means orders still complete while that is being fixed.

## After the build
I'll paste the final webhook handler and the generation entry point plus its error handling, and confirm terminal-state behaviour on a real order.
