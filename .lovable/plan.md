## Scope

Replace the placeholder home route (`src/routes/index.tsx`) with a pixel-faithful build of the provided landing HTML: a mobile-first, dark mystical landing page for the Love Match numerology report. CTA buttons are stubs (no navigation yet) — you'll send the next-screen prompt after this lands.

Backend, edge functions, migrations, and Razorpay wiring are untouched.

## What gets built

Single-page landing (`/`) with these sections, in order:
1. Fixed nebula background glows (top-right tertiary, bottom-left primary blobs)
2. Hero: headline "Discover if Your Souls are Aligned by the Numbers" (with gold-gradient on "Numbers"), subcopy, primary CTA "CHECK YOUR COMPATIBILITY"
3. Social proof: 3 overlapping avatars + "+50k" chip, 5 gold stars, "Trusted by 50,000+ Seekers"
4. "The Path to Clarity" 3-step timeline with glass icon bubbles and a vertical gold gradient connector line
5. Blurred sample-preview card (glassmorphism) with "Unlock Now" overlay
6. Two testimonials in glass cards with big translucent quote glyph
7. FAQ (4 items) using native `<details>` with chevron rotate on open
8. Sticky bottom CTA bar (backdrop-blurred) with heart icon + "CHECK YOUR COMPATIBILITY"

All hero images (avatars, testimonial portraits, seeker silhouettes) are hotlinked from the provided `lh3.googleusercontent.com/aida-public/...` URLs. Material Symbols Outlined icons load via a `<link>` in `__root.tsx` head.

## Design system

Dark theme locked on (add `dark` class to `<html>` via root route). Custom mystical palette added as CSS variables in `src/styles.css` and exposed via `@theme inline` so Tailwind utilities like `bg-primary`, `text-on-surface`, `bg-tertiary`, `bg-primary-container`, `text-on-surface-variant`, `bg-surface-container`, `border-outline-variant` all work.

Palette (oklch):
- `background`: near-black midnight `oklch(0.14 0.03 285)`
- `on-background` / `on-surface`: soft warm white `oklch(0.96 0.01 90)`
- `on-surface-variant`: muted lilac-gray `oklch(0.72 0.02 285)`
- `primary`: rich gold `oklch(0.78 0.14 85)` (~#D4AF37)
- `primary-container`: deeper amber `oklch(0.62 0.14 70)`
- `on-primary-fixed`: near-black `oklch(0.12 0.02 285)`
- `tertiary`: deep violet `oklch(0.35 0.12 300)` (nebula glow)
- `surface-container`: `oklch(0.20 0.03 285)`
- `surface-variant`: `oklch(0.28 0.03 285)`
- `outline-variant`: `oklch(0.45 0.02 285)`

Typography: **Cormorant Garamond** for display/headline (mystical serif), **Inter** for body/labels. Loaded via `@fontsource/cormorant-garamond` + `@fontsource/inter`, imported in `src/router.tsx` (client-safe entry). Mapped in `@theme inline` as `--font-display` / `--font-body` plus utility classes for the semantic tokens the HTML uses (`font-display-lg-mobile`, `text-display-lg-mobile`, `font-headline-sm`, `text-headline-sm`, `font-body-lg`, `text-body-lg`, `font-body-md`, `text-body-md`, `font-label-md`, `text-label-md`, `text-label-sm`).

Custom utilities added to `styles.css`:
- `.glass-card` → `background: color-mix(in oklab, var(--surface-container) 55%, transparent); backdrop-filter: blur(18px);`
- `.nebula-glow` → `filter: blur(120px); opacity: 0.35;` with a slow `@keyframes` drift
- `.text-gold-gradient` → linear-gradient text clip from `--primary-container` to `--primary`
- `.px-margin-mobile` → `padding-inline: 1.25rem`
- `.max-w-container-max` → `max-width: 32rem`

Subtle motion: nebula blobs slowly drift (20s ease-in-out infinite alternate), CTA has hover scale (already in HTML classes), stars have a gentle pulse-in on load, FAQ chevron rotates on open (native `details[open]`).

## Files touched

- `src/styles.css` — add palette tokens (light + dark, but page forces dark), typography scale utilities, `.glass-card`, `.nebula-glow`, `.text-gold-gradient`, spacing utilities, keyframes.
- `src/routes/__root.tsx` — set app-specific `<title>` + meta (title: "Love Match — Numerology Compatibility Report"; description referencing soul alignment); add `<link>` for Material Symbols Outlined stylesheet; ensure `<html class="dark">`.
- `src/router.tsx` — `import '@fontsource/cormorant-garamond/400.css'`, `/600.css`, `/700.css`, `import '@fontsource/inter/400.css'`, `/500.css`, `/600.css`.
- `src/routes/index.tsx` — replace placeholder with the full landing composition (hero, social proof, path, preview, testimonials, FAQ, sticky CTA). CTA `<button>`s are stubs (no `onClick`, no navigation). Convert HTML `data-alt` background-image divs into `<img>` where semantic, keep as decorative `background-image` divs otherwise. Native `<details>` for FAQ.
- `package.json` / `bun.lock` — add `@fontsource/cormorant-garamond`, `@fontsource/inter`.

No other files, no route additions, no edge-function changes, no migration changes.

## Technical notes

- All images hotlinked from `lh3.googleusercontent.com/aida-public/...` per the user's instruction. No local asset uploads.
- Icons use Google Material Symbols Outlined via CDN stylesheet in `__root.tsx` head; each icon is a `<span class="material-symbols-outlined">name</span>`.
- Mobile-first only — this is the design as given. Container capped at ~32rem and centered on wider viewports so it still looks intentional on desktop.
- SEO: proper `<h1>` (one), semantic `<section>` + `<h2>`, meta description, og/twitter cards on `__root`. No og:image (leaf-only; skipping since no cover art yet).
- No new dependencies beyond the two fontsource packages.

```text
Layout wireframe (mobile)
┌───────────────────────────────┐
│  ✦ nebula glow (bg)           │
│                               │
│  ★ Hero headline (serif)      │
│  Subcopy                      │
│  [ CHECK COMPATIBILITY ]      │
│                               │
│  ◉◉◉ +50k    ★★★★★           │
│  Trusted by 50,000+           │
│                               │
│  The Path to Clarity          │
│  │  ●  1. Enter Details       │
│  │  ●  2. Get Score           │
│  │  ●  3. Unlock Full Report  │
│                               │
│  ┌─ glass preview ─┐          │
│  │ 88% (blurred)   │          │
│  │  Unlock Now     │          │
│  └─────────────────┘          │
│                               │
│  Whispers of Truth            │
│  ❝ testimonial ❞              │
│  ❝ testimonial ❞              │
│                               │
│  Common Inquiries             │
│  ▸ How accurate…              │
│  ▸ What do I need…            │
│  ▸ Is it private…             │
│  ▸ Refund…                    │
│                               │
├───────────────────────────────┤
│ [ ♥ CHECK COMPATIBILITY ]     │ ← sticky
└───────────────────────────────┘
```

## Out of scope (this turn)

- Input form screen, score/preview screen, success screen — you'll prompt next.
- Wiring landing CTAs to any route or edge function.
- Header/nav and full footer (HTML shows placeholders only; leaving minimal).
