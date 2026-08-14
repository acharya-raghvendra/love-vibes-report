# Report delivery must not depend on the browser

Most of what this request asks for is already live. Verified in the current code and database:

- Server-side webhook delivery exists: `love-match-finalize` verifies the Razorpay signature (HMAC-SHA256 of the raw body, constant-time compare), rejects bad signatures with 401, resolves our order from `notes.order_id` or the stored gateway order id, marks it `paid`, then runs the shared pipeline. It handles `payment.captured` and `order.paid`.
- Idempotency exists: `_shared/generate-report.ts` `claimOrder()` does an atomic conditional update into `generating`, keyed on `order_id`, with attempt caps and a stale-`generating` cutoff. Webhook replays and double-fires can't produce two reports.
- The browser is already demoted: the Razorpay `handler` in `preview.tsx` only navigates to `/success`. It never triggers report generation (the `love-match-generate` call on that page is the free preview math, not the paid report).
- The reconciliation sweep endpoint exists: `POST /api/public/reconcile-orders` flips stale `generating` rows to `failed`, then re-verifies payment at Razorpay for recent `created`/`paid`/`failed` rows and re-drives generation.
- Both channels already fire server-side (email via Resend + WhatsApp via AiSensy) with per-channel flags and either-channel `delivered`.

So three real gaps remain.

## 1. Captured amount is never checked

The webhook currently trusts the event. Add, before marking paid and generating: read the matched order's `final_price` and compare it to the captured amount from the event (`payment.amount`, paise → rupees; for `order.paid` use `amount_paid`). On mismatch: log the order id and both amounts, write a technical note to `error_detail`, leave the order un-generated, and return 200 so Razorpay stops retrying. Orders with no `final_price` recorded fall back to the pricing row's current offer price; if neither is available the order is treated as a mismatch and not delivered.

## 2. No scheduled reconciliation

`pg_cron` is not enabled on this project and no job is scheduled, so the sweep only ever runs if someone calls it. Migration: enable `pg_cron` + `pg_net`, and schedule `reconcile-love-match` every 30 minutes to `POST` the existing stable production URL `https://project--163c0296-9f06-4c18-81ab-8a9f6f4efb74.lovable.app/api/public/reconcile-orders` with the project's publishable key in an `apikey` header. No new secret. The endpoint's own 48h lookback / max-5-per-run / attempt-cap limits stay as they are, and it already returns the reconciled order ids, which land in `cron.job_run_details` for the "if this fires often the webhook is misconfigured" signal.

## 3. Success-screen copy

`/success` currently says "Your full report is being prepared by the stars." Replace the reassurance block with the explicit close-the-page line, in the language the order was placed in (`language` on the order row, already returned-adjacent in the status flow; where unavailable it defaults to Hindi, matching order creation):

- EN: "Payment received. Your full report is being prepared and will arrive on your WhatsApp and email within a few minutes — you can safely close this page."
- HI: "Payment mil gaya. Aapki poori report taiyaar ho rahi hai — kuch hi minute me WhatsApp aur email par aa jayegi. Aap yeh page band kar sakte hain."

Shown while the order is pre-`ready`. Once the report is ready/delivered the existing download and per-channel status UI stays exactly as it is.

## Verification I will run and report

- Forged webhook with a bad signature → 401, nothing generated (already true; re-confirmed after the amount change).
- Replay a real event twice → single report, second call returns `skipped`.
- An amount-mismatch payload → not delivered, mismatch logged.
- Confirm the cron job is registered and inspect its first run in `cron.job_run_details`.
- One real paid order end-to-end with the tab closed immediately: report arrives by email + WhatsApp, and the success copy renders in the ordered language.

## Technical notes

- Files touched: `supabase/functions/love-match-finalize/index.ts` (amount check only), `src/routes/success.tsx` (copy), plus one migration for the cron schedule. `love-match-finalize` gets redeployed.
- The status endpoint will also return the order's `language` so the success page can pick the copy without trusting a URL param.
- No new edge function is created — `love-match-finalize` already is the `razorpay-webhook` this asks for, and its URL is already registered with the webhook secret in place (`RAZORPAY_WEBHOOK_SECRET`).
- Unchanged: order creation, coupon logic, pricing, prose/PDF pipeline, delivery stages, status state machine.
