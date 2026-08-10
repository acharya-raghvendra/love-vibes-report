# Force download for the email's report button, with a personalized filename

The email button currently uses the same signed URL that the success page uses. Supabase serves that URL inline, so the browser previews the PDF instead of saving it. Fix: mint a second signed URL just for the email, with the `download` option and a filename built from both partners' first names.

## What builds the email link

- Paid path: `supabase/functions/_shared/generate-report.ts` — signs the URL at the storage step and passes `pdfUrl` into `deliverEmail()`, which renders the button via `buildReportEmailHtml()`.
- Admin free-report path: `supabase/functions/admin-create-free-report/index.ts` — signs the URL and passes it into the same `buildReportEmailHtml()` for its Resend send.

## Filename builder

New helper in `supabase/functions/_shared/generate-report.ts`, exported so the free-report path reuses it:

```ts
/** ASCII-safe filename slug for one partner's first name. */
function nameSlug(raw: unknown): string {
  const first = (typeof raw === "string" ? raw : "").trim().split(/\s+/)[0] ?? "";
  const ascii = first
    .normalize("NFKD")            // strip Latin accents (José -> Jose)
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, ""); // drops Devanagari and punctuation entirely
  return ascii.slice(0, 20) || "Partner";
}

/** e.g. "Rahul-Priya-Love-Report.pdf" */
export function reportFileName(aFirst: unknown, bFirst: unknown): string {
  const name = `${nameSlug(aFirst)}-${nameSlug(bFirst)}-Love-Report.pdf`;
  return name.length <= 60 ? name : `${name.slice(0, 56 - 4)}-Love-Report.pdf`.slice(0, 60);
}
```

Each slug is capped at 20 chars, so the worst case is `20 + 1 + 20 + 16 = 57` chars — already under the 60 cap; the final guard is belt-and-braces.

Example for `"Rahul"` + `"प्रिया"`: Devanagari has no ASCII equivalent after normalization, so slot B falls back:

```text
Rahul-Partner-Love-Report.pdf
```

No raw Unicode ever reaches `Content-Disposition`, so no RFC 5987 encoding is needed.

## Changes

`supabase/functions/_shared/generate-report.ts`, right after the existing sign call:

```ts
// existing (kept as-is; feeds pdf_url + success page "View Report Online")
const { data: signed } = await supabase.storage
  .from("love-match-pdfs").createSignedUrl(path, 60 * 60 * 24 * 30);

// new: email-only URL that forces a save with a personalized filename
const { data: signedDownload } = await supabase.storage
  .from("love-match-pdfs")
  .createSignedUrl(path, 60 * 60 * 24 * 30, {
    download: reportFileName(a?.first, b?.first),
  });
const emailPdfUrl = signedDownload?.signedUrl ?? pdfUrl;
```

Then `deliverEmail({ ..., pdfUrl: emailPdfUrl })` — same 30-day expiry, so the email copy and the stored copy expire together. If the download signing fails, the email falls back to the inline URL rather than sending no link.

`supabase/functions/admin-create-free-report/index.ts`: identical addition using `reportFileName(aFirst, bFirst)`, and the Resend call uses `buildReportEmailHtml(aFirst, emailPdfUrl)`.

## Left alone

- `pdf_url` stored on the order stays the inline URL, so the success page's "View Report Online" still opens in a tab.
- `partner-generate-full` returns a URL to an API caller, not an email button — untouched.
- No change to `buildReportEmailHtml`, PDF generation, prose, status transitions, or the retry/backoff policy.
