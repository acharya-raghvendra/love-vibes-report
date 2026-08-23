# Add CO-BRAND block to the PDF cover

## Goal
Update the partner PDF pipeline so the gateway can optionally send a co-brand treatment on the cover: the existing partner logo stays unchanged, and below it a "POWERED BY" line plus the TalkToGuruji logo appears when `branding.cobrand === true` and a `branding.ttg_logo_url` is supplied.

## Changes

### 1. `supabase/functions/partner-generate-full/index.ts`
- Read `branding.cobrand` and `branding.ttg_logo_url` alongside the existing `logo_url`, `footer_text`, and `company_name`.
- Pass them through to `buildReportHtml` as `cobrand` and `ttgLogoUrl`.

### 2. `supabase/functions/_shared/buildReportHtml.ts`
- Add `cobrand?: boolean` and `ttgLogoUrl?: string` as optional parameters in the `opts` object.
- Default both to safe values (`false` / `undefined`) so existing callers (`admin-create-free-report`, `generate-report.ts`) produce byte-identical HTML.
- In the cover block (~lines 164-178), when `cobrand === true` and `ttgLogoUrl` is present, insert below the existing `logo-chip`:
  - existing partner logo (unchanged size and position)
  - a centered "POWERED BY" line — muted grey, uppercase, modest size
  - the TalkToGuruji logo at roughly 45-55% of the partner logo's width
- When `cobrand` is absent or false, emit the exact same cover HTML as today.

## Non-goals / Must not change
- Closing sign-off, running footer, disclaimer page, and `show_upsell` behaviour remain untouched.
- Partner logo's own size and placement remain untouched.
- No changes to `admin-create-free-report`, `generate-report.ts`, or any other caller.

## Verification
- Typecheck the project.
- Diff the two files before and after; confirm the only cover markup change is the conditional co-brand block.
- Confirm existing callers still typecheck without modification.

## Diff-first workflow
Before applying the edits, I will show the exact diff for your approval.