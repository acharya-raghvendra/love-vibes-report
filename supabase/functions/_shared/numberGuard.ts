// Core-number verifier for generated prose.
//
// Replaces the old blanket "reject any small number" allow-list. The engine
// already computes the authoritative core numbers, so instead of gating on a
// list we VERIFY the model's stated claims against those values:
//
//   claim matches computed value   -> allow
//   claim contradicts it           -> hallucination (retry, then deterministic fix)
//   incidental numbers             -> always allowed, never gated
//
// A paid order must NEVER hard-fail on this guard.

import type { MatchResult } from "./engine/scorer.ts";
import type { CoreNumbers } from "./engine/numbers.ts";

export type CoreKey = "lifePath" | "destiny" | "soulUrge" | "personality" | "maturity";

export interface PersonClaims {
  name: string;
  /** key -> set of acceptable stated numbers (display, compound, hard score) */
  values: Record<CoreKey, Set<number>>;
  /** key -> the canonical number to write when correcting */
  canonical: Record<CoreKey, number>;
}

export interface CoreClaims {
  a: PersonClaims;
  b: PersonClaims;
}

export interface Mismatch {
  person: string;
  key: CoreKey;
  found: number;
  expected: number;
  snippet: string;
}

const KEYS: CoreKey[] = ["lifePath", "destiny", "soulUrge", "personality", "maturity"];

// Label aliases per key, English + Hindi/Hinglish (prose is localised, so the
// Devanagari forms matter). Longest-first matching happens via the alternation
// order below.
const LABELS: Record<CoreKey, string[]> = {
  lifePath: ["life path", "lifepath", "life-path", "जीवन पथ", "जीवन-पथ", "लाइफ पाथ", "लाइफ़ पाथ"],
  destiny: ["destiny", "expression number", "भाग्य अंक", "भाग्य", "डेस्टिनी"],
  soulUrge: ["soul urge", "soul-urge", "आत्मा अंक", "आत्मा की", "सोल अर्ज", "सोल"],
  personality: ["personality", "व्यक्तित्व", "पर्सनालिटी"],
  maturity: ["maturity", "परिपक्वता", "मैच्योरिटी"],
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function labelAlternation(): string {
  const all: string[] = [];
  for (const k of KEYS) all.push(...LABELS[k]);
  all.sort((x, y) => y.length - x.length);
  return all.map(escapeRe).join("|");
}

function keyForLabel(label: string): CoreKey | null {
  const l = label.toLowerCase();
  for (const k of KEYS) {
    if (LABELS[k].some((alias) => alias.toLowerCase() === l)) return k;
  }
  return null;
}

function personValues(cn: CoreNumbers, name: string): PersonClaims {
  const values = {} as Record<CoreKey, Set<number>>;
  const canonical = {} as Record<CoreKey, number>;
  for (const k of KEYS) {
    const f = cn[k];
    values[k] = new Set([f.display, f.compound, f.score]);
    canonical[k] = f.display;
  }
  return { name, values, canonical };
}

export function buildCoreClaims(
  result: MatchResult,
  names: { a?: string; b?: string },
): CoreClaims {
  return {
    a: personValues(result.a, names.a ?? "Person A"),
    b: personValues(result.b, names.b ?? "Person B"),
  };
}

/** Short, human-readable list of the authoritative numbers for the prompt. */
export function claimsSummary(claims: CoreClaims): string {
  const one = (p: PersonClaims) =>
    `${p.name}: Life Path ${p.canonical.lifePath}, Destiny ${p.canonical.destiny}, ` +
    `Soul Urge ${p.canonical.soulUrge}, Personality ${p.canonical.personality}, ` +
    `Maturity ${p.canonical.maturity}`;
  return `${one(claims.a)}. ${one(claims.b)}.`;
}

// --- string walking -------------------------------------------------------

type Visitor = (s: string, path: (string | number)[]) => string | void;

function walkStrings(node: unknown, visit: Visitor, path: (string | number)[] = []): unknown {
  if (typeof node === "string") {
    const out = visit(node, path);
    return typeof out === "string" ? out : node;
  }
  if (Array.isArray(node)) return node.map((v, i) => walkStrings(v, visit, [...path, i]));
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = walkStrings(v, visit, [...path, k]);
    }
    return out;
  }
  return node;
}

/**
 * Which person a claim belongs to, judged from the ~80 chars before it.
 * Returns null when ambiguous (both or neither name nearby) — ambiguous
 * claims are accepted if they match EITHER person, never treated as errors.
 */
function whichPerson(text: string, at: number, claims: CoreClaims): "a" | "b" | null {
  const window = text.slice(Math.max(0, at - 90), at).toLowerCase();
  const aName = claims.a.name.toLowerCase();
  const bName = claims.b.name.toLowerCase();
  const ai = aName ? window.lastIndexOf(aName) : -1;
  const bi = bName ? window.lastIndexOf(bName) : -1;
  if (ai === -1 && bi === -1) return null;
  if (bi === -1) return "a";
  if (ai === -1) return "b";
  return ai > bi ? "a" : "b";
}

interface Found {
  key: CoreKey;
  num: number;
  index: number;      // index of the number token within the string
  length: number;     // length of the number token
  person: "a" | "b" | null;
  snippet: string;
}

/**
 * Map Devanagari digits (०-९) to Latin 0-9. Hindi prose may state core numbers
 * in Devanagari; each mapped code point is exactly one char wide, so string
 * indexes stay valid against the ORIGINAL text (needed by correctCoreNumbers).
 */
function toLatinDigits(s: string): string {
  return s.replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x0966));
}

function findClaims(original: string, claims: CoreClaims): Found[] {
  const text = toLatinDigits(original);
  const labels = labelAlternation();
  // "Life Path 7", "Life Path is 7", "Life Path number 7" and the reverse
  // "7 Life Path". Only 1-2 digit numbers are considered core-number claims.
  const forward = new RegExp(`(${labels})\\s*(?:number|अंक|है|is|of|:|,|-|—)?\\s*(\\d{1,2})\\b`, "gi");
  const backward = new RegExp(`\\b(\\d{1,2})\\s*(?:का|की|ka|ki)?\\s*(${labels})\\b`, "gi");
  const out: Found[] = [];

  for (const [re, numFirst] of [[forward, false], [backward, true]] as const) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const label = numFirst ? m[2] : m[1];
      const numStr = numFirst ? m[1] : m[2];
      const key = keyForLabel(label);
      if (!key) continue;
      const num = Number(numStr);
      if (!Number.isFinite(num)) continue;
      const numIndex = m.index + m[0].lastIndexOf(numStr);
      out.push({
        key,
        num,
        index: numIndex,
        length: numStr.length,
        person: whichPerson(text, m.index, claims),
        snippet: original.slice(Math.max(0, m.index - 30), m.index + m[0].length + 20),
      });
    }
  }
  return out;
}

function isAcceptable(f: Found, claims: CoreClaims): boolean {
  if (f.person) return claims[f.person].values[f.key].has(f.num);
  // Ambiguous attribution: accept if it matches either person.
  return claims.a.values[f.key].has(f.num) || claims.b.values[f.key].has(f.num);
}

// --- public API -----------------------------------------------------------

/**
 * Verify stated core numbers against the engine. Incidental numbers
 * (counts, days, ages, percentages, money, years) are never inspected.
 */
export function verifyCoreNumbers(
  sections: unknown,
  claims: CoreClaims,
): { ok: boolean; mismatches: Mismatch[] } {
  const mismatches: Mismatch[] = [];
  walkStrings(sections, (s) => {
    for (const f of findClaims(s, claims)) {
      if (isAcceptable(f, claims)) continue;
      const person = f.person ?? "a";
      mismatches.push({
        person: claims[person].name,
        key: f.key,
        found: f.num,
        expected: claims[person].canonical[f.key],
        snippet: f.snippet,
      });
    }
  });
  return { ok: mismatches.length === 0, mismatches };
}

/**
 * Deterministically rewrite contradicting core numbers to the computed
 * values. Safe because the correct values are known exactly.
 */
export function correctCoreNumbers(
  sections: unknown,
  claims: CoreClaims,
): { sections: unknown; corrections: number } {
  let corrections = 0;
  const fixed = walkStrings(sections, (s) => {
    const bad = findClaims(s, claims).filter((f) => !isAcceptable(f, claims));
    if (bad.length === 0) return s;
    // Rewrite right-to-left so earlier indexes stay valid.
    bad.sort((x, y) => y.index - x.index);
    let out = s;
    for (const f of bad) {
      const person = f.person ?? "a";
      const expected = String(claims[person].canonical[f.key]);
      out = out.slice(0, f.index) + expected + out.slice(f.index + f.length);
      corrections++;
    }
    return out;
  });
  return { sections: fixed, corrections };
}

/** Compact, PII-free description of mismatches for error_detail / logs. */
export function describeMismatches(mismatches: Mismatch[], limit = 4): string {
  return mismatches
    .slice(0, limit)
    .map((m) => `${m.key}: said ${m.found}, expected ${m.expected}`)
    .join("; ");
}

/** Corrective instruction appended to the system prompt on a retry. */
export function correctiveInstruction(claims: CoreClaims, mismatches: Mismatch[]): string {
  return [
    "NUMBER CORRECTION: your previous attempt stated core numbers that contradict the facts.",
    `Wrong claims: ${describeMismatches(mismatches, 6)}.`,
    `The ONLY correct core numbers are: ${claimsSummary(claims)}`,
    "Use exactly these values wherever you name a core number. Do not invent or alter any of them.",
  ].join(" ");
}
