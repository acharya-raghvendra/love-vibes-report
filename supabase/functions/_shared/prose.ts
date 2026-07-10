// Shared prose helpers extracted (copied verbatim) from love-match-finalize.
// Do NOT change signatures — partner-generate-full must produce the same
// prose_key as love-match-finalize/admin-create-free-report so the cache is
// shared. love-match-finalize keeps its inline copies untouched.

import type { MatchResult } from "./engine/scorer.ts";
import { buildSystemPrompt } from "./prosePrompt.ts";

export async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function collectStrings(v: unknown, out: string[]): void {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) collectStrings(x, out);
  else if (v && typeof v === "object") for (const x of Object.values(v)) collectStrings(x, out);
}

export function validateNoInventedNumbers(sections: unknown, allowed: Set<string>): boolean {
  const strs: string[] = [];
  collectStrings(sections, strs);
  const prose = strs.join(" ");
  const nums = prose.match(/\d+/g) ?? [];
  for (const n of nums) {
    if (allowed.has(n)) continue;
    if (/^(19|20)\d\d$/.test(n)) continue; // years
    if (n.length >= 4) continue;           // dates/large numbers
    return false;
  }
  return true;
}

export async function generateProse(
  facts: { names?: { a?: string; b?: string }; language?: string },
  language: string,
): Promise<Record<string, unknown>> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("gemini_missing_key");
  const model = "gemini-2.5-flash";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const A = facts.names?.a || "Person A";
  const B = facts.names?.b || "Person B";
  const system = buildSystemPrompt(A, B, language);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(facts) }] }],
      generationConfig: {
        temperature: 0.55,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gemini_http status=${res.status} body=${body.slice(0, 500)}`);
  }
  const data = await res.json();
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(text);
  return parsed.sections ?? parsed;
}

export function allowedNumberSet(r: MatchResult): Set<string> {
  const s = new Set<string>();
  s.add(String(r.score));
  const add = (cn: typeof r.a) => {
    for (const k of ["lifePath", "destiny", "soulUrge", "personality", "maturity"] as const) {
      s.add(String(cn[k].display));
      s.add(String(cn[k].compound));
      s.add(String(cn[k].score));
    }
    s.add(String(cn.personalYear));
  };
  add(r.a); add(r.b);
  for (let i = 1; i <= 9; i++) s.add(String(i));
  s.add("11"); s.add("22"); s.add("33");
  return s;
}

// Build the exact prose cache key used by love-match-finalize:
// sha256("prose:v3:" + language + ":" + JSON.stringify({language, score, band,
// shared, person_a, person_b, names: { a, b } })). No chemistry. No DOBs.
export function buildProseKey(
  language: string,
  facts: {
    language: string;
    score: number;
    band: string;
    shared?: string[];
    person_a: unknown;
    person_b: unknown;
    names: { a?: string; b?: string };
  },
): Promise<string> {
  return sha256(`prose:v3:${language}:${JSON.stringify(facts)}`);
}
