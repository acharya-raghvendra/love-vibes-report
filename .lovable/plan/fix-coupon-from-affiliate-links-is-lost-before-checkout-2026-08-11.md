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

## Expiry and active-status enforcement (current server code)

Both checks already exist in both places, and both run on the server clock. The edge functions call `new Date()` inside the Deno runtime — no client-supplied timestamp is read anywhere in either function.

**Checkout box — `validate-coupon` (lines 45-60):**

```
.eq("code", code).eq("is_active", true).maybeSingle()
if (!coupon)                                          -> valid:false "Invalid coupon code"
if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
                                                      -> valid:false "Coupon has expired"
if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses)
                                                      -> valid:false "Coupon usage limit reached"
```

**Order creation — `create-love-match-order` (lines 113-128):**

```
.eq("code", couponCode).eq("is_active", true).maybeSingle()
const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
const maxed   = coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses;
if (!expired && !maxed) { ...apply discount... }
```

So the inactive filter is in the query itself (`is_active = true`), and expiry is a server-time comparison. If the coupon is missing, inactive, expired, or exhausted, `discountApplied` stays `0` and `finalAmount` stays `BASE_PRICE`, and that base amount is what goes into the Razorpay order (`finalAmount * 100`) and the stored `final_price`. The code is still recorded on the row as `coupon_code`, which is why the DB check below reads `discount_applied`/`final_price`, not just the code.

This holds regardless of how the code arrives — URL param, sessionStorage, hand-typed box, or a raw request body — because order creation never trusts a client amount (it logs and discards `body.amount`) and re-fetches the coupon itself. The URL persistence added by this fix therefore cannot widen the surface: it only changes which string is proposed, never whether it is honoured.

One asymmetry worth stating: `validate-coupon` returns an explicit error message, while order creation silently ignores a bad coupon and charges full price. That is fail-safe (never under-charges), and this plan does not change it.

## Scope

- `src/routes/index.tsx`, `src/routes/input.tsx`, `src/routes/preview.tsx` only.
- No edge function, migration, or payment/webhook changes.

## Verification

**Coupon persistence.** Drive the live preview end to end with `/?coupon=TEST`: confirm the code survives the form and the "Check Compatibility" navigation, that checkout shows it auto-applied with the discounted price, and then paste back (a) the resolved coupon source, (b) the `create-love-match-order` request body showing `couponCode: "TEST"`, and (c) the order row plus the Razorpay order amount in paise proving the discounted price is what hits the gateway.

**Expiry and inactive, live.** Right now the coupon table holds only three rows (`TEST`, `OFF100`, `LOVE100`) and all three are active with no expiry, so no negative case can be tested against existing data. Build step: insert two temporary coupons — `EXPIRED_TEST` (active, `expires_at` = yesterday) and `INACTIVE_TEST` (`is_active = false`, no expiry) — then for each run both paths and paste the raw results:

1. `validate-coupon` with the code -> expect `valid:false` with "Coupon has expired" / "Invalid coupon code".
2. `create-love-match-order` called directly with `couponCode` set to that code in the body (bypassing the UI entirely) -> expect the response `discountApplied: 0` and `finalPrice` equal to the base offer price, and the Razorpay `amount` in paise equal to that base price.
3. The resulting `love_match_orders` row showing `discount_applied = 0` and `final_price` = base price.

Then delete both temporary coupons and the throwaway order rows. Already verified read-only: `validate-coupon` with a non-existent code returns `{"valid":false,"error":"Invalid coupon code"}`.
