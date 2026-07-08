## Plan: Create private storage bucket `love-match-pdfs`

Create a new Supabase Storage bucket used by the `love-match-finalize` edge function to store generated PDFs and issue 30-day signed URLs.

### Configuration
- **Name:** `love-match-pdfs`
- **Public:** `false` (private)
- **Allowed MIME types:** `application/pdf`
- **File size limit:** 25 MB (reasonable default for match report PDFs)

### Storage RLS policies
Since the bucket is private and PDFs are uploaded by the edge function (service role) and delivered via signed URLs, no `anon`/`authenticated` policies are required. Service role bypasses RLS, and signed URLs don't require policies. No storage policies will be added.

### Implementation
- Use `supabase--storage_create_bucket` with `public=false`, mime type restricted to `application/pdf`, size limit 25 MB.

### Out of scope
- No edge function code changes (finalize already uses this bucket name).
- No table/schema changes.
