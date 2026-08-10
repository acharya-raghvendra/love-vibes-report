# Fix: name validation errors are invisible on /input

## Diagnosis (verified in a live browser run)

The error paragraph **is** rendered and **is** wired to state. Typing `Rahul123` and blurring produces a `[role="alert"]` element containing "Please enter the name in English." — so `validateName` fires on change/blur/submit and the conditional render works.

The real problem is styling: the error uses `text-error` and `border-error`, but the design system in `src/styles.css` defines no `--color-error` token. Tailwind v4 therefore generates **no rule at all** for those classes. Measured computed style of the rendered error: `color: oklch(0.96 0.01 90)` (near-white, same as body text), `font-size: 11px`, and the input keeps its normal grey underline. The message is on screen but visually indistinguishable from a caption — it reads as "nothing happened". The same issue affects the email field's error styling.

Two secondary gaps that also cause silent failures on submit:
- `onSubmit` returns without any message when a date of birth is empty or the phone has fewer than 10 digits.
- Nothing scrolls to or focuses the first invalid field, so on a two-column layout the error can be off-screen.

## Fix

1. Add error color tokens to `src/styles.css` (`--error` / `--on-error` values in the existing palette block, mapped to `--color-error` in the `@theme` block) so `text-error`, `border-error`, and `ring-error` resolve to a red that fits the dark gold theme. This alone makes both name errors and the email error visibly red.
2. Bump the error text to a slightly larger label size and add a small warning icon so it reads as an error, matching across name and email fields.
3. Add refs to the two name inputs, the two DOB inputs, the phone input, and the email input; on failed submit, focus and `scrollIntoView({ behavior: 'smooth', block: 'center' })` the first invalid field.
4. Add inline error state + messages for the currently silent cases: missing date of birth ("Please select a date of birth.") and short phone ("Enter a 10-digit WhatsApp number."), styled identically.
5. Keep validation timing as-is (change, blur, submit) and keep the regex, `nameSlug`/`reportFileName`, and all server-side logic untouched.

## Technical notes

- Files touched: `src/routes/input.tsx`, `src/styles.css`.
- No backend, edge function, or migration changes.
- Verification: re-run the headless browser check — enter `Rahul123`, blur, and assert the `#p1-name-error` alert exists **and** its computed color is the new red; then submit with an invalid name and assert the name input receives focus.
