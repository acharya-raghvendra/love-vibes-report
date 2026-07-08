# Fix "Edge Function returned a non-2xx status code" on Free Report

## What's happening

The `admin-create-free-report` function does the full pipeline synchronously (Gemini prose + Browserless PDF + WhatsApp), which routinely takes 30–90 seconds. The Supabase Functions client / browser fetch cuts the request off well before that finishes, so the UI sees a non-2xx error even though the backend is still working (or has just started). Function logs only show `booted` — no thrown error — which matches "the client gave up on the response," not a code bug.

Rather than fight the client-side timeout, switch to the background-job pattern already recommended for long edge tasks.

## Plan

Use the existing `love_match_orders` row as the job record (it already has `status`, `pdf_url`, `failure_reason`, `whatsapp_sent`) — no new table needed.

1. Refactor `supabase/functions/admin-create-free-report/index.ts`:
   - Validate inputs.
   - Insert the `love_match_orders` row with `status='paid'`, `final_price=0`, `coupon_code='ADMIN_FREE'`.
   - Return `{ order_id }` immediately (200).
   - Kick off the pipeline (facts → prose cache/Gemini → Browserless PDF → storage → optional AiSensy → update row to `delivered` / `failed`) inside `EdgeRuntime.waitUntil(...)` so the client isn't waiting on it.
   - Any thrown error inside the background task writes `status='failed'` + `failure_reason` to the same row, so the UI can display it.

2. Update `src/routes/_admin.dashboard.free-report.tsx`:
   - On submit, call the function and receive `order_id`.
   - Show a "Generating…" state and poll `love_match_orders` (via the supabase client) every 2s for `status`, `pdf_url`, `whatsapp_sent`, `failure_reason`.
   - Stop polling when `status='delivered'` (show PDF link + WhatsApp status) or `status='failed'` (show the failure reason). Add a 3-minute overall cap that surfaces "Still generating — check the Orders page" if it hasn't finished by then.
   - Read access is already granted: admins can select `love_match_orders` under the existing RLS policies.

3. No changes to signature verification, paid pipeline, or `love-match-finalize`. No new tables, no config changes beyond what already exists for `admin-create-free-report`.

## Technical notes

- `EdgeRuntime.waitUntil` is available in the Supabase Edge Runtime (Deno) and lets the isolate keep running after the response is sent, up to the 150s wall-clock ceiling — enough headroom for one Gemini + one Browserless call.
- The polling read uses the existing admin session; no new RLS work required.
- Idempotency: because we insert the order row before returning, retries by the user will create separate orders (same as the paid flow). That is acceptable and keeps the code simple.
