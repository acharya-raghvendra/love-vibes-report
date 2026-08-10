# Email delivery for Love Match reports

Today the pipeline already tries to email the PDF via Resend using `person_a.email`, but nothing on the site ever collects an email, so `toEmail` is always null and no email is ever sent. This plan collects the email, validates it, stores it, and makes email a first-class delivery stage with its own retry and failure reporting.

## 1. Collect the email

- Input form (`/input`): add a required "Email address" field next to the WhatsApp field, with the same styling. Client-side validation blocks submit on empty or malformed addresses and shows an inline message.
- The email travels with the existing session payload into `/preview` and is sent to the order-creation endpoint as `person_a.email`.
- Server side (order creation): validate and normalise (trim, lowercase, length cap, format check). Reject with 422 `email required` when missing or invalid — same treatment the phone already gets.
- Storage: keep it inside the existing `person_a` JSON (where the pipeline already reads it) and additionally persist a dedicated `email` column on the order row so admin views and future queries can filter on it without JSON digging.

## 2. Email as its own delivery stage

The Resend send moves out of the current best-effort try/catch into a dedicated stage that mirrors how prose generation already handles transient errors:

- Retry on 429 and 5xx with exponential backoff plus jitter (up to 4 attempts), honouring `Retry-After` when Resend returns one.
- Do not retry 4xx other than 429 (bad address, domain not verified, etc.) — those are permanent.
- Success: set `email_sent = true`, record `delivered_at`.
- Permanent failure: the order stays `ready` (the PDF is already generated and viewable), `email_sent` stays false, and the Resend status + trimmed error body is written to `error_detail`.

## 3. Delivery model: either channel counts

- Per-channel flags tracked separately: new `email_sent` column, existing `whatsapp_sent` kept as the WhatsApp flag only (it is currently being reused as a generic delivered flag — that ends here).
- An order becomes `delivered` when **either** flag is true. Requiring both is explicitly out.
- The public status endpoint reports `delivered` plus the two channel flags, and the success page copy reflects which channel actually worked.

## 4. Admin visibility

- Failures dashboard: add an "Email" column showing sent / failed, and surface the stored `error_detail` for email failures so a bad address or unverified domain is obvious at a glance.
- Orders list gets the recipient email alongside the phone.

## 5. DNS records you need to add

The from-address stays exactly as the pipeline already uses:

```text
TalkToGuruji <alerts@update.talktoguruji.com>
```

So the domain to verify in Resend is the subdomain **`update.talktoguruji.com`** (not the root domain). In Resend, Domains > Add Domain > enter `update.talktoguruji.com`, pick your region, then add the records it shows you at your DNS host. Resend generates four records, and the DKIM key is unique to your domain — copy the values verbatim from the Resend screen rather than from anywhere else:

| Type | Name (host) | Purpose |
|------|-------------|---------|
| MX | `send.update` | Bounce/feedback handling for the sending subdomain |
| TXT | `send.update` | SPF (`v=spf1 include:amazonses.com ~all`) |
| TXT | `resend._domainkey.update` | DKIM public key — long unique value from Resend |
| TXT | `_dmarc.update` (optional but recommended) | DMARC policy, e.g. `v=DMARC1; p=none;` |

Notes:
- Host names above are written for a DNS host that auto-appends `talktoguruji.com`. If yours needs fully-qualified names, use `send.update.talktoguruji.com`, `resend._domainkey.update.talktoguruji.com`, etc.
- Do not wrap the DKIM value across lines or add quotes your provider doesn't require.
- Propagation is usually minutes; Resend flips the domain to Verified on its own. Until it is verified, Resend returns a permanent 403 and orders will show email delivery failed while still being downloadable.
- If any Resend record conflicts with an existing SPF TXT record on the same host, merge the `include:` rather than adding a second SPF record.

## Technical notes

- Migration: add `email text` and `email_sent boolean not null default false` to `public.love_match_orders`. No new grants needed (existing admin/affiliate read policies cover it); the pipeline writes with the service role.
- Files touched: `src/routes/input.tsx`, `src/routes/preview.tsx`, `src/routes/success.tsx`, `supabase/functions/create-love-match-order/index.ts`, `supabase/functions/_shared/generate-report.ts` (new `deliverEmail` helper with backoff), `src/routes/api/public/love-match-status.ts`, `src/routes/_admin.dashboard.failures.tsx`, `src/routes/_admin.dashboard.orders.tsx`.
- Untouched: Razorpay signature verification, order claiming/idempotency, prose generation and number guard, PDF build, storage upload and signing.
- `admin-create-free-report` already has its own recipient email field; it will reuse the same backoff helper so behaviour matches the paid path.
