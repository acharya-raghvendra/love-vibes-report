# Fix: coupon from affiliate links is lost before checkout

## Diagnosis (verified in code)

**1. Where the coupon is captured today**

Only on the checkout screen. `src/routes/preview.tsx` holds `couponInput` / `appliedCoupon` in React state (lines 215-220) and validates via the `validate-coupon` function. There is no coupon field, and no reading of a `?coupon=` URL value, anywhere on the landing page (`src/routes/index.tsx`) or the form (`src/routes/input.tsx`) — a search for "coupon" in both files returns nothing.

**2. Where it is dropped**

The affiliate portal hands out links of the form `${origin}/?coupon=CODE` (`src/routes/_affiliate.portal.coupons.tsx:76`). Nothing on `/` ever reads that parameter, so the code is dropped on the very first page — before the form, not at the "Check Compatibility" click. The click itself only writes the form fields to `sessionStorage["loveMatch:input"]` and navigates to `/preview` (`src/routes/input.tsx:288-305`); the stored payload contains `person_a`, `person_b`, `language` and nothing else. `/preview` reads that same key and starts with an empty coupon box, so the price is always the base price unless the visitor retypes the code.

**3. Payloads**

- Input → preview: `sessionStorage["loveMatch:input"] = { person_a, person_b, language }` — no coupon field.
- Preview → order creation: `createOrder` already sends `couponCode` in the body to `create-love-match-order` (`preview.tsx:302`), and unlock sends `appliedCoupon` (`preview.tsx:399`). So the wire to the server is intact; it just always carries `null`.

**4. How numerology persists it**

The coupon lives in the URL and is re-appended on every navigation: landing CTAs read `?coupon=` and navigate to `/generate?coupon=CODE`; the coupon input auto-applies a URL coupon on mount; order creation reads `urlParams.get('coupon')` first and only then falls back to local state; and the landing page clears any stale stored coupon when the URL has none. That URL-first, auto-apply pattern is what love-match will copy.

## The fix

1. **Read and keep the coupon at entry.** Add an optional `coupon` search param to `/`, `/input`, and `/preview`. On mount, if `?coupon=` is present, normalise it (trim + uppercase) and mirror it into `sessionStorage["loveMatch:coupon"]`. If the URL has no coupon on the landing page, clear that stored key — same stale-clearing rule as numerology.

2. **Carry it through navigation.** Every landing CTA that goes to `/input`, and the "Check Compatibility" navigation to `/preview`, pass `search: { coupon }` when a coupon is active, so the code stays visible in the URL for the whole funnel and survives refresh.

3. **Auto-apply on checkout.** On `/preview` mount, take the coupon from the URL (falling back to the sessionStorage mirror) and run the existing `validate-coupon` path automatically: fill the box, mark it applied, and set the discounted price through the current pricing state and generation-guard logic. An invalid or expired code shows the existing inline error and leaves the base price intact. Manual entry and Remove keep working exactly as now; removing also clears the stored mirror and the URL param so it does not silently come back.

4. **Order creation.** `createOrder` keeps sending `couponCode`, now resolved as `appliedCoupon ?? url/session coupon`, so the discount reaches `create-love-match-order` on both the background prefetch and the unlock call.

5. **Server stays authoritative.** No change to `create-love-match-order` or `validate-coupon`. The function ignores any client amount, loads pricing from `love_match_pricing`, re-validates the coupon (active, not expired, under `max_uses`), computes `finalAmount = BASE_PRICE - discount`, and sends `finalAmount * 100` as the Razorpay order amount. After the change we re-read the displayed price from the server's `finalPrice` before opening the gateway, so displayed and charged amounts cannot diverge.

## Scope

- `src/routes/index.tsx`, `src/routes/input.tsx`, `src/routes/preview.tsx` only.
- No edge function, migration, or payment/webhook changes.

## Verification

Drive the live preview end to end with `/?coupon=TEST`: confirm the code survives the form and the "Check Compatibility" navigation, that checkout shows it auto-applied with the discounted price, and then paste back (a) the resolved coupon source, (b) the `create-love-match-order` request body showing `couponCode: "TEST"`, and (c) the order row plus the Razorpay order amount in paise proving the discounted price is what hits the gateway.
