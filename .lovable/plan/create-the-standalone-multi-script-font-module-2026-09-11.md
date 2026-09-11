Create the standalone multi-script font module

- Create `supabase/functions/_shared/fonts/indic.ts` with the exact contents of the uploaded `indic.ts` file.
- Leave `supabase/functions/_shared/fonts/devanagari.ts` and every other file untouched.
- Do not import or wire `indic.ts` into any caller; it ships as a standalone export only.
- Verify with `deno check supabase/functions/_shared/fonts/indic.ts`.

Technical note: the new module exports `ScriptKey`, `familyFor`, `lineHeightFor`, `loadFontFaceCss`, `assertScriptRendered`, `describeFontProbe`, and a `FontProbe` interface. It generalises the existing Devanagari-only pipeline to Tamil, Telugu, Kannada, and Malayalam while keeping Latin as a no-op pass-through.