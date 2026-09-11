// supabase/functions/_shared/fonts/indic.ts
//
// Multi-script font pipeline for printed reports. Generalises devanagari.ts to
// every script the Love Match report ships in.
//
// WHY THIS EXISTS (unchanged reasoning from devanagari.ts)
// A report printed with a font that has no coverage for its script renders as
// tofu (empty boxes). Chrome cannot be made to fail loudly on that by itself:
// `networkidle0` resolves even when the font request errored, and
// `document.fonts.ready` resolves whether each face loaded or failed. So a wait
// guard would silently ship tofu.
//
// Two independent defences:
//   1. Font bytes inlined into the print HTML as a `data:` URL, so at render
//      time Chrome makes ZERO network requests for Indic glyphs. Bytes come
//      from the private `report-fonts` bucket, read with the service role and
//      cached per isolate. A failed read throws; the caller fails the stage.
//   2. `assertScriptRendered` — a render-time probe that proves the glyphs
//      actually painted from our face.
//
// PREREQUISITE: the woff2 files listed in FONTS below must exist in the
// `report-fonts` bucket. Subset with `--layout-features='*'` or conjunct
// shaping breaks.
//
// Licence for all faces: SIL Open Font License 1.1.

// deno-lint-ignore no-explicit-any
type StorageClient = any;

const BUCKET = "report-fonts";

export type ScriptKey =
  | "latin"
  | "devanagari"
  | "tamil"
  | "telugu"
  | "kannada"
  | "malayalam";

interface ScriptFont {
  /** CSS font-family name used in buildReportHtml's font stacks. */
  family: string;
  files: Array<{ weight: number; name: string }>;
  unicodeRange: string;
  /** Indic scripts have tall stacked conjuncts and need more leading. */
  lineHeight: number;
}

const FONTS: Record<Exclude<ScriptKey, "latin">, ScriptFont> = {
  devanagari: {
    family: "Noto Sans Devanagari",
    files: [
      { weight: 400, name: "noto-sans-devanagari-400.woff2" },
      { weight: 600, name: "noto-sans-devanagari-600.woff2" },
    ],
    unicodeRange:
      "U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF",
    lineHeight: 1.82,
  },
  tamil: {
    family: "Noto Sans Tamil",
    files: [
      { weight: 400, name: "noto-sans-tamil-400.woff2" },
      { weight: 600, name: "noto-sans-tamil-600.woff2" },
    ],
    unicodeRange: "U+0964-0965,U+0B82-0BFA,U+200C-200D,U+20B9,U+25CC",
    lineHeight: 1.9,
  },
  telugu: {
    family: "Noto Sans Telugu",
    files: [
      { weight: 400, name: "noto-sans-telugu-400.woff2" },
      { weight: 600, name: "noto-sans-telugu-600.woff2" },
    ],
    unicodeRange: "U+0964-0965,U+0C00-0C7F,U+1CDA,U+1CF2,U+200C-200D,U+25CC",
    lineHeight: 1.95,
  },
  kannada: {
    family: "Noto Sans Kannada",
    files: [
      { weight: 400, name: "noto-sans-kannada-400.woff2" },
      { weight: 600, name: "noto-sans-kannada-600.woff2" },
    ],
    unicodeRange: "U+0964-0965,U+0C80-0CF3,U+1CD0-1CF2,U+200C-200D,U+25CC",
    lineHeight: 1.95,
  },
  malayalam: {
    family: "Noto Sans Malayalam",
    files: [
      { weight: 400, name: "noto-sans-malayalam-400.woff2" },
      { weight: 600, name: "noto-sans-malayalam-600.woff2" },
    ],
    unicodeRange: "U+0964-0965,U+0D00-0D7F,U+200C-200D,U+25CC",
    lineHeight: 2.0,
  },
};

/** CSS family name for a script, for buildReportHtml's font stacks. */
export function familyFor(script: ScriptKey): string | null {
  return script === "latin" ? null : FONTS[script].family;
}

export function lineHeightFor(script: ScriptKey): number {
  return script === "latin" ? 1.82 : FONTS[script].lineHeight;
}

// --- loader -----------------------------------------------------------------

const cachedCss = new Map<ScriptKey, string>();

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/**
 * Returns `@font-face` CSS for the script's face, woff2 bytes inlined as
 * base64 `data:` URLs. Cached for the lifetime of the isolate.
 *
 * `latin` returns "" — Latin comes from the Google Fonts link already in the
 * document head.
 *
 * Throws `font_unavailable:<detail>` if the bytes cannot be read. Callers MUST
 * fail the generation stage rather than print without the face.
 */
export async function loadFontFaceCss(
  supabase: StorageClient,
  script: ScriptKey,
): Promise<string> {
  if (script === "latin") return "";
  const hit = cachedCss.get(script);
  if (hit) return hit;

  const cfg = FONTS[script];
  const faces: string[] = [];

  for (const f of cfg.files) {
    const { data, error } = await supabase.storage.from(BUCKET).download(f.name);
    if (error || !data) {
      throw new Error(`font_unavailable:${f.name}:${error?.message ?? "empty"}`);
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (bytes.length < 1024) {
      throw new Error(`font_unavailable:${f.name}:too_small:${bytes.length}`);
    }
    faces.push(
      `@font-face{font-family:'${cfg.family}';font-style:normal;` +
        `font-weight:${f.weight};font-display:block;` +
        `src:url(data:font/woff2;base64,${toBase64(bytes)}) format('woff2');` +
        `unicode-range:${cfg.unicodeRange};}`,
    );
  }

  const css = faces.join("\n");
  cachedCss.set(script, css);
  return css;
}

// --- probe ------------------------------------------------------------------

interface ProbeSample {
  /** Plain letters, a vowel sign and a conjunct — a realistic line. */
  text: string;
  /** A cluster that must ligate or stack. */
  cluster: string;
  /** The cluster's codepoints, to be drawn separately for comparison. */
  parts: string[];
}

const SAMPLES: Record<Exclude<ScriptKey, "latin">, ProbeSample> = {
  devanagari: {
    text: "आपका रिश्ता मजबूत और सुंदर है",
    cluster: "क्षि",
    parts: ["क", "्", "ष", "ि"],
  },
  tamil: {
    text: "உங்கள் உறவு வலிமையானது",
    cluster: "ஸ்ரீ",
    parts: ["ஸ", "்", "ர", "ீ"],
  },
  telugu: {
    text: "మీ బంధం బలంగా ఉంది",
    cluster: "క్ష",
    parts: ["క", "్", "ష"],
  },
  kannada: {
    text: "ನಿಮ್ಮ ಸಂಬಂಧ ಗಟ್ಟಿಯಾಗಿದೆ",
    cluster: "ಕ್ಷ",
    parts: ["ಕ", "್", "ಷ"],
  },
  malayalam: {
    text: "നിങ്ങളുടെ ബന്ധം ശക്തമാണ്",
    cluster: "ക്ഷ",
    parts: ["ക", "്", "ഷ"],
  },
};

export interface FontProbe {
  ok: boolean;
  reason?: string;
  script?: ScriptKey;
  /** Faces of the target family reported as loaded by the FontFaceSet. */
  loadedFaces?: number;
  /** true when the loaded face covers every codepoint in the sample text. */
  covers?: boolean;
  /** Painted width of the sample in our family, px at 64px. */
  width?: number;
  /** Painted width with no usable family (fallback baseline, diagnostic only). */
  fallbackWidth?: number;
  clusterWidth?: number;
  partsWidth?: number;
  /** true when the cluster painted narrower than its parts. */
  shaped?: boolean;
}

// Runs inside the Browserless page. Everything here is browser-side.
const PROBE_FN = `
export default async function ({ page, context }) {
  await page.setContent(context.html, { waitUntil: 'load' });
  const cfg = context.cfg;
  const probe = await page.evaluate(async (cfg) => {
    try {
      await document.fonts.ready;
      const FAM = "'" + cfg.family + "'";
      const BOGUS = "'__no_such_family__'";
      const measure = (family, text) => {
        const s = document.createElement('span');
        s.style.cssText =
          'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;' +
          'font-size:64px;font-variant-ligatures:normal;font-family:' + family;
        s.textContent = text;
        document.body.appendChild(s);
        const w = s.getBoundingClientRect().width;
        s.remove();
        return w;
      };
      const faces = Array.from(document.fonts).filter(
        (f) => f.family.replace(/['"]/g, '') === cfg.family
      );
      const loadedFaces = faces.filter((f) => f.status === 'loaded').length;
      const covers = document.fonts.check('64px ' + FAM, cfg.text);
      const width = measure(FAM, cfg.text);
      const fallbackWidth = measure(BOGUS, cfg.text);
      const clusterWidth = measure(FAM, cfg.cluster);
      const partsWidth = cfg.parts.reduce((sum, p) => sum + measure(FAM, p), 0);
      const shaped = clusterWidth < partsWidth * 0.95;

      // Hard gates. fallbackWidth is diagnostic only: on a host that also ships
      // the same Noto face the widths legitimately match, and that is still a
      // correct render, so it must not fail the report.
      //
      // Conjunct shaping is a HARD gate only where it is proven (Devanagari).
      // For the newer scripts it is recorded but advisory: Tamil in particular
      // shows most consonant clusters with a visible pulli rather than a
      // ligature, so a width test can fail on a perfectly good render. Tofu is
      // already caught by loadedFaces + covers, which are the real gates.
      let reason;
      if (loadedFaces === 0) reason = 'no_loaded_face';
      else if (!covers) reason = 'face_missing_glyphs';
      else if (!(width > 0)) reason = 'zero_width';
      else if (cfg.strictShaping && !shaped) reason = 'no_conjunct_shaping';

      return {
        ok: !reason, reason, loadedFaces, covers, width,
        fallbackWidth, clusterWidth, partsWidth, shaped
      };
    } catch (e) {
      return { ok: false, reason: 'probe_threw:' + (e && e.message ? e.message : String(e)) };
    }
  }, cfg);
  return { data: probe, type: 'application/json' };
}
`;

/**
 * Proves text in `script` ACTUALLY RENDERED from our embedded face, not merely
 * that the face is present in the document. In the same Chrome that prints the
 * PDF, against the same HTML, it asserts:
 *
 *  - a FontFace for the target family reports `status === "loaded"`;
 *  - `document.fonts.check` is true for the sample, so no codepoint can fall
 *    through to tofu;
 *  - the painted width is non-zero;
 *  - (Devanagari only, as a hard gate) the conjunct paints narrower than its
 *    parts drawn separately, which only happens if the shaping tables applied.
 *
 * `latin` is a no-op and returns ok. A transport or probe error returns
 * `ok: false` — "could not verify" is never treated as "verified".
 */
export async function assertScriptRendered(
  html: string,
  browserlessKey: string,
  script: ScriptKey,
): Promise<FontProbe> {
  if (script === "latin") return { ok: true, script };

  const cfg = FONTS[script];
  const sample = SAMPLES[script];

  try {
    const res = await fetch(
      `https://production-sfo.browserless.io/function?token=${browserlessKey}&timeout=60000`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: PROBE_FN,
          context: {
            html,
            cfg: {
              family: cfg.family,
              text: sample.text,
              cluster: sample.cluster,
              parts: sample.parts,
              strictShaping: script === "devanagari",
            },
          },
        }),
      },
    );
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, script, reason: `probe_http_${res.status}:${raw.slice(0, 200)}` };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, script, reason: `probe_unparsable:${raw.slice(0, 200)}` };
    }
    const p = (parsed && typeof parsed === "object" && "data" in (parsed as Record<string, unknown>)
      ? (parsed as Record<string, unknown>).data
      : parsed) as FontProbe;
    if (!p || typeof p.ok !== "boolean") {
      return { ok: false, script, reason: `probe_bad_shape:${raw.slice(0, 200)}` };
    }
    return { ...p, script };
  } catch (err) {
    return {
      ok: false,
      script,
      reason: `probe_error:${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** One-line summary for logs / error_detail. */
export function describeFontProbe(p: FontProbe): string {
  return `script=${p.script ?? "-"} ok=${p.ok} reason=${p.reason ?? "-"} ` +
    `loaded=${p.loadedFaces ?? "-"} covers=${p.covers ?? "-"} w=${p.width ?? "-"} ` +
    `fallback_w=${p.fallbackWidth ?? "-"} cluster=${p.clusterWidth ?? "-"}/${p.partsWidth ?? "-"} ` +
    `shaped=${p.shaped ?? "-"}`;
}
