# Seed Indic report fonts

## Implementation
- Create only `supabase/functions/seed-indic-fonts/index.ts`.
- Require the existing `requireAdmin` check before any download or upload, so anonymous and non-admin callers receive 401/403.
- For Tamil, Telugu, Kannada, and Malayalam, request Google Fonts CSS with a desktop Chrome user agent, select the WOFF2 source for weights 400 and 600, download each font, and reject any payload smaller than 5,000 bytes.
- Upload all eight files to the existing private `report-fonts` bucket with the exact requested filenames, `font/woff2`, and `upsert: true`. Do not reference or overwrite either Devanagari filename.
- Return and log a JSON result listing each uploaded filename and byte size; fail the request immediately with a clear family/weight error if CSS parsing, download, validation, or upload fails.

## Run and verification
- Check the new function, deploy it, invoke it once with an authenticated admin session, and capture its exact response.
- Confirm the eight uploaded objects and their sizes, then show the invocation output.

## Scope
- No existing source file will be modified. Deployment and the one-time storage uploads are runtime actions, not repository file changes.
