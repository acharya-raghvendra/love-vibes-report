// Deterministic compatibility scorer for Love Match.
// Consumes core numbers for two people, returns score + band + per-number breakdown.
// The LLM writes prose from this; it never computes.

import { computeCore, CoreNumbers } from "./numbers.ts";

// Symmetric friendship grid (Parashari + Rahu=Saturn / Ketu=Mars, averaged).
// Approved. Diagonal = 100 (same number = own planet).
export const FRIENDSHIP: Record<string, number> = {
  "1-1":100,"1-2":100,"1-3":100,"1-4":20,"1-5":75,"1-6":20,"1-7":100,"1-8":20,"1-9":100,
  "2-1":100,"2-2":100,"2-3":75,"2-4":35,"2-5":60,"2-6":35,"2-7":75,"2-8":35,"2-9":75,
  "3-1":100,"3-2":75,"3-3":100,"3-4":50,"3-5":35,"3-6":35,"3-7":100,"3-8":50,"3-9":100,
  "4-1":20,"4-2":35,"4-3":50,"4-4":100,"4-5":75,"4-6":100,"4-7":35,"4-8":50,"4-9":35,
  "5-1":75,"5-2":60,"5-3":35,"5-4":75,"5-5":100,"5-6":100,"5-7":35,"5-8":75,"5-9":35,
  "6-1":20,"6-2":35,"6-3":35,"6-4":100,"6-5":100,"6-6":100,"6-7":50,"6-8":100,"6-9":50,
  "7-1":100,"7-2":75,"7-3":100,"7-4":35,"7-5":35,"7-6":50,"7-7":100,"7-8":35,"7-9":50,
  "8-1":20,"8-2":35,"8-3":50,"8-4":50,"8-5":75,"8-6":100,"8-7":35,"8-8":100,"8-9":35,
  "9-1":100,"9-2":75,"9-3":100,"9-4":35,"9-5":35,"9-6":50,"9-7":50,"9-8":35,"9-9":100,
};

export const WEIGHTS = { lifePath: 0.30, soulUrge: 0.30, personality: 0.20, destiny: 0.20 };

export interface PairPoint {
  key: "lifePath" | "soulUrge" | "personality" | "destiny";
  aScore: number;
  bScore: number;
  points: number;
  weight: number;
}

export interface MatchResult {
  score: number; // 0-100 integer
  band: "Strong" | "Balanced" | "Mixed" | "Challenging";
  breakdown: PairPoint[];
  a: CoreNumbers;
  b: CoreNumbers;
  shared: string[]; // e.g. ["Destiny 1", "Personal Year 2"]
}

function pairPoints(a: number, b: number): number {
  return FRIENDSHIP[`${a}-${b}`];
}

function band(score: number): MatchResult["band"] {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Balanced";
  if (score >= 40) return "Mixed";
  return "Challenging";
}

export function scoreMatch(
  aFirst: string, aLast: string, aDob: string,
  bFirst: string, bLast: string, bDob: string,
  refYear: number,
): MatchResult {
  const a = computeCore(aFirst, aLast, aDob, refYear);
  const b = computeCore(bFirst, bLast, bDob, refYear);

  const keys: PairPoint["key"][] = ["lifePath", "soulUrge", "personality", "destiny"];
  const breakdown: PairPoint[] = keys.map((k) => {
    const aScore = a[k].score;
    const bScore = b[k].score;
    return { key: k, aScore, bScore, points: pairPoints(aScore, bScore), weight: WEIGHTS[k] };
  });

  const raw = breakdown.reduce((s, p) => s + p.points * p.weight, 0);
  const score = Math.round(raw);

  const shared: string[] = [];
  for (const k of keys) {
    if (a[k].display === b[k].display) shared.push(`${label(k)} ${a[k].display}`);
  }
  if (a.personalYear === b.personalYear) shared.push(`Personal Year ${a.personalYear}`);

  return { score, band: band(score), breakdown, a, b, shared };
}

function label(k: string): string {
  return k === "lifePath" ? "Life Path"
    : k === "soulUrge" ? "Soul Urge"
    : k === "personality" ? "Personality"
    : "Destiny";
}
