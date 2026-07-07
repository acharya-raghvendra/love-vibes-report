// Chaldean primitives for Love Match engine.
// Table is copied verbatim from the published astro-shine-scribe engine
// to guarantee cross-product consistency. Do not diverge.

const CHALDEAN_MAP: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

const VOWELS = ["A", "E", "I", "O", "U"];

export function getChaldeanValue(letter: string): number {
  return CHALDEAN_MAP[letter.toUpperCase()] || 0;
}

// preserveMaster=true keeps 11/22/33 for DISPLAY.
// Scoring always calls with preserveMaster=false to force a 1-9 planet.
export function reduceToSingleDigit(num: number, preserveMaster = true): number {
  if (preserveMaster && (num === 11 || num === 22 || num === 33)) return num;
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = num
      .toString()
      .split("")
      .reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return num;
}

// Full reduce with no master preservation (used before planet mapping).
export function reduceHard(num: number): number {
  while (num > 9) {
    num = num
      .toString()
      .split("")
      .reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return num;
}

export function nameValue(
  name: string,
  mode: "all" | "vowels" | "consonants" = "all",
): { compound: number; reduced: number } {
  const clean = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  let sum = 0;
  for (const ch of clean) {
    const isVowel = VOWELS.includes(ch);
    if (mode === "vowels" && !isVowel) continue;
    if (mode === "consonants" && isVowel) continue;
    sum += getChaldeanValue(ch);
  }
  return { compound: sum, reduced: reduceToSingleDigit(sum) };
}
