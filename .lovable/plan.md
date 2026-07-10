
# Internals report — Love Match report pipeline

Read-only. No code changes proposed.

## 1. `love-match-finalize` pipeline (in order)

File: `supabase/functions/love-match-finalize/index.ts`

| # | Step | Helper (function → file) |
|---|---|---|
| 1 | Read raw body, verify Razorpay signature | `hmacSha256Hex` + `timingSafeEqual` (inline in `love-match-finalize/index.ts`) |
| 2 | Parse event, ignore non-`payment.captured` | inline |
| 3 | Load order by `order_id` from `love_match_orders` (never trusts webhook body) | `supabase.from("love_match_orders").select(...)` |
| 4 | Idempotency guard (`status === "delivered"` → short-circuit) | inline |
| 5 | Mark `status = "paid"` | inline update |
| 6 | Recompute facts server-side from names + DOBs | `scoreMatch` → `supabase/functions/_shared/engine/scorer.ts` |
| 7 | Build `chemistry` array (planet labels, relation labels) | inline `PLANETS`, `relationLabel`, `pairLabel` |
| 8 | Prose cache lookup by `prose_key` | `sha256` (inline) → `love_match_prose_cache` |
| 9 | Gemini prose generation (retry once, validate no invented numbers) | `generateProse` (inline) using `buildSystemPrompt` → `supabase/functions/_shared/prosePrompt.ts`; `validateNoInventedNumbers` + `allowedNumberSet` (inline) |
| 10 | Cache prose (`upsert` into `love_match_prose_cache`) | inline |
| 11 | Build HTML | `buildReportHtml` → `supabase/functions/_shared/buildReportHtml.ts` |
| 12 | Browserless PDF render (`production-sfo.browserless.io/pdf`) | inline `fetch`; validates `pdfBytes.length ≥ 10240` |
| 13 | Upload to Storage `love-match-pdfs/love-match/{orderId}.pdf`; sign URL 30 days | `supabase.storage.from(...).upload / createSignedUrl` |
| 14 | Resend email (best-effort) | inline `fetch` to `api.resend.com/emails`, HTML from `buildReportEmailHtml` (inline) |
| 15 | Update `love_match_orders` to `status="delivered"`, `pdf_url`, `whatsapp_sent` | inline |
| 16 | Increment coupon usage via RPC (non-fatal) | `supabase.rpc("increment_coupon_usage", ...)` |

Failure branch: `markFail(reason)` sets `status="failed"` + `failure_reason`.

## 2. `buildReportHtml` signature

File: `supabase/functions/_shared/buildReportHtml.ts`

```ts
export function buildReportHtml(
  facts: Facts,
  sections: Record<string, unknown>
): string
```

`Facts` = `{ language?, score, band, shared?, person_a: CoreNumbers, person_b: CoreNumbers, chemistry?: ChemPair[], names?: { a?, b? } }`.

Branding today: **hardcoded**, no argument.
- `LOGO_URL` const at top of file (`https://love.talktoguruji.com/__l5e/…/talktoguruji-logo.png`)
- Footer text `"TalkToGuruji • Love Match Report"` hardcoded in `frun()`
- Upsell URL/coupon hardcoded (`numerology.talktoguruji.com?coupon=LOVE`, ₹399)
- Company name `"Inno-One Service LLP"` hardcoded in disclaimer

No `brand`, `logoUrl`, `footer`, or `upsell` argument exists.

## 3. `admin-create-free-report`

File: `supabase/functions/admin-create-free-report/index.ts`

- **Auth**: `requireAdmin(req)` from `supabase/functions/_shared/admin-auth.ts`. It reads `Authorization` header, `auth.getUser()` against `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY`, then calls RPC `has_role(user_id, 'admin')`. Returns 401 or 403. Uses a **user JWT** — no shared secret.
- **Pipeline sharing**: **duplicated**, not shared. The score→prose→PDF→storage→email logic is copy-pasted from `love-match-finalize`. Only `scoreMatch`, `buildReportHtml`, and `buildSystemPrompt` are imported from `_shared/`. There is **no shared pipeline module** (no `_shared/runReportPipeline.ts`); `generateProse`, `validateNoInventedNumbers`, `allowedNumberSet`, `buildReportEmailHtml`, `sha256`, etc. exist inline in both files.
- Response: `202 { order_id, status: "processing" }`; work runs via `EdgeRuntime.waitUntil`. Client polls `love_match_orders`.

## 4. `love_match_orders` columns

| Column | Type | Notes |
|---|---|---|
| `order_id` | text | PK |
| `person_a` | jsonb | `{first,last,dob,phone?,email?}` |
| `person_b` | jsonb | `{first,last,dob}` |
| `language` | text | default `'en'` |
| `ref_year` | integer | |
| `status` | text | default `'created'`. Live values in DB: `created`, `delivered`, `failed`. Code also writes transient `paid` in `love-match-finalize`. |
| `pdf_url` | text | signed URL, 30-day |
| `whatsapp_sent` | boolean | reused as "email delivered" flag |
| `razorpay_order_id` | text | |
| `failure_reason` | text | |
| `final_price` | integer | |
| `discount_applied` | integer | default 0 |
| `coupon_code` | text | `admin-create-free-report` writes `'ADMIN_FREE'` |
| `created_at` | timestamptz | |

**No `partner_id`, `brand`, `tenant`, `source`, or upsell-related columns.**

## 5. `love_match_prose_cache` cache key

`prose_key = sha256("prose:v3:" + language + ":" + JSON.stringify(facts))`

where `facts = { language, score, band, shared, person_a: result.a, person_b: result.b, names: { a: aFirst, b: bFirst } }` (no `chemistry`, no DOBs, no phone/email). Same formula in both `love-match-finalize` and `admin-create-free-report`.

## 6. Shared-secret authenticated functions

**None.** Every function today uses either:
- Razorpay HMAC signature (`love-match-finalize` — `RAZORPAY_WEBHOOK_SECRET`)
- Supabase user JWT + `has_role` (`admin-*` functions via `requireAdmin`)
- Or is public / `verify_jwt = false` with no auth (`love-match-generate`, `create-love-match-order`, `validate-coupon`)

No `X-API-KEY` / `PARTNER_SECRET` / bearer-shared-secret pattern exists.

## 7. Env vars read via `Deno.env.get`

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `BROWSERLESS_API_KEY`
- `RESEND_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## 8. Upsell page location & gating shape

File: `supabase/functions/_shared/buildReportHtml.ts`, inside `buildReportHtml`, roughly **lines 213–237**, between the s13 closing letter and the final disclaimer page.

- Not a separate function — it's an inline block that:
  1. Builds a language-aware `up` object (`{ eyebrow, title, body, card, sub, cta, note }`)
  2. Appends one `<div class="page">…</div>` to `pages`
  3. Calls `frun(++pg, hi)` for the page footer (this is how the page break/pagination works — every page is its own `<div class="page">` with `page-break-after: always` in CSS, and `pg` is a shared counter incremented as pages are emitted)
- CSS classes owned by this block: `.upsell`, `.up-head`, `.up-title`, `.up-price`, `.up-sub`, `.up-cta`, `.up-note`
- Hardcoded values: URL `https://numerology.talktoguruji.com?coupon=LOVE`, price `₹399`, card title `"Numerology Report"`

To gate it behind a flag you'd wrap that block in `if (opts.showUpsell)` and **skip the `++pg`** (or keep sequential numbering — the counter's only effect is the footer page number; nothing downstream depends on total page count).

---

Ready to move to build mode whenever you want to act on any of this (partner endpoint, `brand`/`upsell` args on `buildReportHtml`, extracting a `_shared/runReportPipeline.ts`, or adding partner columns to `love_match_orders`).
