// Devanagari font pipeline for printed reports.
//
// WHY THIS EXISTS
// A Hindi report printed with a font that has no Devanagari coverage renders as
// tofu (empty boxes). Chrome cannot be made to fail loudly on that by itself:
// `waitUntil: "networkidle0"` resolves once the network is quiet — including
// when the font request errored — and `document.fonts.ready` resolves whether
// each face loaded or failed. So a wait guard would silently ship tofu.
//
// Two independent defences, both implemented here:
//   1. The font bytes are inlined into the print HTML as a `data:` URL, so at
//      render time Chrome makes ZERO network requests for Devanagari glyphs.
//      The bytes come from our own private `report-fonts` storage bucket, read
//      with the service role, cached per isolate; if that read fails we throw
//      and the caller fails the stage instead of printing.
//   2. `assertDevanagariRendered` — a render-time probe that proves the glyphs
//      actually painted from our face (see its doc comment).
//
// Font: Noto Sans Devanagari, weights 400 + 600, subset to Devanagari + basic
// Latin, woff2 (45KB / 48KB). License: SIL Open Font License 1.1.

// deno-lint-ignore no-explicit-any
type StorageClient = any;

const BUCKET = "report-fonts";
const FILES: Array<{ weight: number; name: string }> = [
  { weight: 400, name: "noto-sans-devanagari-400.woff2" },
  { weight: 600, name: "noto-sans-devanagari-600.woff2" },
];

const DEVANAGARI_RANGE =
  "U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF";

let cachedCss: string | null = null;

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/**
 * Returns `@font-face` CSS for Noto Sans Devanagari with the woff2 bytes inlined
 * as base64 `data:` URLs. Cached for the lifetime of the isolate.
 *
 * Throws `font_unavailable:<detail>` if the bytes cannot be read — callers MUST
 * fail the generation stage rather than print without the face.
 */
export async function loadDevanagariFontFaceCss(supabase: StorageClient): Promise<string> {
  if (cachedCss) return cachedCss;

  const faces: string[] = [];
  for (const f of FILES) {
    const { data, error } = await supabase.storage.from(BUCKET).download(f.name);
    if (error || !data) {
      throw new Error(`font_unavailable:${f.name}:${error?.message ?? "empty"}`);
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (bytes.length < 1024) {
      throw new Error(`font_unavailable:${f.name}:too_small:${bytes.length}`);
    }
    faces.push(
      `@font-face{font-family:'Noto Sans Devanagari';font-style:normal;` +
        `font-weight:${f.weight};font-display:block;` +
        `src:url(data:font/woff2;base64,${toBase64(bytes)}) format('woff2');` +
        `unicode-range:${DEVANAGARI_RANGE};}`,
    );
  }

  cachedCss = faces.join("\n");
  return cachedCss;
}

/** Text used by the render probe: plain letters, a matra and two conjuncts. */
export const PROBE_TEXT = "आपका रिश्ता मजबूत और सुंदर है";
const PROBE_CLUSTER = "क्षि";
const PROBE_PARTS = ["क", "्", "ष", "ि"];

export interface DevanagariProbe {
  ok: boolean;
  reason?: string;
  /** Faces of our family reported as loaded by the FontFaceSet. */
  loadedFaces?: number;
  /** true when the loaded face covers every codepoint in PROBE_TEXT. */
  covers?: boolean;
  /** Painted width of PROBE_TEXT in our family, px at 64px. */
  width?: number;
  /** Painted width of the same text with no usable family (fallback baseline). */
  fallbackWidth?: number;
  /** Painted width of the conjunct cluster vs. its parts drawn separately. */
  clusterWidth?: number;
  partsWidth?: number;
}

// Runs inside the Browserless page. Everything here is browser-side.
const PROBE_FN = `
export default async function ({ page, context }) {
  await page.setContent(context.html, { waitUntil: 'load' });
  const probe = await page.evaluate(async (cfg) => {
    try {
      await document.fonts.ready;
      const FAM = "'Noto Sans Devanagari'";
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
        (f) => f.family.replace(/['"]/g, '') === 'Noto Sans Devanagari'
      );
      const loadedFaces = faces.filter((f) => f.status === 'loaded').length;
      const covers = document.fonts.check('64px ' + FAM, cfg.text);
      const width = measure(FAM, cfg.text);
      const fallbackWidth = measure(BOGUS, cfg.text);
      const clusterWidth = measure(FAM, cfg.cluster);
      const partsWidth = cfg.parts.reduce((sum, p) => sum + measure(FAM, p), 0);

      let reason;
      if (loadedFaces === 0) reason = 'no_loaded_face';
      else if (!covers) reason = 'face_missing_glyphs';
      else if (!(width > 0)) reason = 'zero_width';
      else if (Math.abs(width - fallbackWidth) < 1) reason = 'fallback_metrics';
      else if (!(clusterWidth < partsWidth * 0.95)) reason = 'no_conjunct_shaping';

      return { ok: !reason, reason, loadedFaces, covers, width, fallbackWidth, clusterWidth, partsWidth };
    } catch (e) {
      return { ok: false, reason: 'probe_threw:' + (e && e.message ? e.message : String(e)) };
    }
  }, cfg);
  return { data: probe, type: 'application/json' };
}
`;

/**
 * Proves Devanagari text ACTUALLY RENDERED from our embedded face — not merely
 * that the face is present in the document. In the same Chrome that prints the
 * PDF, against the same HTML, it asserts all of:
 *
 *  - a `Noto Sans Devanagari` FontFace reports `status === "loaded"`
 *    (the data-URL bytes decoded into a usable face);
 *  - `document.fonts.check(font, PROBE_TEXT)` is true — the loaded face covers
 *    every codepoint in the sample, so no character can fall through to tofu;
 *  - the painted width of the sample is non-zero AND differs from the same text
 *    painted with an unresolvable family, i.e. the glyphs came from our face
 *    rather than the generic fallback;
 *  - the conjunct "क्षि" paints narrower than its four parts drawn separately,
 *    which only happens if the Devanagari shaping tables in our face were
 *    applied. Tofu boxes have fixed per-glyph advances and fail this.
 *
 * Returns the probe result; callers fail the stage as `pdf_font_missing` when
 * `ok` is false. A transport/probe error also returns `ok: false` — we never
 * treat "could not verify" as "verified".
 */
export async function assertDevanagariRendered(
  html: string,
  browserlessKey: string,
): Promise<DevanagariProbe> {
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
            cfg: { text: PROBE_TEXT, cluster: PROBE_CLUSTER, parts: PROBE_PARTS },
          },
        }),
      },
    );
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, reason: `probe_http_${res.status}:${raw.slice(0, 200)}` };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, reason: `probe_unparsable:${raw.slice(0, 200)}` };
    }
    const p = (parsed && typeof parsed === "object" && "data" in (parsed as Record<string, unknown>)
      ? (parsed as Record<string, unknown>).data
      : parsed) as DevanagariProbe;
    if (!p || typeof p.ok !== "boolean") {
      return { ok: false, reason: `probe_bad_shape:${raw.slice(0, 200)}` };
    }
    return p;
  } catch (err) {
    return { ok: false, reason: `probe_error:${err instanceof Error ? err.message : String(err)}` };
  }
}

/** One-line summary for logs / error_detail. */
export function describeProbe(p: DevanagariProbe): string {
  return `ok=${p.ok} reason=${p.reason ?? "-"} loaded=${p.loadedFaces ?? "-"} covers=${p.covers ?? "-"} ` +
    `w=${p.width ?? "-"} fallback_w=${p.fallbackWidth ?? "-"} cluster=${p.clusterWidth ?? "-"}/${p.partsWidth ?? "-"}`;
}
