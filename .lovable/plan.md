## Plan

Scope-limited edit to `supabase/functions/_shared/buildReportHtml.ts` + redeploy.

### Steps

1. **Edit `supabase/functions/_shared/buildReportHtml.ts`:**
   - In the `.cover .signoff` block, wrap the logo `<img>` in `<div class="logo-chip">...</div>`. Leave the `.sign` logo on the s13 page as a bare `<img>`.
   - In the `<style>` block, replace `.cover .signoff img{height:34px;object-fit:contain;opacity:.92;}` with the new `.cover .logo-chip` rule + updated `.cover .signoff img{height:44px;...;opacity:1;}`.
   - Replace `.sign img{height:30px;object-fit:contain;opacity:.9;}` with `.sign img{height:38px;object-fit:contain;opacity:1;}`.

2. **Check the transparent logo asset dimensions.** Read `src/assets/talktoguruji-logo-transparent.png.asset.json` (size 269KB — likely fine) and, if needed, fetch the CDN URL to verify pixel height ≥150px (ideally 300px). If it's smaller, flag to the user that a re-export is required (I can't re-export without a source file).

3. **Redeploy** `love-match-finalize` and `admin-create-free-report` via `supabase--deploy_edge_functions`.

4. **Report back.** Ask the user to trigger one report and verify the cover chip + page 14 sign-off render correctly.

### Not touched
Signature verification, order status transitions, Browserless POST, Resend delivery, prose prompt, cache key.
