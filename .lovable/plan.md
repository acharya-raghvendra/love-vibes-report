## Scope

Add a shared Header + Footer, and make the landing page (`/`) fully responsive with a distinct desktop layout at ≥1024px while keeping the mobile layout exactly as-is below 1024px. Same visual system (dark purple midnight + gold). Input / Preview / Success pages get the same treatment when their prompts arrive.

## Breakpoint contract

- Single breakpoint: `lg` (1024px).
- Mobile (`< 1024px`): existing single-column landing, unchanged.
- Desktop (`≥ 1024px`): distinct multi-column layouts, container capped at 1200px centered.
- No intermediate `md` breakpoint tweaks — clean binary switch.

## New shared components

### `src/components/site-header.tsx`
- Fixed to top, backdrop-blurred, `bg-background/70`, gold-tinted bottom border.
- Mobile (`< lg`): logo left ("✦ Love Match" — gold gradient wordmark in Cormorant Garamond), hamburger button right. Hamburger opens a slide-in drawer from the right (`fixed inset-y-0 right-0 w-80`, glass-card background, close X in header), containing the three nav links stacked + full-width gold "Check Compatibility" CTA. Backdrop overlay closes on click. State via `useState`; close on `Escape` and on link click.
- Desktop (`≥ lg`): logo left, three nav links center (Home, How It Works, FAQ — all `<a href="#anchor">` on landing; when we add real routes later they become `<Link>`s), gold CTA button right ("Check Compatibility"). Row uses `max-w-[1200px] mx-auto px-6`, height ~72px.
- Nav link hover: text-primary + subtle underline via `border-b` animation.
- The landing page's `<section>`s get anchor ids: `#how-it-works`, `#faq`, plus `#hero` for the logo-click home target.

### `src/components/site-footer.tsx`
- Sits above the sticky mobile CTA (add `pb-24 lg:pb-0` on `<main>` wrapper so footer isn't covered on mobile). On desktop the mobile sticky CTA is hidden, so the footer sits flush.
- Content grid:
  - **Brand column**: gold-gradient wordmark + tagline ("Ancient numerology, decoded for modern seekers.").
  - **Quick links column**: Home, Privacy Policy, Terms, Refund Policy, Contact. Placeholder `href="#"` for the legal ones until routes exist.
  - **Support column**: two payment trust chips — a "Razorpay" pill and a "UPI" pill (styled as glass-card small badges with the currency/lock icons from Material Symbols, no logos hotlinked to avoid trademark issues), plus a WhatsApp support link with `whatsapp` icon → `https://wa.me/` placeholder (`#` for now with `data-href` we can wire later).
- Desktop: 3 columns (`grid-cols-3 gap-12`), container `max-w-[1200px]`, generous vertical padding.
- Mobile: single column stack, left-aligned, `space-y-8`.
- Bottom line (both): thin gold-tinted divider then `© 2026 Inno-One Service LLP` centered, small text-on-surface-variant.

### `src/components/mobile-nav-drawer.tsx`
- Small dedicated component for the drawer body to keep header tidy. Exports `MobileNavDrawer({ open, onClose })`.

## Landing page responsive changes (`src/routes/index.tsx`)

Existing mobile markup is preserved. Desktop overrides are added via `lg:` utilities — never by duplicating markup. Root wrapper gets `pt-[72px]` (header offset) instead of `pt-24`, and `pb-24 lg:pb-16` (space for mobile sticky CTA only).

Container width: outer container becomes `max-w-container-max lg:max-w-[1200px] lg:px-6`.

1. **Hero (2-column on desktop)**
   - Wrapper becomes `lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:text-left lg:mb-24`.
   - Left column: headline (larger on desktop — add `lg:text-[3.75rem]` via `lg:text-display-lg` utility), subcopy, CTA. CTA width changes: `w-full lg:w-auto lg:px-10`.
   - Right column (new, `lg:block hidden`): decorative score dial — a circular gold-outlined ring with "88%" and "Compatibility" label centered, wrapped by a subtle glass-card with two blurred seeker avatars flanking it (reuse SEEKER_1 / SEEKER_2 URLs already in the file). Purely visual — matches the "preview" aesthetic without duplicating that section verbatim. Rendered as `<div>` with `aria-hidden="true"`.

2. **Social proof**: unchanged; on desktop just center within the wider container.

3. **How-It-Works (3 cards on desktop)**
   - Wrapper: `lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0`.
   - Vertical gradient connector: `lg:hidden` (it's a mobile-only motif). Desktop shows three glass cards side by side; each step becomes a full glass-card (`lg:glass-card lg:rounded-2xl lg:p-6 lg:border lg:border-outline-variant/30 lg:flex-col`) with the icon bubble on top instead of left.
   - Section gets `id="how-it-works"` for the header anchor.

4. **Preview** section
   - Landing keeps the blurred sample-preview card; on desktop cap it at `lg:max-w-[720px] lg:mx-auto` so it doesn't stretch across 1200px.
   - Nothing else changes — this section IS the preview page equivalent inside the landing.

5. **Testimonials (2-up on desktop)**
   - `space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8`.

6. **FAQ**
   - Section gets `id="faq"`. Mobile stack unchanged. Desktop caps the accordion at `lg:max-w-[820px] lg:mx-auto` for readability (a wide accordion looks bad).

7. **Sticky bottom CTA**
   - Add `lg:hidden` — hidden entirely on desktop, since desktop has the header CTA and the hero CTA.

## Theme additions (`src/styles.css`)

- Add a utility for a subtle underline effect on desktop nav links (`.nav-link` — 1px bottom border transitioning from transparent to `--primary` on hover).
- Add `text-display-lg` (~3.75rem) that we're already referencing for the hero on desktop.
- Add a very light `--color-primary/*` utility variant is unnecessary — Tailwind's `bg-primary/20` etc. already handle opacity.

## `__root.tsx`

- Wrap `<Outlet />` in a fragment with `<SiteHeader />` above and `<SiteFooter />` below, so every route inherits chrome. Keep them outside the QueryClientProvider is not needed — leave them inside so future auth/state can use hooks freely.

## Files touched

- `src/components/site-header.tsx` (new)
- `src/components/site-footer.tsx` (new)
- `src/components/mobile-nav-drawer.tsx` (new)
- `src/routes/__root.tsx` (mount header + footer inside `RootComponent`)
- `src/routes/index.tsx` (add `id` anchors, `lg:` desktop overrides, hide sticky CTA on desktop, hero desktop right column)
- `src/styles.css` (add `.nav-link` utility + `text-display-lg` scale)

No route additions this turn (nav links use `#` anchors on landing and `#` placeholders for legal pages until routes exist). No new dependencies.

## Technical notes

- Header height 72px on desktop, 64px on mobile — pages compensate via `pt-16 lg:pt-[72px]` on the top wrapper.
- Drawer uses fixed positioning + Tailwind transitions (`translate-x-full` → `translate-x-0`), no headless-ui/radix dependency.
- Accessibility: hamburger button `aria-label="Open menu"`, drawer has `role="dialog" aria-modal="true"`, `Escape` closes, focus not trapped (single-page nav, low risk — noted for future hardening).
- SEO: header nav uses semantic `<nav aria-label="Primary">`, footer uses `<footer>` with `<nav aria-label="Footer">`, headings unchanged.

```text
Desktop layout (≥1024px)                Mobile (<1024px)
┌────────────────────────────────────┐   ┌──────────────┐
│ ✦ Love Match  Home HowIt FAQ [CTA] │   │ ✦   ☰        │  ← header
├────────────────────────────────────┤   ├──────────────┤
│                                    │   │ (existing    │
│ Headline …    │   ◯ 88%             │   │  mobile      │
│ Sub + CTA     │   Compat ring       │   │  landing     │
├───────────────┴────────────────────┤   │  unchanged)  │
│  ★★★★★  Trusted by 50,000+          │   │              │
│  ┌───┐  ┌───┐  ┌───┐                │   │              │
│  │ 1 │  │ 2 │  │ 3 │  ← 3-up cards │   │              │
│  └───┘  └───┘  └───┘                │   │              │
│  (preview card, capped 720)         │   │              │
│  ┌────┐  ┌────┐  ← 2-up testis      │   │              │
│  FAQ (capped 820)                   │   │              │
├────────────────────────────────────┤   │[Sticky CTA]  │
│ Brand │ Quick links │ Support       │   ├──────────────┤
│ © 2026 Inno-One Service LLP         │   │ Footer stack │
└────────────────────────────────────┘   └──────────────┘
```

## Out of scope

- Building /input, /preview, /success — you'll prompt next; same responsive rules will apply.
- Wiring nav CTAs / legal-page routes.
- Localization, dark/light toggle (site is dark-only).
