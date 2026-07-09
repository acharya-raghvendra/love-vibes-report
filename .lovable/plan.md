## Problem

`prosePrompt.ts` correctly forces Gemini to return every value in Hinglish/Devanagari when `language==="hi"`, but `supabase/functions/_shared/buildReportHtml.ts` still renders the report **chrome** (section titles, eyebrows, footer, list headers, cover strapline, core-number labels) as hardcoded English. So a Hindi order comes back with Hindi *body copy* wrapped in English *headings* — exactly the regression the user is seeing.

The prose is fine. The template shell is not language-aware.

## Fix — one file: `supabase/functions/_shared/buildReportHtml.ts`

All edits are presentation-only. No changes to signature verification, order status, Browserless POST, Resend delivery, `prosePrompt.ts`, or the cache key.

### 1. Replace the single `SECTION_TITLES` map with a bilingual pair

```ts
const SECTION_TITLES_EN: Record<string,string> = { /* current map */ };
const SECTION_TITLES_HI: Record<string,string> = {
  s1: "आप दोनों कितने compatible हैं",
  s2: "आपके core numbers",
  s3: "Life Path: आप दोनों ज़िंदगी कैसे जीते हैं",
  s4: "Soul Urge: आप दोनों प्यार कैसे करते हैं",
  s5: "Chemistry और attraction",
  s6: "नज़दीकी और intimacy",
  s7: "Personality: आप बाहर से कैसे दिखते हैं",
  s8: "टकराव और repair",
  s9: "Maturity: वक़्त के साथ आप कैसे बदलते हैं",
  s10: "अभी का वक़्त",
  s11: "एक नज़र में: strengths और ध्यान रखने वाली बातें",
  s12: "आप क्या कर सकते हैं",
  s13: "एक honest बात",
};
```

### 2. Thread `hi` through the small helpers that emit chrome

Change signatures (module-scope, still pure):
- `eyebrow(n, hi)` → `Section 03` becomes `सेक्शन 03` when `hi`.
- `head(id, hi)` → picks HI or EN title map.
- `frun(pg, hi)` → footer text `TalkToGuruji • Love Match Report` becomes `TalkToGuruji • लव मैच रिपोर्ट`.
- `numRows(c, hi)` → `Life Path / Destiny / Soul Urge / Personality` become `लाइफ़ पाथ / डेस्टिनी / सोल अर्ज / पर्सनैलिटी`.
- `analyticalPage(...)` gains an `hi` param and forwards to `head` + `frun`.

`ringSvg`, `pairStrip`, `relationDot`, `ringColor`, `blocks`, `cards2` need no change — they emit no English text.

### 3. Localize the inline strings inside `buildReportHtml`

Replace the hardcoded English fragments (all currently on lines 122–186) with `hi ? "…" : "…"` ternaries, keeping identical HTML structure:

| Location | English (current) | Hindi |
|---|---|---|
| Cover eyebrow | `Compatibility Analysis` | `कम्पैटिबिलिटी analysis` |
| Cover h1 | `Love Match Report` | `लव मैच रिपोर्ट` |
| Cover pill | `Honest, not just flattering.` | `Honest, सिर्फ़ तारीफ़ नहीं.` |
| s1 label | `What the score means.` | `Score का मतलब.` |
| s11 col A | `Your strengths` | `आपकी strengths` |
| s11 col B | `What to watch` | `ध्यान रखने वाली बातें` |
| s11 overall | `Overall.` | `कुल मिलाकर.` |

Update the `buildReportHtml` call sites to pass `hi` into `head`, `frun`, `numRows`, `analyticalPage`.

The s13 sign-off (`सादर, TalkToGuruji`) and the upsell block are already language-aware — leave them.

### 4. No other changes

- No prompt edit — Gemini is already producing Hindi body copy correctly.
- No cache-key bump — cached prose was generated after the previous cache-key bump (`prose:v3:`) and is already Hindi. Bumping again would just re-bill Gemini for zero content change. The bug is 100% in the template shell.
- Logo, chip, sign-off styling untouched.

### 5. Redeploy + verify

- `supabase--deploy_edge_functions` for `love-match-finalize` and `admin-create-free-report`.
- Ask the user to regenerate one Hindi report and confirm:
  - Cover strapline, section headings, footer, and core-number labels are Devanagari.
  - Body text (already fine) still reads naturally.
  - English orders are unchanged (English map is untouched).
