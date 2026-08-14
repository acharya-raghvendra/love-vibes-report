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
    emotional: "भावनात्मक बंधन",
    communication: "बातचीत",
    stability: "लंबे समय का साथ",
  },
};

const VERDICT_LABEL: Record<Lang, Record<Verdict, string>> = {
  en: { strong: "Strong", workable: "Workable", friction: "Friction" },
  hi: { strong: "मज़बूत", workable: "थोड़ा काम चाहिए", friction: "टकराव" },
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
        ? "बहुत अच्छा मेल — और एक पहलू तो अभी और गहरा हो सकता है"
        : "Strong match — and one side can go even deeper";
    }
    return lang === "hi"
      ? "बहुत अच्छा मेल — पर एक कमज़ोर कड़ी है"
      : "Strong match — but there's one weak spot";
  }
  if (score >= 55) {
    return lang === "hi"
      ? "नींव मज़बूत है, कुछ जगह टकराव है"
      : "Strong base, a few friction zones";
  }
  if (score >= 40) {
    return lang === "hi"
      ? "यहाँ काफ़ी कुछ समझने लायक है"
      : "There's a lot here worth understanding";
  }
  return lang === "hi"
    ? "चुनौतियाँ हैं — और उनके उपाय भी"
    : "There are challenges — and remedies for them";
}

export function scoreLine(score: number, lang: Lang): string {
  if (lang === "hi") {
    if (score >= 75) {
      return `${score}% का मतलब है बहुत कुछ आपके पक्ष में है — पर कौन सा एक पहलू आपको सँभालना है, वो आपकी 12-पेज रिपोर्ट में है।`;
    }
    if (score >= 55) {
      return `कुछ बातें आपके पक्ष में हैं और कुछ पर काम चाहिए — दोनों का पूरा सच आपकी 12-पेज रिपोर्ट में है।`;
    }
    if (score >= 40) {
      return `${score}% एक शुरुआत है, फ़ैसला नहीं — कौन सी बात रिश्ते को रोक रही है और वो कैसे ठीक होती है, ये रिपोर्ट में है।`;
    }
    return `${score}% बताता है कि मेहनत लगेगी — कहाँ लगेगी और कौन से उपाय चलेंगे, ये आपकी 12-पेज रिपोर्ट में दिया है।`;
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
    emotional: "भावनात्मक तार",
    communication: "बात करने के तरीके",
    stability: "लंबी योजना",
  };
  const areaEn: Record<PreviewDimension["key"], string> = {
    emotional: "emotional wiring",
    communication: "communication styles",
    stability: "long-term planning",
  };
  if (lang === "hi") {
    if (lowestVerdict === "friction") {
      return `आप दोनों के ${areaHi[lowestKey]} टकरा सकते हैं — पूरी रिपोर्ट में इसका हल दिया गया है।`;
    }
    if (lowestVerdict === "workable") {
      return `सबसे ज़्यादा काम आपके ${areaHi[lowestKey]} पर चाहिए — पूरी रिपोर्ट में इसका हल दिया गया है।`;
    }
    return `आपका सबसे कम मज़बूत पहलू (${areaHi[lowestKey]}) भी अच्छा है — रिपोर्ट बताएगी इसे और गहरा कैसे करें।`;
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
      "आप दोनों के अंकों के बीच एक चुंबक जैसा खिंचाव है — शुरुआत करने के लिए मेहनत नहीं करनी पड़ती। एक दूसरे का मूड आप जल्दी पकड़ लेते हैं, और साथ बिताया वक़्त सहज लगता है, निभाया हुआ नहीं। यही तीव्रता वजह है कि छोटी-छोटी बातें भी आप दोनों के बीच ज़्यादा गहरी चुभती हैं।",
    warm_spark:
      "आप दोनों के बीच एक गर्म, ठहरी हुई चिंगारी है — ऐसी जो घर को गरम रखती है, जलाती नहीं। एक दूसरे के साथ आप दिखावा नहीं करते, और रिश्ता हर मौसम के साथ और भरा-पूरा होता जाता है। इसे धमाके नहीं, ध्यान चाहिए।",
    slow_burn:
      "आपका जुड़ाव धीमी आँच वाला है। अंक कहते हैं कि इसकी गहराई वक़्त के साथ खुलती है, एक पल में नहीं — इसलिए शुरुआत आपकी उम्मीद से ज़्यादा शांत लग सकती है। एक बार भरोसा बन गया तो ये बहुत मज़बूती से टिकता है, पर शुरुआती दौर में दोनों को सब्र चाहिए।",
    opposites_tension:
      "आप दोनों के अंक आमने-सामने बैठे हैं, और यही वो जाना-पहचाना खिंचाव बनाता है — असली कशिश, असली टकराव, और असली बढ़ोतरी। जो एक सहज करता है, दूसरा उससे बचता है। ठीक सँभाला जाए तो यही संतुलन बन जाता है; वरना वही एक झगड़ा बार-बार लौटता है।",
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
    1: "आप मन की सुनकर आगे चलते हैं और किसी का नियंत्रण पसंद नहीं करते। फ़ैसले जल्दी लेते हैं, और एक बार रास्ता चुन लिया तो अकेले चल लेंगे पर धीरे नहीं चलेंगे। रिश्ते में यह हिफ़ाज़त करने वाला और साफ़ लगता है, पर साथी को लगता है उसे बाद में बताया गया। आपकी बढ़ोतरी है स्टीयरिंग साझा करने में।",
    2: "आप हालात से पहले लोगों को पढ़ लेते हैं। जीतने से ज़्यादा आपको शांति चाहिए, इसलिए आप जल्दी झुक जाते हैं — और अंदर हिसाब रखते जाते हैं। रिश्ते में भावनात्मक धागा आप ही पकड़ते हैं। आपका काम है असहज बात को नाराज़गी बनने से पहले कह देना।",
    3: "आप कह देते हैं, हँसा देते हैं, माहौल हल्का कर देते हैं। शब्द आपके पास आसानी से आते हैं और जहाँ लोग चुप होते हैं, वहाँ आप हँसी ले आते हैं। इससे रिश्ता ज़िंदा रहता है, पर भारी बात टल भी जाती है। जब आप गंभीर होते हैं, लोग आप पर पूरा भरोसा करते हैं।",
    4: "आप धीरे बनाते हैं और वादा निभाते हैं। रोज़ का ढर्रा आपके लिए ऊब नहीं, सुरक्षा है — प्यार आप भरोसे से दिखाते हैं, बातों से नहीं। साथी को हमेशा पता होता है आप कहाँ खड़े हैं। चुनौती है लचीलापन: योजना बदलना गड़बड़ होना नहीं है।",
    5: "आपको हलचल, बदलाव और साँस लेने की जगह चाहिए। बंधन आपको ख़तरा लगता है, इसलिए आप हर पिंजरे से बचते हैं — चाहे वो प्यार का ही हो। आप रिश्ते में नई ऊर्जा लाते हैं। आपका काम है यह दिखाना कि आज़ादी और वादा एक ही घर में रह सकते हैं।",
    6: "जिनसे प्यार करते हैं उनकी ज़िम्मेदारी आप बिना कहे उठा लेते हैं। घर, सेवा और फ़र्ज़ आपके अंदर गहरे हैं, और सबकी ज़रूरत आप पहले देख लेते हैं। इसी से आप रिश्ते का भावनात्मक केंद्र बनते हैं। ख़तरा है देते-देते ख़ुद को अनदेखा महसूस करने लगना।",
    7: "आप बात को समझने के लिए अंदर की तरफ़ जाते हैं। जैसे लोगों को साथ चाहिए, आपको एकांत चाहिए — भावना को दिखाने से ज़्यादा आप उसे समझना चाहते हैं। इससे आपके प्यार में एक दुर्लभ गहराई आती है। पर साथी आपकी चुप्पी को दूरी समझ सकता है, जबकि वो सोच होती है।",
    8: "आप नियंत्रण, नतीजे और आर्थिक सुरक्षा के लिए बने हैं। आप वही गिनते हैं जो असल में हुआ, और दूसरों का बोझ भी उठा लेते हैं। रिश्ते में आप सँभालने वाले और रणनीति बनाने वाले हैं। सीख यह है कि रिश्ता किसी प्रोजेक्ट की तरह चलाया नहीं जाता — उसे महसूस करना पड़ता है।",
    9: "आप चौड़ाई में महसूस करते हैं और जल्दी माफ़ कर देते हैं, कभी ज़रूरत से भी जल्दी। देना, सुधारना और बड़ी तस्वीर देखना आपकी आदत है — अपने ख़र्चे पर भी। रिश्ते में आप उदारता लाते हैं। बढ़ोतरी है ख़ुद को चुनना, बिना उसे स्वार्थ कहे।",
    11: "आप उतना महसूस करते हैं जितना समझा नहीं पाते। सूझ सबूत से पहले आ जाती है, और साथी का बदलाव आप उसके बोलने से पहले पकड़ लेते हैं। यह तोहफ़ा भी है और बोझ भी — वही एंटीना बेकार शोर भी पकड़ लेता है। आपका काम है ज़मीन पर टिकना, बंद हो जाना नहीं।",
    22: "आप ढाँचे और लंबी सोच में चलते हैं। जहाँ लोग सपना देखते हैं, आप चुपचाप उसका नक़्शा बना लेते हैं, और बहुत बोझ बिना शिकायत उठा लेते हैं। रिश्ते में आप ठहरे हुए और आगे देखने वाले हैं। ख़तरा है रिश्ते को भी एक और प्रोजेक्ट मान लेना।",
    33: "आप उस पैमाने पर देते हैं जो लोगों को स्वीकारना मुश्किल लगता है। देखभाल, सिखाना और भरना आपके लिए सहज है, और अक्सर पूरा माहौल आप ही सँभालते हैं। इससे आपके साथ रहना बहुत सुरक्षित लगता है। ख़तरा है दूसरों की ज़रूरतों में अपनी ज़रूरत की भाषा खो देना।",
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
    heading: lang === "hi" ? `${name} — लाइफ़ पाथ ${n}` : `${name} — Life Path ${n}`,
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
    { icon: "favorite", title: "पूरा केमिस्ट्री विश्लेषण", line: "आप एक दूसरे की तरफ़ क्यों खिंचते हैं — और वही खिंचाव कब गर्मी बन जाता है।" },
    { icon: "psychology", title: "डेस्टिनी नंबर का मेल", line: "आप दोनों के जीवन-लक्ष्य एक दिशा में हैं या चुपचाप आपस में लड़ते हैं।" },
    { icon: "self_improvement", title: "सोल अर्ज का तालमेल", line: "प्यार महसूस करने के लिए हर एक को अंदर से क्या चाहिए, साफ़ शब्दों में।" },
    { icon: "auto_stories", title: "पर्सनैलिटी नंबर का मिश्रण", line: "दुनिया आपको जोड़े के रूप में कैसे देखती है, और असल में आप क्या हैं।" },
    { icon: "route", title: "साथ की लाइफ़ पाथ यात्रा", line: "वो रास्ता जिस पर आप दोनों चल रहे हैं, और उसके मोड़।" },
    { icon: "cake", title: "बर्थडे नंबर की बातें", line: "हर जन्म-तिथि इस रिश्ते में क्या ख़ास जोड़ती है।" },
    { icon: "insights", title: "इस साल का अनुमान", line: "ये साल आप दोनों से क्या माँग रहा है, महीने दर महीने।" },
    { icon: "handshake", title: "बात करने का तरीक़ा", line: "मुश्किल बात कैसे कहें ताकि दूसरा सुन सके।" },
    { icon: "shield", title: "झगड़े सुलझाने का नक़्शा", line: "झगड़े किस बात पर होंगे और उन्हें कैसे ख़त्म करें।" },
    { icon: "diamond", title: "लंबे समय की तस्वीर", line: "पाँच और दस साल बाद ये रिश्ता कहाँ खड़ा होगा।" },
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
    reportMockTitle: "Your 12-page report",
    reportMockLine: "Personalised · PDF · instant delivery",
  },
  hi: {
    compatibility: "मेल",
    individualNumbers: "आप दोनों के अपने अंक",
    chemistry: "आपकी केमिस्ट्री",
    unlockMore: "आगे पढ़ने के लिए unlock करें",
    inFullReport: "आपकी पूरी रिपोर्ट में",
    couponPlaceholder: "कूपन कोड",
    apply: "लगाएँ",
    remove: "हटाएँ",
    couponApplied: "कूपन लग गया",
    introPrice: "सीमित समय की शुरुआती क़ीमत",
    oneTime: "एक बार का भुगतान। आपकी पूरी 12-पेज न्यूमेरोलॉजी रिपोर्ट तुरंत।",
    unlock: "रिपोर्ट unlock करें",
    unlockShort: "Unlock करें",
    opening: "चेकआउट खुल रहा है…",
    fullReport: "पूरी रिपोर्ट",
    save: "बचत",
    youSave: "आपकी बचत",
    off: "छूट",
    youShare: "आप दोनों में समान",
    errorTitle: "अभी सितारे पढ़े नहीं जा सके",
    errorBody: "कुछ पल बाद दोबारा कोशिश करें।",
    tryAgain: "दोबारा कोशिश करें",
    lockedLabel: "बंद है",
    reportMockTitle: "आपकी 12-पेज रिपोर्ट",
    reportMockLine: "आपके अंकों पर आधारित · PDF · तुरंत डिलीवरी",
  },
};

const SPECS: Record<Lang, string> = {
  en: "12-page personalized report · Hindi or English · delivered on WhatsApp + email within minutes.",
  hi: "12-पेज की आपके लिए बनी रिपोर्ट · हिंदी या अंग्रेज़ी · कुछ मिनटों में WhatsApp + ईमेल पर।",
};

const REFUND: Record<Lang, { line: string; label: string }> = {
  en: {
    line: "Reports are digital — once delivered, no refunds are issued.",
    label: "Refund Policy",
  },
  hi: {
    line: "रिपोर्ट डिजिटल है — डिलीवरी के बाद पैसे वापस नहीं होते।",
    label: "रिफ़ंड नीति",
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
