# Force download for the email's report button

The email button currently uses the same signed URL that the success page uses. Supabase serves that URL inline, so the browser previews the PDF instead of saving it. Fix: mint a second signed URL just for the email, with the `download` option and a branded filename.

## What builds the email link

- Paid path: `supabase/functions/_shared/generate-report.ts` — signs the URL at the storage step and passes `pdfUrl` into `deliverEmail()`, which renders the button via `buildReportEmailHtml()`.
- Admin free-report path: `supabase/functions/admin-create-free-report/index.ts` — signs the URL and passes it into the same `buildReportEmailHtml()` for its Resend send.

## Changes

`supabase/functions/_shared/generate-report.ts`, right after the existing sign call:

```ts
// existing (kept as-is; feeds pdf_url + success page "View Report Online")
const { data: signed } = await supabase.storage
  .from("love-match-pdfs").createSignedUrl(path, 60 * 60 * 24 * 30);

// new: email-only URL that forces a save with a branded filename
const { data: signedDownload } = await supabase.storage
  .from("love-match-pdfs")
  .createSignedUrl(path, 60 * 60 * 24 * 30, { download: "TalkToGuruji-Love-Report.pdf" });
const emailPdfUrl = signedDownload?.signedUrl ?? pdfUrl;
```

Then `deliverEmail({ ..., pdfUrl: emailPdfUrl })` — same 30-day expiry, so the email copy and the stored copy expire together. If the download signing fails, the email falls back to the inline URL rather than sending no link.

`supabase/functions/admin-create-free-report/index.ts`: identical addition, and the Resend call uses `buildReportEmailHtml(aFirst, emailPdfUrl)`.

## Left alone

- `pdf_url` stored on the order stays the inline URL, so the success page's "View Report Online" still opens in a tab.
- `partner-generate-full` returns a URL to an API caller, not an email button — untouched.
- No change to `buildReportEmailHtml`, PDF generation, prose, status transitions, or the retry/backoff policy.
