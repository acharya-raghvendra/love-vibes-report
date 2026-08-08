# Fix: coupon applies but price doesn't update

## What I verified

- The coupon check endpoint works: applying `TEST` returns `valid: true`, `listPrice: 999`, `originalPrice: 599`, `calculatedDiscount: 589`, `finalPrice: 10`.
- The checkout screen (`src/routes/preview.tsx`) keeps price and Razorpay order data in one `quote` state object, and the coupon handler already writes the discounted `finalPrice` into it.
- The order-creation endpoint already recomputes price and coupon server-side and ignores any client amount (it logs and discards a client-sent amount).

So the price value itself is correct — the problem is that it gets overwritten.

## Likely cause (to confirm first)

When the preview loads, the page fires a background order-creation call to fetch the server price. That call is slow (it writes an order row and calls the payment gateway). Its result is written into the same `quote` state with no staleness guard. If the user applies a coupon while that request is still in flight, the late response lands afterwards and replaces the discounted price with the base price — the coupon shows as applied, price snaps back to the original.

A second, smaller issue: removing a coupon sets the price state to `null`, so the price area falls back to the loading shimmer instead of instantly restoring the original price.

Step one of the build is to confirm the overwrite in the browser (apply a coupon immediately after load vs. after waiting), so the fix targets the real cause.

## The fix

1. **One source of truth for the amount.** Split the state: a `pricing` object (`listPrice`, `originalPrice`, `discountApplied`, `finalAmount`) that the whole UI reads, and a separate `order` object for the gateway handoff (`orderId`, `keyId`, `amount`, `currency`, `internalOrderId`). Every price rendered on desktop and mobile reads `pricing.finalAmount`; the strike-through reads `pricing.listPrice`.

2. **Staleness guard.** Add a request-generation counter (ref). The background price prefetch and any order creation only write into `pricing` if their generation still matches the latest. Applying or removing a coupon bumps the generation, so an in-flight base-price response can never overwrite a coupon result.

3. **Coupon apply.** On a valid coupon: set `finalAmount = originalPrice - discount`, store `discountApplied`, mark the existing gateway order stale, and re-render immediately with original struck through + new price and a "you save" line.

4. **Coupon remove.** Restore `finalAmount` to the pre-coupon `originalPrice` from the last server price response (kept in state), clear `discountApplied` and the code, and mark the gateway order stale — no shimmer, no flicker.

5. **Invalid / expired coupon.** Show the server's error message via the existing toast, leave `pricing` untouched, and do not mark the code as applied.

6. **Order creation reads the same value.** Unlock always creates a fresh order when the applied coupon changed, sending `couponCode` (not an amount). The server recomputes price and discount and returns the authoritative `finalPrice`/`amount`; we then reconcile `pricing.finalAmount` with the server value before opening the gateway, so the charged amount always equals the displayed amount. The client amount is never trusted server-side — that behaviour stays as it is.

## Scope

- `src/routes/preview.tsx` only.
- No changes to the order-creation or coupon-validation endpoints, the payment webhook, or report generation.

## Verification

Drive the live preview: load the checkout, apply `TEST` immediately after load (the race window), confirm the price switches to the discounted value and stays there, confirm remove restores the original, and confirm an invalid code shows an error with the price unchanged. Then paste back the three code blocks — coupon handler, price state, order-creation call — so you can confirm they share one `finalAmount`.
