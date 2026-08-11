# WhatsApp delivery via AiSensy (campaign `love_match_report_pdf_api`)

## Current state (verified)

- `_shared/generate-report.ts` already mints two signed URLs: a plain 30-day one (`pdf_url`) and a download-flagged one (`emailPdfUrl`), then runs a single `deliverEmail` stage with 4-attempt backoff (retries 429/5xx, honours `Retry-After`, never throws).
- On email success the order goes to `delivered` + `email_sent = true`; on failure it stays `ready` and the reason lands in `error_detail`.
- `delivered` is computed as `emailResult.sent || order.whatsapp_sent === true` — but nothing in the pipeline ever sets `whatsapp_sent` today, so the WhatsApp half of the either-channel model is currently dead.
- The delivery phone is stored on the order as `person_a.phone`, already digit-cleaned at order creation (`cleanPhone`, min 10 digits) — no `+`, but not guaranteed to carry the `91` prefix.

## What gets built

### 1. Secret
Add `AISENSY_API_KEY` to this project's secrets and read it with `Deno.env.get` inside the stage. Missing key = permanent failure detail, never a thrown error.

### 2. `deliverWhatsApp` stage in `_shared/generate-report.ts`
New exported function alongside `deliverEmail`, same contract (`{ sent, detail }`, never throws), POSTing to `https://backend.aisensy.com/campaign/t1/api/v2`:

```text
apiKey        <- AISENSY_API_KEY
campaignName  "love_match_report_pdf_api"
destination   normalized person_a.phone  -> 91XXXXXXXXXX
userName      "love.talktoguruji.com"
templateParams [ person_a.first ]
media         { url: <download-flagged signed PDF URL>, filename: "Love-Report.pdf" }
```

Phone normalisation: strip everything non-digit, drop a leading `00`, drop a leading `0`, then prefix `91` if not already present; require exactly 12 digits starting `91` afterwards, otherwise permanent failure (`invalid_phone`) with no request sent.

Media is always populated (our template header is DOCUMENT), so the message arrives as a PDF attachment rather than plain text.

### 3. Retry policy
Reuse the existing `sleepBackoff` helper: 4 attempts, retry on 429 and 5xx and network errors, no retry on any other 4xx. AiSensy also returns errors with a 200 body in some cases — treat a response whose body indicates failure as a permanent error and log it verbatim (truncated) in `error_detail`.

### 4. Both channels fire on every order
After the row hits `ready`, run email and WhatsApp independently (in parallel), then apply one combined update:

- `email_sent` / `whatsapp_sent` set from their own results.
- `status = 'delivered'` and `delivered_at` set when **either** succeeded; otherwise the order stays `ready`.
- Failure details from either channel are merged into `error_detail` alongside any existing guard note.
- Neither channel can fail the order or block the other.

The order row select adds `email_sent` so the combined update never regresses a flag set by an earlier attempt.

### 5. Proof
After the secret is in place I'll generate one real order to your number and report back: the AiSensy HTTP status and response body, the resulting `status` / `email_sent` / `whatsapp_sent` values read straight from the order row, and confirmation the WhatsApp message carried the PDF document (not a text-only fallback).

## Technical notes

- Only `_shared/generate-report.ts` changes in code; the finalize webhook, order creation, prose, number guard, PDF, and font paths are untouched. The functions that embed the shared pipeline (`love-match-finalize`, `admin-retry-delivery`, free-report path) get redeployed so they pick it up.
- No schema migration needed — `whatsapp_sent`, `email_sent`, `error_detail` already exist.
- The status endpoint and success page already report `delivered = email_sent || whatsapp_sent`, so no frontend change.

## Needed from you

- The AiSensy API key (I'll request it as a secret, never in code).
- The WhatsApp number for the test send, in the form you expect AiSensy to receive it.
