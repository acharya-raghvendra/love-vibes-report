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

const TRANSIENT_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const MAX_TRANSIENT_ATTEMPTS = 4;      // total calls: ~1s, 2s, 4s backoff between
const MAX_BACKOFF_MS = 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt: number, retryAfter?: string | null): number {
  const ra = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, MAX_BACKOFF_MS);
  const base = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
  return base + Math.floor(Math.random() * 400); // jitter
}

export async function generateProse(
  facts: { names?: { a?: string; b?: string }; language?: string },
  language: string,
  opts: { corrective?: string } = {},
): Promise<Record<string, unknown>> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("gemini_missing_key");
  const model = "gemini-2.5-flash";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const A = facts.names?.a || "Person A";
  const B = facts.names?.b || "Person B";
  const system = opts.corrective
    ? `${buildSystemPrompt(A, B, language)}\n\n${opts.corrective}`
    : buildSystemPrompt(A, B, language);

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(facts) }] }],
    generationConfig: {
      temperature: 0.55,
      responseMimeType: "application/json",
      maxOutputTokens: 32768,
    },
  });

  // Transient-error budget. This is SEPARATE from any content/guard retries
  // the caller runs, so neither eats the other's attempts. Worst case wall
  // time stays well under the 6 minute stale-generating cutoff.
  let res: Response | null = null;
  let lastTransient = "";
  for (let attempt = 0; attempt < MAX_TRANSIENT_ATTEMPTS; attempt++) {
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } catch (err) {
      // Network / timeout: transient.
      lastTransient = `network:${err instanceof Error ? err.message.slice(0, 120) : "fetch_failed"}`;
      res = null;
      if (attempt < MAX_TRANSIENT_ATTEMPTS - 1) {
        await sleep(backoffMs(attempt));
        continue;
      }
      break;
    }
    if (res.ok) break;
    if (!TRANSIENT_STATUSES.has(res.status)) {
      // 400/401/403 and friends are permanent: do not retry.
      const text = await res.text();
      throw new Error(`gemini_http status=${res.status} body=${text.slice(0, 500)}`);
    }
    lastTransient = `status=${res.status}`;
    const retryAfter = res.headers.get("retry-after");
    await res.text().catch(() => "");
    if (attempt < MAX_TRANSIENT_ATTEMPTS - 1) {
      console.error(`[prose] transient gemini ${lastTransient} attempt=${attempt}, backing off`);
      await sleep(backoffMs(attempt, retryAfter));
      res = null;
      continue;
    }
    res = null;
  }

  if (!res) {
    throw new Error(`gemini_overloaded ${lastTransient} attempts=${MAX_TRANSIENT_ATTEMPTS}`);
  }

  const data = await res.json();
  const finishReason = data?.candidates?.[0]?.finishReason ?? "UNKNOWN";
  const outputTokens = data?.usageMetadata?.candidatesTokenCount ?? -1;
  console.log(`[prose] gemini finish_reason=${finishReason} output_tokens=${outputTokens}`);
  if (finishReason === "MAX_TOKENS") {
    throw new Error(`gemini_truncated finish_reason=MAX_TOKENS output_tokens=${outputTokens}`);
  }
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
