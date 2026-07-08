## Add 6 Edge Function secrets to Love Match

I'll request the following secrets via `add_secret`, which opens a single secure form for you to paste values (I never see them):

1. `GEMINI_API_KEY` — same as numerology project
2. `BROWSERLESS_API_KEY` — same as numerology project
3. `RESEND_API_KEY` — same as numerology project
4. `RAZORPAY_KEY_ID` — same Razorpay account
5. `RAZORPAY_KEY_SECRET` — same Razorpay account
6. `LOVE_MATCH_PRINT_URL` — fixed value `https://love.talktoguruji.com/print-report`

### Technical detail

- Secrets 1–5 go through `add_secret` (secure form; I cannot cross-copy values from another project).
- `LOVE_MATCH_PRINT_URL` is a non-secret fixed string, so I'll use `set_secret` to write it directly with no form.
- Skipping `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (auto-injected).
- `RAZORPAY_WEBHOOK_SECRET` deferred until you create the webhook.

After you submit the form, I'll call `fetch_secrets` and confirm all six names are present.