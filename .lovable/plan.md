# Replace Material Symbols ligatures with lucide-react SVGs

## Goal
No icon is a text ligature anymore. Icons never read aloud to screen readers, never appear as raw words when the icon font is slow or blocked, and look identical to today.

## Approach
Add one shared `Icon` component that maps the icon names already used in the codebase (including names that arrive as data from the backend preview copy) to lucide-react components, then swap every `<span className="material-symbols-outlined">…</span>` for it and delete the font.

### 1. New `src/components/icon.tsx`
- `Icon({ name, className, size })` looks up a name → lucide component map and renders the SVG with `aria-hidden="true"` and `focusable="false"`.
- Default size 24 (matches the current font-size), `strokeWidth` tuned to read like the outlined Material set.
- Unknown name renders nothing (never a word).
- Map covers every name in use today:
  person→User, person_2→Users, favorite→Heart, menu→Menu, close→X,
  expand_more→ChevronDown, format_quote→Quote, edit_calendar→CalendarPlus,
  analytics→BarChart3, lock_open→LockOpen, lock→Lock, chat→MessageCircle,
  mail→Mail, send→Send, arrow_back→ArrowLeft, refresh→RefreshCw,
  error→AlertCircle, translate→Languages, stars→Sparkles, verified→BadgeCheck,
  history_edu→ScrollText, progress_activity→Loader2, logout→LogOut,
  dashboard→LayoutDashboard, receipt_long→ReceiptText, sell→Tag, group→Users,
  card_giftcard→Gift, payments→CreditCard, settings→Settings,
  trending_up→TrendingUp, currency_rupee→IndianRupee, schedule→Clock,
  location_on→MapPin, account_balance→Landmark, psychology→BrainCircuit,
  self_improvement→Flower2, auto_stories→BookOpen, route→Route, cake→Cake,
  insights→LineChart, handshake→Handshake, shield→Shield, diamond→Gem.

### 2. Replace usages
Every file with `material-symbols-outlined`:
`src/components/site-header.tsx`, `site-footer.tsx`, `admin/admin-sidebar.tsx`,
`src/routes/index.tsx`, `input.tsx`, `preview.tsx`, `success.tsx`, `contact.tsx`,
`privacy.tsx`, `terms.tsx`, `refund.tsx`, `_affiliate.tsx`,
`_affiliate.portal.index.tsx`, `_admin.dashboard.settings.tsx`,
`_admin.dashboard.free-report.tsx`.

- Inline `fontSize` styles become the `size` prop (16/18/20/22 px etc.); Tailwind text-size classes (`text-base`, `text-xl`, `text-5xl`) become the equivalent pixel size so nothing shifts. Color classes stay as-is (`currentColor`).
- Animation classes (`animate-spin`, `animate-pulse`) move onto the SVG.
- Data-driven names (`step.icon`, `item.icon`, `s.icon` from the backend preview copy) pass straight through `Icon`, so no backend change is needed.

### 3. Accessible names
- Mobile sticky CTA on the landing page: heart icon becomes decorative, so the accessible name is exactly "Check Compatibility".
- Icon-only controls get `aria-label`: header hamburger ("Open menu"), drawer close ("Close menu"), and any other icon-only button/link found during the sweep.

### 4. Remove the font
- Drop the Material Symbols `<link>` from `src/routes/__root.tsx` (Devanagari font links stay).
- Delete the `.material-symbols-outlined` rule from `src/styles.css`.

## Verification
- Grep confirms zero `material-symbols` references left in `src/`.
- Render the landing page, `/input`, `/preview`, `/success`, `/contact` with the icon font unavailable — no raw words anywhere.
- Confirm the sticky CTA's accessible name is "Check Compatibility" and each icon-only button exposes its label.

## Out of scope
Pricing, coupon, payment, delivery, PDF, and preview content logic. The PDF/report HTML built server-side is untouched.
