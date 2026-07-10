# Fix Browserless 400 on branded partner-generate-full calls

## Evidence gathered (before proposing changes)

1. Ripgrep across `supabase/functions/partner-generate-full/` and `_shared/buildReportHtml.ts` for `browserless|BROWSERLESS|LOVE_MATCH_PRINT_URL|print`:
   - **Only one** Browserless fetch site in the whole function, at `partner-generate-full/index.ts:126`:
     ```
     `https://production-sfo.browserless.io/pdf?token=${browserlessKey}&timeout=60000`
     ```
   - `browserlessKey = Deno.env.get("BROWSERLESS_API_KEY")` (line 120), with a guard that returns 500 if unset (line 121–123).
   - `buildReportHtml.ts` is a pure HTML string builder — no `fetch`, no Browserless, no `LOVE_MATCH_PRINT_URL`.
   - `LOVE_MATCH_PRINT_URL` is **not referenced** anywhere in `partner-generate-full/`.
2. Runtime logs for `partner-generate-full`: only `boot`/`shutdown` entries; no `browserless`, `token`, or `[partner]` matches. Edge HTTP logs show one recent invocation and it returned **200** (id `06b7f6ad…`, 6697 ms). No 400/500 recorded for this function.

## Diagnosis

There is no second Browserless code path (no separate "branded/logo" path). The branding object only feeds `buildReportHtml`, which produces HTML — it never triggers its own fetch. So the source cannot omit `?token=` on some paths but not others.

The only ways the deployed function can send a Browserless request without a token are:
- `BROWSERLESS_API_KEY` env var is empty at invocation time → `${browserlessKey}` interpolates to empty string → URL becomes `?token=&timeout=60000` → Browserless returns exactly `querystring must have required property 'token'`. The `!browserlessKey` guard catches `undefined`/empty, but only if the secret is missing from the env at that instant.
- A stale deployment (from before the token was added) is serving requests. We already redeployed, but I want to confirm.

The 400 correlating with "branding present" is almost certainly coincidence — the tests without branding may have hit the prose cache and short-circuited before the Browserless call, while branded tests trigger fresh prose generation and reach Browserless. That would make the token/env problem *only visible* on branded calls even though the bug is env-level, not code-level.

## Plan

1. **Add pinpoint diagnostics to the single Browserless call** in `partner-generate-full/index.ts` (no logic change, no change to `love-match-finalize`):
   - Before the guard, log `browserlessKey` length only (never the value): `console.log("[partner] browserless_key_len=", browserlessKey?.length ?? 0, "has_branding=", !!body?.branding)`.
   - On the `!pdfRes.ok` branch, additionally log the constructed URL with the token masked (`token=***${last4}`) and `has_branding` so we can prove which path failed.
2. **Redeploy** `partner-generate-full`.
3. Ask the user to re-run the failing branded request and share the timestamp / order_id. Pull logs and confirm:
   - `browserless_key_len` is > 0 at invocation (rules out missing env),
   - the URL log shows `token=***xxxx` (rules out empty interpolation).
4. If `browserless_key_len=0` appears, the secret isn't reaching this function's runtime — re-add `BROWSERLESS_API_KEY` via secrets tools and redeploy.
5. If length is fine and the URL log shows the token but Browserless still 400s, the payload is the culprit (likely oversized `logo_url` data-URI blowing the query length or Content-Length) — then switch the Browserless request to send `token` in body/header per Browserless docs. Only take this step if step 3 disproves the env hypothesis.

## Non-goals

- No edits to `love-match-finalize`, `admin-create-free-report`, `buildReportHtml`, or shared prose helpers.
- No change to the single existing Browserless URL string unless step 5 is reached.
