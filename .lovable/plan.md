## Plan: Admin password change

Add a "Settings" area in the admin dashboard where the signed-in admin can change their own password.

### New route
- `src/routes/_admin.dashboard.settings.tsx` → `/dashboard/settings`
  - Uses existing admin layout (gated by `_admin.tsx`, so already admin-only).
  - Simple card with three fields:
    - Current password
    - New password (min 8 chars)
    - Confirm new password
  - Submit calls Supabase client-side:
    1. `supabase.auth.signInWithPassword({ email: currentUser.email, password: current })` — verifies current password. On failure, show "Current password is incorrect."
    2. `supabase.auth.updateUser({ password: newPassword })` — updates it.
    3. Toast success (sonner, already used in project) and clear the form.
  - Show inline validation errors (mismatch, min length).
  - Show/hide password toggle on each field.

### Sidebar
- Add a "Settings" nav item (`settings` icon) in `src/components/admin/admin-sidebar.tsx` pointing to `/dashboard/settings`.

### Out of scope
- No admin-editing-other-users' passwords (that would need a service-role edge function). This is self-serve only, which matches the request "change *my* password".
- No email/2FA changes.
- No password strength meter beyond a min-length check.
