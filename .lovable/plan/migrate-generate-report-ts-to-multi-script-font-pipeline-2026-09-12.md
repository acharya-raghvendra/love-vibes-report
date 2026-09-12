# Migrate generate-report.ts to multi-script font pipeline

## Goal
Update `supabase/functions/_shared/generate-report.ts` so it uses the new `_shared/fonts/indic.ts` module instead of the legacy `_shared/fonts/devanagari.ts` module, enabling font loading and render verification for all supported scripts (Latin, Devanagari, Tamil, Telugu, Kannada, Malayalam).

## Changes

### 1. Replace imports
Remove:
```ts
import {
  assertDevanagariRendered,
  describeProbe,
  loadDevanagariFontFaceCss,
} from "./fonts/devanagari.ts";
```

Add:
```ts
import {
  assertScriptRendered,
  describeFontProbe,
  loadFontFaceCss,
} from "./fonts/indic.ts";
import { scriptFor } from "./reportStrings.ts";
import type { ScriptKey } from "./fonts/indic.ts";
```

### 2. Replace font loading inside `runGeneration`
Before the existing `try`/`catch` that loads font CSS, compute the script key from the order/report language:
```ts
const script = scriptFor(language) as ScriptKey;
```

Then replace:
```ts
fontFaceCss = await loadDevanagariFontFaceCss(supabase);
```
with:
```ts
fontFaceCss = await loadFontFaceCss(supabase, script);
```

Leave the `catch` body and the `buildReportHtml(pdfFacts, sections, { fontFaceCss })` line unchanged.

### 3. Replace the render probe
Replace the Devanagari-only probe block:
```ts
if (language === "hi") {
  const probe = await assertDevanagariRendered(html, browserlessKey);
  console.log(`[generate] order=${orderId} devanagari_probe ${describeProbe(probe)}`);
  if (!probe.ok) {
    return await fail(
      "pdf_font_missing",
      `type=pdf_error stage=font_verify ${describeProbe(probe)}`.slice(0, 600),
    );
  }
}
```

with the script-aware probe:
```ts
if (script !== "latin") {
  const probe = await assertScriptRendered(html, browserlessKey, script);
  console.log(`[generate] order=${orderId} font_probe ${describeFontProbe(probe)}`);
  if (!probe.ok) {
    return await fail(
      "pdf_font_missing",
      `type=pdf_error stage=font_verify ${describeFontProbe(probe)}`.slice(0, 600),
    );
  }
}
```

## Verification
- Run `deno check supabase/functions/_shared/generate-report.ts` and confirm no type errors.

## Non-goals / Must not change
- Do not modify `supabase/functions/_shared/fonts/devanagari.ts`.
- Do not modify any other file.
- Do not change callers (`love-match-finalize`, `admin-create-free-report`, `partner-generate-full`).
