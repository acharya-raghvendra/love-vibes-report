# Mobile Sticky CTA Hide/Reveal

## Goal
On mobile, prevent the landing page from showing two identical full-width "Check Your Compatibility" CTAs at the same time. The sticky bottom CTA should be hidden while the hero CTA is visible, and fade in only after the user scrolls past the hero button.

## Changes

1. `src/routes/index.tsx`
   - Add a React ref to the hero CTA `<Link>` (e.g. `heroCtaRef`).
   - Add a state boolean `showStickyCta` defaulting to `false`.
   - In a `useEffect`, attach an `IntersectionObserver` to `heroCtaRef.current` with `threshold: 0` and `rootMargin: "0px"` so it reports when the hero button leaves/enters the viewport.
   - The observer callback sets `showStickyCta` to `true` when the hero button is not intersecting, and `false` when it is intersecting.
   - Disconnect the observer in the cleanup function.
   - On the sticky CTA wrapper (`lg:hidden`):
     - Add `aria-hidden={!showStickyCta}`.
     - Add transition classes for opacity/transform (`transition-opacity duration-300 ease-out`).
     - Use `opacity-0 pointer-events-none` when `!showStickyCta`, otherwise `opacity-100 pointer-events-auto`.
     - Add `shadow-[0_-4px_20px_rgba(0,0,0,0.15)]` (or equivalent Tailwind shadow) on top of the existing border to make it read as a separate layer.
   - Shorten the sticky button label from `CHECK YOUR COMPATIBILITY` to `Check Compatibility`.
   - Keep the hero CTA and desktop layout unchanged.

2. Verification
   - Open the landing page on a mobile viewport.
   - Confirm the sticky CTA is not visible when the hero CTA is in view.
   - Scroll past the hero button and confirm the sticky CTA fades in.
   - Scroll back up and confirm it fades out.
   - Confirm desktop still shows the sticky CTA as before (hidden by `lg:hidden`).
