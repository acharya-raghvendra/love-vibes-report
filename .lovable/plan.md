# Quieter logs for other products' webhook events

Confirmed behaviour today: a Razorpay webhook for an order that isn't a Love Match order is skipped cleanly — no alert email, no `error_detail` write, no generation. Both alert branches in `love-match-finalize` are gated on our own order row existing, and `error_detail` updates are scoped by `order_id` on `love_match_orders`, so a foreign order can't be touched.

The one rough edge: the unmatched-event branch logs at `console.error`, so if the webhook is registered account-wide, every Numerology (or other product) payment writes an error-level line into the finalize logs and buries real failures.

## Change

In `supabase/functions/love-match-finalize/index.ts`, split the unmatched case into two:

- **Foreign / not-ours (expected):** no `order_id` in the event notes and no row matching the gateway order id → log with `console.log` at info level, e.g. `[finalize] not_ours event=… rzp_order=…`, and keep returning `200 {ignored: true, reason: "no_order"}`.
- **Notes named an order we don't have (unexpected):** the event carried an `order_id` in its notes but no `love_match_orders` row exists for it → keep `console.error`, since that can mean a lost or mis-written order row for our own product. Still returns 200 so Razorpay stops retrying.

Same for the downstream `not_found` skip after `claimOrder`: keep it at `console.log`, unchanged.

## Unchanged

Signature verification, amount check and its alert emails, status transitions, `claimOrder` idempotency, prose/PDF pipeline, delivery stages, all response shapes and status codes.

## Technical notes

- One file touched: `supabase/functions/love-match-finalize/index.ts`; the function is redeployed afterwards.
- Verification: forge a webhook with a foreign `notes.order_id` and a valid signature, then read the function logs to confirm an info-level `not_ours` line, no alert email, no `error_detail` row change, and a 200 response.
