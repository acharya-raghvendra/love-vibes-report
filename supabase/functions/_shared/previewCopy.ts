// Server-side free-preview copy + derivation.
// Everything the free /preview page renders is produced here and returned by
// love-match-generate. No paid/locked prose is ever produced in this file.

import type { MatchResult } from "./engine/scorer.ts";

export type Lang = "en" | "hi";

export type Verdict = "strong" | "workable" | "friction";

export interface PreviewDimension {
  key: "emotional" | "communication" | "stability";
  name: string;
  locked: boolean;
  verdict?: Verdict;
  verdictLabel?: string;
}

export interface LifePathReading {
  name: string;
  number: number;
  heading: string;
  reading: string;
}

export interface LockedSection {
  icon: string;
  title: string;
  line: string;
}

export interface PreviewCopy {
  band_label: string;
  score_line: string;
  dimensions: PreviewDimension[];
  life_paths: LifePathReading[];
  chemistry: { visible: string };
  friction_line: string;
  locked_sections: LockedSection[];
  specs_line: string;
  refund_line: string;
  refund_link_label: string;
  headings: Record<string, string>;
}

// ---------- dimension derivation ----------

const DIM_PRIORITY: PreviewDimension["key"][] = ["emotional", "communication", "stability"];

const DIM_NAME: Record<Lang, Record<PreviewDimension["key"], string>> = {
  en: {
    emotional: "Emotional bond",
    communication: "Communication",
    stability: "Long-term stability",
  },
  hi: {
    emotional: "Emotional bond",
    communication: "Communication",
    stability: "Long-term stability",
  },
};

const VERDICT_LABEL: Record<Lang, Record<Verdict, string>> = {
  en: { strong: "Strong", workable: "Workable", friction: "Friction" },
  hi: { strong: "Majboot", workable: "Kaam chahiye", friction: "Friction" },
};

function verdictOf(points: number): Verdict {
  if (points >= 75) return "strong";
  if (points >= 50) return "workable";
  return "friction";
}

interface RawDim {
  key: PreviewDimension["key"];
  points: number;
  rank: number; // fixed priority index, used as the tie-breaker
}

function rawDimensions(r: MatchResult): RawDim[] {
  const pts = (k: string) => r.breakdown.find((b) => b.key === k)?.points ?? 0;
  const stability = Math.round(pts("lifePath") * 0.6 + pts("destiny") * 0.4);
  const list: RawDim[] = [
    { key: "emotional", points: pts("soulUrge"), rank: 0 },
    { key: "communication", points: pts("personality"), rank: 1 },
    { key: "stability", points: stability, rank: 2 },
  ];
  return list;
}

// Deterministic ordering: higher points first; equal points resolve by the
// fixed priority Emotional > Communication > Long-term, so the locked
// dimension never changes between renders or cache refreshes.
function ordered(dims: RawDim[]): RawDim[] {
  return [...dims].sort((a, b) => (b.points - a.points) || (a.rank - b.rank));
}

export function buildDimensions(r: MatchResult, lang: Lang) {
  const sorted = ordered(rawDimensions(r));
  const highest = sorted[0];
  const middle = sorted[1];
  const lowest = sorted[2];

  const visible = (d: RawDim): PreviewDimension => ({
    key: d.key,
    name: DIM_NAME[lang][d.key],
    locked: false,
    verdict: verdictOf(d.points),
    verdictLabel: VERDICT_LABEL[lang][verdictOf(d.points)],
  });

  // Render order stays the fixed priority order; only lock state differs.
  const byKey = new Map<PreviewDimension["key"], PreviewDimension>();
  byKey.set(highest.key, visible(highest));
  byKey.set(lowest.key, visible(lowest));
  byKey.set(middle.key, {
    key: middle.key,
    name: DIM_NAME[lang][middle.key],
    locked: true,
  });

  const dimensions = DIM_PRIORITY.map((k) => byKey.get(k)!);
  return { dimensions, lowest, highest };
}

// ---------- band framing ----------

export function bandLabel(score: number, lowestVerdict: Verdict, lang: Lang): string {
  if (score >= 75) {
    if (lowestVerdict === "strong") {
      return lang === "hi"
        ? "Strong match — par ek pehlu aur gehra ho sakta hai"
        : "Strong match — and one side can go even deeper";
    }
    return lang === "hi"
      ? "Strong match — par ek kamzori hai"
      : "Strong match — but there's one weak spot";
  }
  if (score >= 55) {
    return lang === "hi"
      ? "Strong base, kuch friction zones"
      : "Strong base, a few friction zones";
  }
  if (score >= 40) {
    return lang === "hi"
      ? "Kaafi kuch samajhna zaroori hai"
      : "There's a lot here worth understanding";
  }
  return lang === "hi"
    ? "Challenges hain — aur unke upay bhi"
    : "There are challenges — and remedies for them";
}

export function scoreLine(score: number, lang: Lang): string {
  if (lang === "hi") {
    if (score >= 75) {
      return `${score}% ka matlab hai bahut kuch aapke paksh me hai — par kaunsa ek pehlu aapko sambhalna hai, wo aapki 12-page report me hai.`;
    }
    if (score >= 55) {
      return `Kuch cheezein aapke paksh me hain, kuch par kaam chahiye — dono ka poora sach aapki 12-page report me.`;
    }
    if (score >= 40) {
      return `${score}% ek shuruaat hai, faisla nahi — kaunsi cheez rishte ko rok rahi hai aur kaise theek hoti hai, ye report me hai.`;
    }
    return `${score}% batata hai ki mehnat lagegi — kahan lagegi aur kaunse upay chalenge, ye aapki 12-page report me diya gaya hai.`;
  }
  if (score >= 75) {
    return `${score}% means a lot is working in your favour — the one side you still need to handle is in your 12-page report.`;
  }
  if (score >= 55) {
    return `Some things are working for you and some need work — the full truth of both is in your 12-page report.`;
  }
  if (score >= 40) {
    return `${score}% is a starting point, not a verdict — what is holding this back, and how it is fixed, is in the report.`;
  }
  return `${score}% says this takes effort — where that effort goes, and which remedies work, is in your 12-page report.`;
}

// ---------- friction line ----------

export function frictionLine(
  lowestKey: PreviewDimension["key"],
  lowestVerdict: Verdict,
  lang: Lang,
): string {
  const areaHi: Record<PreviewDimension["key"], string> = {
    emotional: "emotional taar",
    communication: "communication styles",
    stability: "long-term planning",
  };
  const areaEn: Record<PreviewDimension["key"], string> = {
    emotional: "emotional wiring",
    communication: "communication styles",
    stability: "long-term planning",
  };
  if (lang === "hi") {
    if (lowestVerdict === "friction") {
      return `Aap dono ke ${areaHi[lowestKey]} takra sakte hain — full report me iska solution diya gaya hai.`;
    }
    if (lowestVerdict === "workable") {
      return `Sabse zyada kaam aapke ${areaHi[lowestKey]} par chahiye — full report me iska solution diya gaya hai.`;
    }
    return `Aapka sabse kam strong pehlu (${areaHi[lowestKey]}) bhi accha hai — report batayegi ise aur gehra kaise karein.`;
  }
  if (lowestVerdict === "friction") {
    return `Your ${areaEn[lowestKey]} can clash — the full report gives you the fix.`;
  }
  if (lowestVerdict === "workable") {
    return `Your ${areaEn[lowestKey]} needs the most work — the full report gives you the fix.`;
  }
  return `Even your least strong side (${areaEn[lowestKey]}) is good — the report shows how to deepen it further.`;
}

// ---------- chemistry (first paragraph only) ----------

const CHEMISTRY: Record<Lang, Record<string, string>> = {
  en: {
    strong_pull:
      "There is a magnetic pull between your numbers — an attraction that does not need effort to start. You notice each other quickly, you read each other's mood faster than most couples do, and time together feels easy rather than negotiated. That same intensity is also why small disagreements land harder between you than they would elsewhere.",
    warm_spark:
      "A warm, steady spark lives between you — not the kind that burns everything down, but the kind that keeps a home warm. You enjoy each other's company without performing, and the bond tends to grow richer with every shared season. What it asks for is attention, not fireworks.",
    slow_burn:
      "Yours is a slow-burn resonance. The numbers say this bond reveals its depth over time rather than in a single moment, so the early phase can feel quieter than you expected. Once trust is set, it holds unusually well — but the first stretch needs patience from both of you.",
    opposites_tension:
      "Your charts sit on opposite sides, and that creates the classic opposites-attract pattern — real pull, real friction, and real growth. Each of you naturally does what the other avoids. Handled well that becomes balance; handled carelessly it becomes a repeating argument.",
  },
  hi: {
    strong_pull:
      "Aap dono ke numbers ke beech ek magnetic pull hai — attraction shuru karne ke liye mehnat nahi karni padti. Ek doosre ka mood aap jaldi pakad lete hain, aur saath ka waqt natural lagta hai. Yahi intensity wajah hai ki chhoti baatein bhi aap dono ke beech thodi zyada lagti hain.",
    warm_spark:
      "Aap dono ke beech ek warm, steady spark hai — aisi jo ghar ko garam rakhti hai, jalati nahi. Ek doosre ke saath aap dikhawa nahi karte, aur rishta har mausam ke saath aur gehra hota jaata hai. Ise dhamake nahi, dhyaan chahiye.",
    slow_burn:
      "Aapka bandhan slow-burn hai. Numbers kehte hain ki iski gehrai waqt ke saath khulti hai, ek pal me nahi — isliye shuruaat thodi shaant lag sakti hai. Ek baar bharosa ban gaya to ye bahut mazbooti se tikta hai, par shuruaati daur me dono ko sabr chahiye.",
    opposites_tension:
      "Aapke charts aamne-saamne hain — classic opposites-attract pattern. Kheech bhi asli hai, friction bhi. Jo ek karta hai, doosra usse bachta hai. Sahi sambhala jaaye to yahi balance ban jaata hai; warna wahi ek jhagda baar-baar lautta hai.",
  },
};

export function chemistryParagraph(level: string, lang: Lang): string {
  return CHEMISTRY[lang][level] ?? CHEMISTRY[lang].warm_spark;
}

// ---------- Life Path readings ----------

const LIFE_PATH: Record<Lang, Record<number, string>> = {
  en: {
    1: "You lead by instinct and dislike being managed. Decisions come fast, and once you have picked a direction you would rather go alone than go slow. In love that reads as protective and decisive, but a partner can feel consulted only after the fact. Your growth is in sharing the steering wheel, not the map.",
    2: "You read rooms and people before you read situations. Peace matters to you more than winning, so you bend early and often — and then quietly keep score. In a relationship you are the one who holds things together emotionally. Your work is saying the uncomfortable thing before it turns into resentment.",
    3: "You express, charm and lighten. Words come easily to you, and you use humour where others use silence. That keeps a relationship alive, but it can also become a way of skipping past the heavy conversation. When you let yourself be serious, people trust you completely.",
    4: "You build slowly and keep your promises. Routine is not boring to you, it is safety, and you show love through reliability rather than declarations. A partner always knows where you stand. Your challenge is flexibility — plans changing is not the same as things going wrong.",
    5: "You need movement, variety and room to breathe. Restriction reads as danger to you, so you resist anything that feels like a cage — even a loving one. You bring energy and novelty into a relationship. Your work is proving that freedom and commitment can live in the same house.",
    6: "You carry responsibility for the people you love, often before they ask. Home, care and duty run deep in you, and you notice what everyone needs. That makes you the emotional centre of a relationship. The risk is over-giving until you feel unseen and unpaid.",
    7: "You go inward to make sense of things. You need solitude the way others need company, and you would rather understand a feeling than perform it. This gives your love a rare depth. It also means a partner can read your quiet as distance when it is really thinking.",
    8: "You are wired for control, results and material security. You measure by what actually got done, and you carry weight that others hand to you. In love you are the provider and the strategist. Your lesson is that a relationship cannot be managed like a project — it has to be felt.",
    9: "You feel widely and forgive quickly, sometimes too quickly. Your instinct is to give, to fix and to see the larger picture, even at your own cost. In a relationship you bring generosity and perspective. Your growth is in choosing yourself without calling it selfishness.",
    11: "You feel more than you can explain. Intuition arrives before evidence does, and you sense shifts in a partner long before they speak. That sensitivity is a gift and a load — the same antenna picks up noise you do not need. Grounding, not shutting down, is your work.",
    22: "You think in structures and long horizons. Where others dream, you quietly work out how it would actually be built, and you can carry a lot of weight without complaining. In love you are steady and future-facing. The risk is treating the relationship as one more thing to construct.",
    33: "You give at a scale most people find hard to accept. Care, teaching and healing come naturally, and you are usually the one holding the room. That makes you deeply safe to love. The danger is disappearing into someone else's needs until yours have no language left.",
  },
  hi: {
    1: "Aap instinct se lead karte hain aur control kiya jaana pasand nahi karte. Faisle jaldi lete hain, aur ek baar raasta chun liya to akele chal lenge par dheere nahi chalenge. Rishte me ye protective aur decisive lagta hai, par partner ko lagta hai use baad me bataya gaya. Aapki growth steering share karne me hai.",
    2: "Aap logon ko situation se pehle padh lete hain. Jeetne se zyada shaanti chahiye, isliye aap jaldi jhuk jaate hain — aur andar hisaab rakhte jaate hain. Rishte me emotional dhaaga aap hi pakadte hain. Aapka kaam hai mushkil baat resentment banne se pehle keh dena.",
    3: "Aap express karte hain, halka kar dete hain. Shabd aapke paas aasani se aate hain aur jahan log chup hote hain wahan aap hansi le aate hain. Isse rishta zinda rehta hai, par bhaari baat tal bhi jaati hai. Jab aap serious hote hain, log aap par poora bharosa karte hain.",
    4: "Aap dheere banate hain aur vaada nibhate hain. Routine aapke liye boring nahi, suraksha hai — pyaar aap bharose se dikhate hain, baaton se nahi. Partner ko hamesha pata hota hai aap kahan khade hain. Chunauti hai lachak: plan badalna galat hona nahi hota.",
    5: "Aapko movement, variety aur saans lene ki jagah chahiye. Bandhan aapko khatra lagta hai, isliye aap har pinjre se bachte hain — chahe wo pyaar ka ho. Aap rishte me nayi energy laate hain. Aapka kaam hai dikhana ki azaadi aur commitment ek ghar me reh sakte hain.",
    6: "Jinse pyaar karte hain unki zimmedari aap bina kahe utha lete hain. Ghar, seva aur farz aapke andar gehre hain. Isi se aap rishte ka emotional centre bante hain. Khatra ye hai ki aap dete-dete khud ko andekha mehsoos karne lagte hain.",
    7: "Aap cheezon ko samajhne ke liye andar jaate hain. Jaise logon ko sangat chahiye, aapko ekaant chahiye — feeling dikhane se zyada use samajhna pasand hai. Isse aapke pyaar me ek gehrai aati hai. Par partner aapki chuppi ko doori samajh sakta hai.",
    8: "Aap control, result aur material security ke liye bane hain. Aap wahi ginte hain jo actually hua, aur doosron ka bojh bhi utha lete hain. Rishte me aap provider aur strategist hain. Seekh ye hai ki rishta project ki tarah manage nahi hota — use mehsoos karna padta hai.",
    9: "Aap chaudai me mehsoos karte hain aur jaldi maaf kar dete hain, kabhi zaroorat se bhi jaldi. Dena, sudharna aur badi tasveer dekhna aapki aadat hai — apne kharche par bhi. Rishte me aap udaarta laate hain. Growth hai khud ko chunna, bina use swarth kahe.",
    11: "Aap utna mehsoos karte hain jitna samjha nahi paate. Intuition sabooton se pehle aa jaata hai, aur partner ka badlav aap unke bolne se pehle pakad lete hain. Ye tohfa bhi hai aur bojh bhi. Aapka kaam hai grounded hona, band ho jaana nahi.",
    22: "Aap structure aur lambi soch me chalte hain. Jahan log sapna dekhte hain, aap chupchaap uska naksha bana lete hain, aur bahut bojh bina shikayat utha lete hain. Rishte me aap sthir aur future-facing hain. Khatra hai rishte ko bhi ek aur project maan lena.",
    33: "Aap us paimane par dete hain jo logon ko sweekaarna mushkil lagta hai. Care, sikhana aur healing sahaj hai, aur aksar poora kamra aap hi sambhalte hain. Isse aap bahut surakshit lagte hain. Khatra hai doosron ki zarooraton me apni zaroorat kho dena.",
  },
};

export function lifePathReadings(
  r: MatchResult,
  names: { a: string; b: string },
  lang: Lang,
): LifePathReading[] {
  const one = (name: string, n: number): LifePathReading => ({
    name,
    number: n,
    heading: `${name} — Life Path ${n}`,
    reading: LIFE_PATH[lang][n] ?? LIFE_PATH[lang][reduceForCopy(n)],
  });
  return [one(names.a, r.a.lifePath.display), one(names.b, r.b.lifePath.display)];
}

function reduceForCopy(n: number): number {
  let x = n;
  while (x > 9) x = String(x).split("").reduce((s, d) => s + Number(d), 0);
  return x || 1;
}

// ---------- locked sections ----------

const LOCKED: Record<Lang, LockedSection[]> = {
  en: [
    { icon: "favorite", title: "Full Chemistry Breakdown", line: "Why you pull towards each other — and where that same pull turns into heat." },
    { icon: "psychology", title: "Destiny Number Compatibility", line: "Whether your life goals point the same way or quietly compete." },
    { icon: "self_improvement", title: "Soul Urge Alignment", line: "What each of you secretly needs to feel loved, in plain words." },
    { icon: "auto_stories", title: "Personality Number Blend", line: "How the world sees you as a couple versus how you actually are." },
    { icon: "route", title: "Life Path Journey Together", line: "The road you two are walking, and the turns it takes." },
    { icon: "cake", title: "Birthday Number Insights", line: "The personal gift each birth date adds to this relationship." },
    { icon: "insights", title: "Personal Year Forecast", line: "What this year asks from each of you, month by month." },
    { icon: "handshake", title: "Communication Style Guide", line: "Exactly how to say hard things so the other one can hear them." },
    { icon: "shield", title: "Conflict Resolution Map", line: "What your fights will be about, and how to end them." },
    { icon: "diamond", title: "Long-term Cosmic Outlook", line: "Where this bond stands five and ten years from now." },
  ],
  hi: [
    { icon: "favorite", title: "Poora Chemistry Breakdown", line: "Aap ek doosre ki taraf kyon khinchte hain — aur wahi kheech kab garmi ban jaati hai." },
    { icon: "psychology", title: "Destiny Number Compatibility", line: "Aap dono ke life goals ek disha me hain ya chupchaap ladte hain." },
    { icon: "self_improvement", title: "Soul Urge Alignment", line: "Pyaar mehsoos karne ke liye har ek ko andar se kya chahiye, saaf shabdon me." },
    { icon: "auto_stories", title: "Personality Number Blend", line: "Duniya aapko couple ke roop me kaise dekhti hai, aur asli me aap kya hain." },
    { icon: "route", title: "Life Path Journey Together", line: "Wo raasta jispar aap dono chal rahe hain, aur uske mod." },
    { icon: "cake", title: "Birthday Number Insights", line: "Har janm-tithi is rishte me kya khaas jodti hai." },
    { icon: "insights", title: "Personal Year Forecast", line: "Ye saal aap dono se kya maang raha hai, mahine dar mahine." },
    { icon: "handshake", title: "Communication Style Guide", line: "Mushkil baat kaise kahein taaki doosra sun sake." },
    { icon: "shield", title: "Conflict Resolution Map", line: "Jhagde kis baat par honge aur unhe kaise suljhaya jaye." },
    { icon: "diamond", title: "Long-term Cosmic Outlook", line: "Paanch aur das saal baad ye rishta kahan khada hoga." },
  ],
};

// ---------- headings + misc ----------

const HEADINGS: Record<Lang, Record<string, string>> = {
  en: {
    compatibility: "Compatibility",
    individualNumbers: "Your Individual Numbers",
    chemistry: "Your Chemistry",
    unlockMore: "Unlock to read the rest",
    inFullReport: "In Your Full Report",
    couponPlaceholder: "Coupon code",
    apply: "Apply",
    remove: "Remove",
    couponApplied: "Coupon applied",
    introPrice: "Limited introductory price",
    oneTime: "One-time payment. Instant access to your full 12-page numerology compatibility report.",
    unlock: "Unlock Full Report",
    unlockShort: "Unlock",
    opening: "Opening checkout…",
    fullReport: "Full Report",
    save: "Save",
    youSave: "You save",
    off: "off",
    youShare: "You share",
    errorTitle: "We couldn't read the stars just now",
    errorBody: "Please try again in a moment.",
    tryAgain: "Try again",
    lockedLabel: "Locked",
  },
  hi: {
    compatibility: "Compatibility",
    individualNumbers: "Aap Dono Ke Apne Numbers",
    chemistry: "Aapki Chemistry",
    unlockMore: "Aage padhne ke liye unlock karein",
    inFullReport: "Aapki Poori Report Me",
    couponPlaceholder: "Coupon code",
    apply: "Lagayein",
    remove: "Hatayein",
    couponApplied: "Coupon lag gaya",
    introPrice: "Seemit introductory price",
    oneTime: "Ek baar ka payment. Aapki poori 12-page numerology compatibility report turant.",
    unlock: "Poori Report Unlock Karein",
    unlockShort: "Unlock",
    opening: "Checkout khul raha hai…",
    fullReport: "Poori Report",
    save: "Bachat",
    youSave: "Aap bachate hain",
    off: "off",
    youShare: "Aap dono me common",
    errorTitle: "Abhi sitare padh nahi paaye",
    errorBody: "Kripya thodi der baad phir koshish karein.",
    tryAgain: "Phir koshish karein",
    lockedLabel: "Locked",
  },
};

const SPECS: Record<Lang, string> = {
  en: "12-page personalized report · Hindi or English · delivered on WhatsApp + email within minutes.",
  hi: "12-page personalized report · Hindi ya English · WhatsApp + email par delivery within minutes.",
};

const REFUND: Record<Lang, { line: string; label: string }> = {
  en: {
    line: "Reports are digital — once delivered, no refunds are issued.",
    label: "Refund Policy",
  },
  hi: {
    line: "Report digital hai — delivery ke baad refund nahi milta.",
    label: "Refund Policy",
  },
};

export function buildPreviewCopy(
  r: MatchResult,
  names: { a: string; b: string },
  chemistryLevel: string,
  langRaw: string,
): PreviewCopy {
  const lang: Lang = langRaw === "en" ? "en" : "hi";
  const { dimensions, lowest } = buildDimensions(r, lang);
  const lowestVerdict = verdictOf(lowest.points);
  return {
    band_label: bandLabel(r.score, lowestVerdict, lang),
    score_line: scoreLine(r.score, lang),
    dimensions,
    life_paths: lifePathReadings(r, names, lang),
    chemistry: { visible: chemistryParagraph(chemistryLevel, lang) },
    friction_line: frictionLine(lowest.key, lowestVerdict, lang),
    locked_sections: LOCKED[lang],
    specs_line: SPECS[lang],
    refund_line: REFUND[lang].line,
    refund_link_label: REFUND[lang].label,
    headings: HEADINGS[lang],
  };
}
