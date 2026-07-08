## Plan

### 1. Create admin user + seed role (new)
- Add a one-off server function `src/lib/admin-seed.functions.ts` (or inline SQL via the insert tool) to:
  - Create auth user `info@talktoguruji.com` via Auth Admin API with a temporary password (email pre-confirmed).
  - Insert `('<new user id>', 'admin')` into `public.user_roles`.
- Show the temporary password once in the response so you can sign in at `/dashboard/login` and change it.
- This runs BEFORE disabling public sign-ups so we don't lock ourselves out.

Alternative if you'd rather skip an admin-API call: I run only the `user_roles` INSERT and you set the password by triggering "Forgot password" on `/dashboard/login`. Tell me which you prefer.

### 2. Replace `create-love-match-order` edge function
- Overwrite `supabase/functions/create-love-match-order/index.ts` verbatim with the attached file (164 lines). No logic changes.
- Confirm `verify_jwt = false` in `supabase/config.toml` for this function.

### 3. Confirm `/dashboard/login` is login-only
- Read `src/routes/dashboard.login.tsx` and confirm no signup UI. Leave untouched.

### 4. Disable public sign-ups
- Call `supabase--configure_auth` with `disable_signup: true` (keep other settings as-is).

### 5. Verify
- Confirm admin can sign in at `/dashboard/login` and reach `/dashboard`.
- Confirm sign-ups are disabled (new signup attempts rejected).

No engine/payment logic changes. No client price changes. No migration changes.
