## Root cause of coupon creation failure (found)

`public.coupon_codes.discount_type` has a CHECK constraint allowing only `'percentage'` or **`'flat'`** — but every other layer in the project uses **`'fixed'`**:
- Admin UI: `<option value="fixed">` and defaults `discount_type: "fixed"`
- `admin-upsert-coupon`: rejects anything that isn't `'percentage'` or `'fixed'`
- `create-love-match-order` + `validate-coupon`: treat `'fixed'` as the flat-rupee branch

So every insert hits `coupon_codes_discount_type_check` and PostgREST returns 400. That's the "not working" error.

Fix: replace the constraint with `CHECK (discount_type IN ('percentage','fixed'))`. Nothing else on the coupon side needs to change — `usage_count` increment, `validate-coupon`, admin CRUD, and the preview UI are already in place from the previous port.

## Port the affiliate system

Numerology's model, adapted 1:1 to Love Match:

**Role + schema**
- Add `'affiliate'` to `public.app_role` enum.
- Add `coupon_codes.affiliate_user_id uuid` (nullable FK-style to `auth.users`, no hard FK).
- Add `coupon_codes.created_by uuid` (audit).
- New RLS policy: affiliates can SELECT their own coupons (`affiliate_user_id = auth.uid()`).
- Add SELECT policy on `love_match_orders` for affiliates: rows whose `coupon_code` maps to a coupon they own. Uses a security-definer helper `is_affiliate_of_coupon(text)` to avoid a recursive RLS join.

**Admin surface**
- Extend `admin-upsert-coupon` to accept optional `affiliate_user_id`, stamp `created_by = auth.uid()`.
- Add `admin-list-affiliates` edge fn: returns `{ user_id, email }[]` for users with `affiliate` role (service-role read of `auth.users` joined to `user_roles`).
- Extend `_admin.dashboard.coupons.tsx` editor with an "Affiliate" dropdown (loaded via that fn); show affiliate email in the table.
- New admin route `_admin.dashboard.affiliates.tsx` — list affiliates, "+ Add affiliate" flow that creates a user (via existing password-reset-style admin fn OR new `admin-create-affiliate` that uses `supabaseAdmin.auth.admin.createUser` + inserts `user_roles` row). Same shape as numerology's admin-create-user.
- Sidebar entry "Affiliates".

**Affiliate portal** (three routes, pathless layout that routes affiliates in and admins out — affiliates cannot see the admin dashboard, admins can view read-only)
- `src/routes/_affiliate.tsx` — gate: `beforeLoad` checks `has_role(uid, 'affiliate')`; redirects non-affiliates to `/`. Sidebar layout with Home / My Coupons / My Sales.
- `_affiliate.portal.index.tsx` — three stat cards (My Coupons count, Total Sales, Total Revenue) computed from `coupon_codes` where `affiliate_user_id = uid` joined against `love_match_orders` with matching `coupon_code` and `status='delivered'`.
- `_affiliate.portal.coupons.tsx` — table of the affiliate's coupons with code / discount / usage / expiry / status badge; Copy Code and Copy Link (`window.location.origin/?coupon=CODE`) buttons.
- `_affiliate.portal.sales.tsx` — sales table (date, customer first name from `person_a.first`, coupon code, original price, discount, final price) with a date-range filter; summary cards (count / revenue / discount).

**Post-signin routing**
- After login on `/dashboard/login`, branch on role: admin → `/dashboard`, affiliate → `/portal`, otherwise stay/redirect home. Update the existing `_admin` gate to also permit affiliates to view — actually keep it admin-only; affiliates hit `/portal`.

**Contract preserved**
- Coupon validation and order flow already stamp `coupon_code` into `love_match_orders`; affiliate sales derive from that. No changes needed in `create-love-match-order`, `validate-coupon`, `love-match-finalize` (usage_count increment stays).

### Not in scope
- Payouts / commission tracking (numerology doesn't have it either — the portal is reporting only).
- Affiliate self-signup — admin creates affiliates.
- Language-picker on the share link (Love Match is English-only for now; a plain `?coupon=CODE` link is enough).

### Files touched

**Migration**
- Replace `coupon_codes_discount_type_check` (percentage/flat → percentage/fixed).
- `ALTER TYPE app_role ADD VALUE 'affiliate'`.
- `ALTER TABLE coupon_codes ADD COLUMN affiliate_user_id uuid, ADD COLUMN created_by uuid`.
- New RLS policies (affiliate SELECT on `coupon_codes`; affiliate SELECT on `love_match_orders` via `is_affiliate_of_coupon`).
- `is_affiliate_of_coupon(text) RETURNS boolean SECURITY DEFINER`.

**Edge functions**
- Edit `supabase/functions/admin-upsert-coupon/index.ts` — accept `affiliate_user_id`, stamp `created_by`.
- New `supabase/functions/admin-list-affiliates/index.ts`.
- New `supabase/functions/admin-create-affiliate/index.ts`.
- `supabase/config.toml` — register both new fns with `verify_jwt = true`.

**Frontend**
- Edit `src/routes/_admin.dashboard.coupons.tsx` — affiliate dropdown in editor, affiliate column in table.
- Edit `src/components/admin/admin-sidebar.tsx` — "Affiliates" nav item.
- New `src/routes/_admin.dashboard.affiliates.tsx`.
- New `src/routes/_affiliate.tsx` (layout gate + sidebar).
- New `src/routes/_affiliate.portal.index.tsx`.
- New `src/routes/_affiliate.portal.coupons.tsx`.
- New `src/routes/_affiliate.portal.sales.tsx`.
- Edit `src/routes/dashboard.login.tsx` — role-based redirect after sign-in.

Please confirm before I switch to build mode.
