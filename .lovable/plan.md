# Correct and reseed Indic font weights

## Implementation
- Recreate a temporary admin-only server endpoint for the one-off font seed.
- Request each family and weight separately from Google Fonts (`400` and `600` get distinct CSS requests).
- Parse every `@font-face` block in each response, collect its WOFF2 URLs, download all candidates, and select the largest file for that family/weight.
- Reject any selected file below 5,000 bytes and reject the run if a family's 400 and 600 files are byte-identical.
- Upload the corrected eight files to the existing private `report-fonts` storage bucket using the exact existing filenames, `font/woff2`, and overwrite enabled.

## Verification and cleanup
- Run the endpoint once with admin authentication.
- Report all eight exact byte sizes and confirm each family's 400 and 600 files differ.
- Delete the temporary endpoint immediately after the successful run. No permanent seeder or new deployed function will remain.

## Scope
- Do not modify the existing Devanagari files, the Indic font loader, or any report-generation caller.
