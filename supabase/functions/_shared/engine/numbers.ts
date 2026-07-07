// Deterministic core-number computation for one person.
// The LLM never computes these; it only writes prose from them.
//
// NAMING (locked, to avoid the collision in the old repo):
//   lifePath      = from DOB, component-separate reduction   -> weight 30
//   destiny       = full-name Chaldean (old repo: "Expression") -> weight 20
//   soulUrge      = vowels only                              -> weight 30
//   personality   = consonants only                          -> weight 20

import { nameValue, reduceHard, reduceToSingleDigit } from "./chaldean.ts";

export interface CoreNumbers {
  lifePath: NumberFact;
  destiny: NumberFact;
  soulUrge: NumberFact;
  personality: NumberFact;
  maturity: NumberFact;
  personalYear: number; // always 1-9
}

export interface NumberFact {
  compound: number; // e.g. 19  (for "19/1" prose)
  display: number; // 1-9, or 11/22/33 if master (for prose)
  score: number; // 1-9 ALWAYS (feeds planet mapping)
  isMaster: boolean;
}

function fact(compound: number): NumberFact {
  const display = reduceToSingleDigit(compound, true); // may be 11/22/33
  const isMaster = display === 11 || display === 22 || display === 33;
  const score = reduceHard(compound); // true 1-9, never halts at a master
  return { compound, display, score, isMaster };
}

// Component-separate Life Path: reduce month, day, year each, then sum, then reduce.
// This is the standard method and avoids fabricating master numbers from
// a single flat digit sum.
export function calcLifePath(dob: string): NumberFact {
  const [y, m, d] = dob.split("-").map((p) => parseInt(p, 10));
  const rm = reduceHard(m);
  const rd = reduceHard(d);
  const ry = reduceHard(y);
  const total = rm + rd + ry;
  return fact(total);
}

export function calcDestiny(fullName: string): NumberFact {
  return fact(nameValue(fullName, "all").compound);
}

export function calcSoulUrge(fullName: string): NumberFact {
  return fact(nameValue(fullName, "vowels").compound);
}

export function calcPersonality(fullName: string): NumberFact {
  return fact(nameValue(fullName, "consonants").compound);
}

// Maturity = Life Path + Destiny, reduced. Shows how energy settles with age.
export function calcMaturity(lifePath: NumberFact, destiny: NumberFact): NumberFact {
  return fact(lifePath.score + destiny.score);
}

// Personal Year = birth month + birth day + current calendar year, reduced 1-9.
export function calcPersonalYear(dob: string, refYear: number): number {
  const [, m, d] = dob.split("-").map((p) => parseInt(p, 10));
  const rm = reduceHard(m);
  const rd = reduceHard(d);
  const ry = reduceHard(refYear);
  return reduceHard(rm + rd + ry);
}

export function computeCore(
  firstName: string,
  lastName: string,
  dob: string,
  refYear: number,
): CoreNumbers {
  const fullName = `${firstName} ${lastName}`.trim();
  const lifePath = calcLifePath(dob);
  const destiny = calcDestiny(fullName);
  const soulUrge = calcSoulUrge(fullName);
  const personality = calcPersonality(fullName);
  const maturity = calcMaturity(lifePath, destiny);
  const personalYear = calcPersonalYear(dob, refYear);
  return { lifePath, destiny, soulUrge, personality, maturity, personalYear };
}
