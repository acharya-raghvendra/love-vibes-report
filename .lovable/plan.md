# Switch WhatsApp campaign to `v2_love_match_report_pdf_api`

## Change

One-line swap in `supabase/functions/_shared/generate-report.ts` (`deliverWhatsApp`):

- `campaignName: "love_match_report_pdf_api"` → `"v2_love_match_report_pdf_api"`
- Update the doc comment above the function to name the v2 campaign.

Everything else stays byte-identical: `media.url` = download-flagged signed PDF URL, `filename: "Love-Report.pdf"`, `templateParams: [firstName]`, `userName: "love.talktoguruji.com"`, phone normalization to `91XXXXXXXXXX`, 4-attempt backoff (retry 429/5xx/network only), and the either-channel delivered model.

## Redeploy

Redeploy the functions that embed the shared pipeline so they pick up the new campaign: `love-match-finalize`, `admin-retry-delivery`, `admin-create-free-report`, `love-match-generate`.

## Proof

Trigger one real generation to your number and report back:

- the AiSensy HTTP status and response body verbatim (expect `{"success":"true","submitted_message_id":...}`)
- the order row after the run: `status`, `email_sent`, `whatsapp_sent`, `error_detail`
- the exact `media.url` / `filename` sent

Whether the message renders as a document bubble vs. text is decided by the approved v2 template on AiSensy's side — I can confirm the request carried the media and that AiSensy accepted it, but you'll need to eyeball the phone to confirm the PDF file bubble. If it still lands text-only, that points at the v2 template's header type, not this code.

## Needed from you

Confirm the test number to send to (previous test used `919582722532`).
