# Add Google Analytics tag to site header

## Goal
Install the provided Google Analytics 4 tag (`G-CQRS85E6F5`) in the site `<head>` so it loads on every route.

## Current state
- `src/routes/__root.tsx` renders `<HeadContent />` and injects the Meta Pixel base script inside `<head>`.
- The snippet is a good place to add the GA tag right after it, keeping all third-party scripts together.

## Plan
1. Open `src/routes/__root.tsx`.
2. Insert the exact Google tag snippet immediately after the existing Meta Pixel `<script>` in `RootShell`:
   - `https://www.googletagmanager.com/gtag/js?id=G-CQRS85E6F5` async script
   - Inline config script with `window.dataLayer`, `gtag('js', new Date())`, and `gtag('config', 'G-CQRS85E6F5')`
3. Verify the file still type-checks and builds.

## Out of scope
- SPA route-change page_view events (can be added later if needed).
- Connector-based env var wiring; use the literal measurement ID provided by the user.
