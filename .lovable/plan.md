# Wire up the email download link (currently missing)

The email button today points at the same inline view URL used by the success page, so browsers render the PDF instead of downloading it. Fix: mint a second, download-flagged link used only by the email.

## Changes

### 1. `supabase/functions/_shared/generate-report.ts`
- Add two helpers:
  - `nameSlug(raw)` — trim, first word only, NFKD-strip accents, keep `A-Za-z0-9`, cap 20 chars, fallback `"Partner"`.
  - `reportFileName(a, b)` — `${nameSlug(a)}-${nameSlug(b)}-Love-Report.pdf`.
- After the existing inline `createSignedUrl(path, 30d)` (line ~434), add a second call:
  `createSignedUrl(path, 30d, { download: reportFileName(a?.first, b?.first) })`.
- Keep storing the inline URL in `pdf_url` (success page unchanged).
- Pass the new URL to `deliverEmail` as `emailPdfUrl`; rename the `deliverEmail` arg to `emailPdfUrl` and use it for the button href in `buildReportEmailHtml`.
- Fallback rule: only if the download-flagged sign call fails does the email fall back to the inline URL (logged in `error_detail`, non-fatal).

### 2. `supabase/functions/admin-create-free-report/index.ts`
- Same second signed URL (line ~255) and pass it into `buildReportEmailHtml` (line ~274) instead of the inline `pdfUrl`.

### 3. Verification
- After deploy, generate one order and paste the actual email URL showing `&download=Rahul-Priya-Love-Report.pdf`, plus the rendered button href.

## Untouched
Signature verification, status transitions, prose/PDF generation, success-page link, Latin-name validation.

## Example
`"Rahul"` + `"प्रिया"` → `Rahul-Partner-Love-Report.pdf`
