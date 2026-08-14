# Fix: "You save" amount on the preview pricing card

## What's wrong (verified)

The card renders `You save ₹{pricing.discountApplied}` (desktop) and `Saved ₹{pricing.discountApplied}` (mobile sticky bar). `discountApplied` is only the coupon's cut off the intro price, not the total saving against the struck-through list price. With list ₹999, intro ₹599 and a ₹100 coupon, the price shows ₹499 but the saving reads ₹100 instead of ₹500.

## The fix

Compute the saving from the two numbers actually shown on the card:

- `saving = round(listPrice − finalAmount)`
- `percent = round(saving / listPrice × 100)`

Render `You save ₹500 (50% off)` on desktop and the same figures in the compact mobile label. Show the line whenever `saving > 0` (so it also shows for the plain intro price, not only when a coupon is applied), and hide it when the final price equals the list price. Both values are whole rupees.

This works for any coupon and any final price because it is derived from the displayed strikethrough and final amounts rather than from the coupon discount alone.

## Order amount

No change needed to what gets charged: the checkout sends the coupon code (never an amount) and the order-creation endpoint recomputes list price, intro price, coupon discount and final amount server-side, returning the authoritative `listPrice` / `finalPrice` that the card then displays. The plan reconciles the card to that same server response, so the displayed price, the displayed saving and the Razorpay amount all come from one set of numbers.

## Scope

- `src/routes/preview.tsx` only — presentation of the saving line in the desktop card and the mobile sticky bar.
- No changes to coupon validation, order creation, the payment webhook, or report generation.

## Verification

Load the checkout and check the saving line with no coupon, with a valid coupon, and after removing the coupon; each time confirm the displayed saving equals strikethrough minus final price and the percentage matches. Then confirm the created order's amount equals the displayed final price.
