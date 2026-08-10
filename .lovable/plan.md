# Latin-only partner names

The numerology engine scores names on Latin letters, so both partner name fields must reject non-Latin scripts before an order is ever created. Right now `/input` only checks that the name is non-empty (`src/routes/input.tsx:162`) and `create-love-match-order` only strips angle brackets and control chars (`cleanName`, line 15) — Devanagari passes both today.

## The rule

```ts
// Latin letters (incl. accents) plus space, hyphen, apostrophe.
// Must start and end with a letter; at least 2 chars.
const LATIN_NAME_RE = /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F' -]*[A-Za-z\u00C0-\u024F]$/;
```

Accepts: `Rahul`, `Anne-Marie`, `O'Brien`, `José García`.
Rejects: `प्रिया`, `Rahul123`, `!!`, `R`, `""`, trailing/leading hyphens.

Applied in two places with the same source of truth in each runtime:
- Client: `src/routes/input.tsx` — blocks submit and shows the inline error.
- Server: `supabase/functions/create-love-match-order/index.ts` — re-checks after cleaning, independent of the client.

## 1. Client — `/input`

- `PartnerCard` gains `error: string | null` and `onValidate: (v: string) => void` props. The name input gets `aria-invalid` / `aria-describedby`, error-red border when invalid, and an inline `<p role="alert">` under the field, matching the existing email field's styling.
- Validation fires on `onChange` and `onBlur` (via `onValidate`), so the error appears as the user types and again on leaving the field.
- Message for any failure — empty, too short, or non-Latin: **"Please enter the name in English."**
- `onSubmit` re-runs validation for both names, sets the errors, and returns early instead of navigating. Existing DOB / phone / email checks are unchanged.

## 2. Server — `create-love-match-order`

After the existing `cleanName()` normalisation, add a Latin gate:

```ts
function validLatinName(v: unknown): string {
  const n = cleanName(v);           // existing: strips <>, control chars, trims, caps 60
  return LATIN_NAME_RE.test(n) ? n : "";
}
```

`person_a.first`, `person_a.last`, `person_b.first`, `person_b.last` all go through it — `last` is optional, so it is only checked when non-empty. On failure:

```
422 { "error": "name must be in English" }
```

This is a separate check from the existing `person_a invalid` / `person_b invalid` DOB response so the client can tell the two apart.

## Left alone

- `reportFileName` / `nameSlug` keep the `"Partner"` fallback as a safety net for legacy rows.
- Email, phone, DOB, gender, coupon, pricing, and Razorpay logic are untouched.
- No database change; no restriction added to any field other than the four name fields.
