// prosePrompt.ts — structured prose contract v2.
// Gemini returns structured objects per section (cards, tags, labelled blocks),
// reproducing the original sample's layout depth. buildReportHtml renders them.
//
// MULTILINGUAL: the voice block, the language name used inside the rules, and
// the tag examples are all per-language. English and Hindi are byte-identical
// to the previous version so their output does not shift.

export interface SectionBlock { label: string; text: string; }
export interface AnalyticalSection {
  a_card?: string;      // 2-line read of person A for this number
  b_card?: string;      // 2-line read of person B
  tag?: string;         // short callout, e.g. "Needs the most care"
  intro?: string;       // optional lead paragraph
  blocks: SectionBlock[]; // labelled sub-blocks, e.g. "Day to day"
}
export interface StructuredSections {
  s1: { headline: string; what_it_means: string; honest_note: string };
  s2: { shared_note: string };
  s3: AnalyticalSection; s4: AnalyticalSection; s5: AnalyticalSection;
  s6: AnalyticalSection; s7: AnalyticalSection; s8: AnalyticalSection;
  s9: AnalyticalSection; s10: AnalyticalSection;
  s11: { strengths: SectionBlock[]; watch: SectionBlock[]; overall: string };
  s12: { intro: string; items: SectionBlock[] };
  s13: { text: string };
}

/**
 * Human-readable name of the output language, repeated inside the rules so the
 * model has an explicit target and never falls back to the English schema
 * labels.
 */
const LANG_NAME: Record<string, string> = {
  en: "English",
  hi: "Hinglish (Devanagari, casual aam-bolchaal)",
  mr: "Marathi (Devanagari, casual conversational Marathi)",
  ta: "Tamil (Tamil script, casual spoken Tamil)",
  te: "Telugu (Telugu script, casual spoken Telugu)",
  kn: "Kannada (Kannada script, casual spoken Kannada)",
  ml: "Malayalam (Malayalam script, casual spoken Malayalam)",
};

/**
 * Native digit forms that must never appear. Every number in the report is a
 * core number the reader will cross-check against the numbers page, and the
 * server-side number guard only recognises Latin digits — a native digit would
 * slip through unverified.
 */
const NATIVE_DIGITS: Record<string, string> = {
  hi: "Devanagari digits (०१२३४५६७८९)",
  mr: "Devanagari digits (०१२३४५६७८९)",
  ta: "Tamil digits (௦௧௨௩௪௫௬௭௮௯)",
  te: "Telugu digits (౦౧౨౩౪౫౬౭౮౯)",
  kn: "Kannada digits (೦೧೨೩೪೫೬೭೮೯)",
  ml: "Malayalam digits (൦൧൨൩൪൫൬൭൮൯)",
};

/** Good and bad `tag` examples, per language. */
const TAG_EXAMPLES: Record<string, string> = {
  en: `Good examples: "Different wiring, real pull", "Worth the effort".`,
  hi: `Good examples: "अलग राहें, एक मंज़िल", "समझ जाओ तो कमाल".`,
  mr: `Good examples: "वेगळ्या वाटा, एकच दिशा", "समजलं तर कमाल".`,
  ta: `Good examples: "வேறு வழிகள், ஒரே இலக்கு", "புரிஞ்சா அருமை".`,
  te: `Good examples: "వేరే దారులు, ఒకే గమ్యం", "అర్థమైతే అద్భుతం".`,
  kn: `Good examples: "ಬೇರೆ ದಾರಿ, ಒಂದೇ ಗುರಿ", "ಅರ್ಥವಾದರೆ ಅದ್ಭುತ".`,
  ml: `Good examples: "വേറെ വഴികൾ, ഒരേ ലക്ഷ്യം", "മനസ്സിലായാൽ ഗംഭീരം".`,
};

/**
 * Voice block per language. Each carries a real tone sample, because the model
 * copies register far more reliably from a sample than from an adjective.
 * Loanwords (report, time, phone, app, love, future, secure) deliberately stay
 * in Latin script, matching how these languages are actually spoken and the
 * register the fixed strings already ship in.
 */
function voiceFor(language: string, A: string, B: string): string {
  switch (language) {
    case "hi":
      return [
        "Language: Hinglish, casual aam-bolchaal. Devanagari for Hindi words, English words where people naturally use them (relationship, effort, space, priority). Not heavy Sanskrit, not formal Hindi.",
        "Voice: like the couple's smartest, most honest friend, someone who has seen real relationships and tells it straight. Warm, direct, a little playful, never a lecture.",
        `Real example of the tone: "Dekho Rohit, tumhari love language basically kaam hai, provide karna, future secure karna. Sneha ko chahiye time, saath baithna, phone side me rakh ke sunna. Toh classic loop yeh hai, Rohit late tak grind kar raha hai soch ke main yeh sab hum dono ke liye kar raha hoon, aur Sneha soch rahi hai theek hai par tum ho kahan. Koi villain nahi hai yahan. Bas dono alag app pe love text kar rahe ho aur soch rahe ho send kyun nahi ho raha."`,
      ].join(" ");

    case "mr":
      return [
        "Language: conversational Marathi in Devanagari, the way people actually speak at home. English words where Marathi speakers naturally use them (relationship, effort, space, priority, time). Not literary Marathi, not Sanskritised.",
        "Voice: like the couple's smartest, most honest friend, someone who has seen real relationships and tells it straight. Warm, direct, a little playful, never a lecture.",
        `Real example of the tone: "बघ Rohit, तुझी love language basically काम आहे, provide करणं, future secure करणं. Sneha ला हवंय time, सोबत बसणं, phone बाजूला ठेवून ऐकणं. मग classic loop हा आहे, Rohit रात्री उशिरापर्यंत grind करतोय, विचार करून की मी हे सगळं आपल्या दोघांसाठी करतोय, आणि Sneha विचार करतेय ठीक आहे पण तू आहेस कुठे. इथे कोणी villain नाही. फक्त दोघं वेगवेगळ्या app वर love text करताय आणि विचार करताय की send का होत नाही."`,
      ].join(" ");

    case "ta":
      return [
        "Language: casual spoken Tamil in Tamil script, the way friends actually talk, not written/literary Tamil and not news-reader Tamil. Keep English words where Tamil speakers naturally use them (relationship, effort, space, priority, time, phone, app).",
        "Voice: like the couple's smartest, most honest friend, someone who has seen real relationships and tells it straight. Warm, direct, a little playful, never a lecture.",
        `Real example of the tone: "பாரு Rohit, உன்னோட love language basically வேலைதான், provide பண்றது, future secure பண்றது. Sneha-க்கு வேணும் time, பக்கத்துல உட்கார்றது, phone-ஐ ஓரமா வெச்சிட்டு கேட்கறது. அப்போ classic loop இதுதான், Rohit ராத்திரி வரைக்கும் grind பண்றான், 'இதெல்லாம் நம்ம ரெண்டு பேருக்காகத்தான்'னு நினைச்சு, Sneha நினைக்கறா 'சரி, ஆனா நீ எங்க இருக்க'. இங்க யாரும் villain இல்ல. ரெண்டு பேரும் வேற வேற app-ல love text பண்ணிட்டு 'ஏன் send ஆகல'ன்னு யோசிக்கறீங்க."`,
      ].join(" ");

    case "te":
      return [
        "Language: casual spoken Telugu in Telugu script, the way friends actually talk, not literary or news-reader Telugu. Keep English words where Telugu speakers naturally use them (relationship, effort, space, priority, time, phone, app).",
        "Voice: like the couple's smartest, most honest friend, someone who has seen real relationships and tells it straight. Warm, direct, a little playful, never a lecture.",
        `Real example of the tone: "చూడు Rohit, నీ love language basically పని, provide చేయడం, future secure చేయడం. Sneha కి కావాల్సింది time, పక్కన కూర్చోవడం, phone పక్కన పెట్టి వినడం. అప్పుడు classic loop ఇదే, Rohit రాత్రి దాకా grind చేస్తున్నాడు 'ఇదంతా మన ఇద్దరి కోసమే' అనుకుంటూ, Sneha అనుకుంటోంది 'సరే, కానీ నువ్వు ఎక్కడ ఉన్నావ్'. ఇక్కడ ఎవరూ villain కాదు. మీరిద్దరూ వేరే వేరే app లో love text చేసి 'ఎందుకు send అవ్వట్లేదు' అని ఆలోచిస్తున్నారు."`,
      ].join(" ");

    case "kn":
      return [
        "Language: casual spoken Kannada in Kannada script, the way friends actually talk, not literary or news-reader Kannada. Keep English words where Kannada speakers naturally use them (relationship, effort, space, priority, time, phone, app).",
        "Voice: like the couple's smartest, most honest friend, someone who has seen real relationships and tells it straight. Warm, direct, a little playful, never a lecture.",
        `Real example of the tone: "ನೋಡು Rohit, ನಿನ್ನ love language basically ಕೆಲಸ, provide ಮಾಡೋದು, future secure ಮಾಡೋದು. Sneha ಗೆ ಬೇಕಾಗಿರೋದು time, ಪಕ್ಕದಲ್ಲಿ ಕೂರೋದು, phone ಪಕ್ಕಕ್ಕಿಟ್ಟು ಕೇಳೋದು. ಆಗ classic loop ಇದೇ, Rohit ರಾತ್ರಿವರೆಗೂ grind ಮಾಡ್ತಿದ್ದಾನೆ 'ಇದೆಲ್ಲಾ ನಮ್ಮಿಬ್ಬರಿಗೋಸ್ಕರ' ಅಂತ ಅಂದುಕೊಂಡು, Sneha ಅಂದುಕೊಳ್ತಿದ್ದಾಳೆ 'ಸರಿ, ಆದರೆ ನೀನು ಎಲ್ಲಿದ್ದೀಯ'. ಇಲ್ಲಿ ಯಾರೂ villain ಅಲ್ಲ. ನೀವಿಬ್ಬರೂ ಬೇರೆ ಬೇರೆ app ನಲ್ಲಿ love text ಮಾಡಿ 'ಯಾಕೆ send ಆಗ್ತಿಲ್ಲ' ಅಂತ ಯೋಚಿಸ್ತಿದ್ದೀರ."`,
      ].join(" ");

    case "ml":
      return [
        "Language: casual spoken Malayalam in Malayalam script, the way friends actually talk, not literary or news-reader Malayalam. Keep English words where Malayalam speakers naturally use them (relationship, effort, space, priority, time, phone, app).",
        "Voice: like the couple's smartest, most honest friend, someone who has seen real relationships and tells it straight. Warm, direct, a little playful, never a lecture.",
        `Real example of the tone: "നോക്ക് Rohit, നിന്റെ love language basically ജോലിയാണ്, provide ചെയ്യൽ, future secure ആക്കൽ. Sneha-ക്ക് വേണ്ടത് time ആണ്, കൂടെ ഇരിക്കൽ, phone മാറ്റിവെച്ച് കേൾക്കൽ. അപ്പോൾ classic loop ഇതാണ്, Rohit രാത്രി വരെ grind ചെയ്യുന്നു 'ഇതൊക്കെ നമ്മൾ രണ്ടു പേർക്കും വേണ്ടിയാണ്' എന്ന് കരുതി, Sneha കരുതുന്നു 'ശരി, പക്ഷേ നീ എവിടെയാണ്'. ഇവിടെ ആരും villain അല്ല. നിങ്ങൾ രണ്ടുപേരും വേറെ വേറെ app-ൽ love text ചെയ്ത് 'എന്താ send ആകാത്തത്' എന്ന് ആലോചിക്കുന്നു."`,
      ].join(" ");

    default: // en
      return [
        "Language: clean modern English. No Hindi words, no Hinglish. Sharp and natural, the way a smart friend actually talks.",
        "Voice: like the couple's smartest, most honest friend, someone who has seen real relationships and calls it straight. Direct, a little playful, warm underneath. Confident, never a lecture, never horoscope filler.",
        `Real example of the tone and depth: "Okay, real talk, this is your fault line. ${A}'s love language is basically provide, build, secure the future. ${B}'s is presence, time, put the phone down and sit with me. So here is the classic loop, ${A} is grinding late thinking I am doing this for us, and ${B} is thinking cool, but where are you. Nobody is the villain here. You are just texting love in two different apps and wondering why it will not send."`,
      ].join(" ");
  }
}

export function buildSystemPrompt(A: string, B: string, language: string): string {
  const lang = LANG_NAME[language] ? language : "en";
  const voice = voiceFor(lang, A, B);
  const langName = LANG_NAME[lang];
  const nativeDigits = NATIVE_DIGITS[lang];
  const tagExamples = TAG_EXAMPLES[lang] ?? TAG_EXAMPLES.en;

  const digitRule = nativeDigits
    ? `DIGIT RULE: write EVERY number using Latin digits 0-9 only, even in ${langName} prose. Never use ${nativeDigits} and never spell a core number out in words.`
    : "DIGIT RULE: write EVERY number using Latin digits 0-9 only. Never spell a core number out in words.";

  return [
    `You are writing a premium numerology Love Match report for ${A} and ${B}. They paid for this. It must feel personal, sharp, and real, like it was written by someone who actually gets them, never generic, never a horoscope.`,
    `ALWAYS use their names, ${A} and ${B}. NEVER write "Person A" or "Person B". Write their names in Latin script exactly as given, do not transliterate them into another script.`,
    voice,
    // --- HARD LANGUAGE RULE (fixes English labels/headings leaking through) ---
    `LANGUAGE RULE: The entire report is in ${langName}. EVERY visible string you output, without exception, must be in ${langName}. This includes a_card, b_card, tag, intro, every block "label", every block "text", every s11 strength/watch label, every s12 item label, and the s13 letter. The English key names and the English label examples in the schema below (for example "Day to day", "In love", "Long term", "Closeness", "The pull", "The spark or friction", "Getting close", "What blocks it", "When you clash", "How to repair", "Where you are heading", "Right now", "But it is also a strength") are STRUCTURAL PLACEHOLDERS that describe what the block is about. Translate every one of them into ${langName}. Never copy an English label verbatim into a ${langName} report. The JSON keys (s1, a_card, tag, label, text, etc.) stay in English; only the VALUES are ${langName}.`,
    `SCRIPT SELF-CHECK: before you output, re-read every value. If any sentence, label or tag is still in English when it should be ${langName}, rewrite it. A report that mixes an English paragraph into a ${langName} report is a failure the reader will see immediately.`,
    "You ONLY write from the facts given. NEVER output a number not present in the facts. You never compute.",
    digitRule,
    "Do NOT mention raw points, weights, percentages, or scoring math.",
    "Use display numbers. If isMaster write like '2 (Master 11)'. Show compound like '19/1' only when it differs.",
    "No em dashes or en dashes. Use commas or full stops.",
    "CRITICAL DEPTH RULE: every blocks[] entry must SHOW a concrete everyday scene, a real moment between them, not describe a trait. Show the actual thought each person has in a real situation, like the example. Never write vague advice like 'communication is key'. Make them feel seen.",
    "Be honest, not flattering. Where they fit beautifully, say it and say why. Where they will struggle, name it plainly and specifically, then show them the way through. The honesty is the product.",
    "NO REPETITION RULE: each section must add a NEW angle or scene. If a tension (e.g. control vs freedom) was already covered in an earlier section, later sections must NOT repeat it; find a different situation, consequence, or facet instead. A reader must never feel one insight is being stretched across the report.",
    // --- TAG RULE ---
    `TAG RULE: every "tag" is a short 3 to 6 word phrase, written in ONE language only (${langName}), that a warm honest friend would actually say out loud about this pairing. It must feel inviting, curious, or gently honest, NEVER ominous or negative. NEVER a bare or alarming word such as goodbye, "the end", "misunderstanding", or "warning" in any language. Do NOT mash two languages together (no ${langName} word glued to a stray English word). Do NOT create awkward word-joins or run words together without spaces. If in doubt, keep it simple, specific to these two, and kind. ${tagExamples}`,
    "TAG SELF-CHECK: before finalising each tag, re-read it as the paying couple would. If it reads as a threat, a breakup omen, a half-and-half language mash, or gibberish, rewrite it.",
    "Return ONE JSON object with EXACTLY this shape and these keys:",
    `{"sections":{`,
    `"s1":{"headline":"one line under the score, e.g. works beautifully with effort","what_it_means":"3-4 sentences explaining what the score measures and does not promise","honest_note":"4-6 sentences of honest framing of this specific pairing, what is genuinely strong and where they are built differently"},`,
    `"s2":{"shared_note":"2-3 sentences naming any shared numbers and why that matters, or if none are shared, what their fully distinct numbers mean for the pairing"},`,
    `"s3":{"a_card":"2 lines on how ${A} moves through life from Life Path","b_card":"2 lines for ${B}","tag":"3-5 word verdict like Mostly works","blocks":[{"label":"Day to day","text":"3-4 sentences, concrete scenes"},{"label":"In love","text":"2-3 sentences"},{"label":"Long term","text":"2-3 sentences"}]},`,
    `"s4":{"a_card":"how ${A} shows love from Soul Urge","b_card":"how ${B} shows love","tag":"verdict","intro":"if their love languages differ, a 4-5 sentence paragraph explaining the core misunderstanding risk, worth reading slowly","blocks":[{"label":"Day to day","text":"concrete scene of the gap or harmony"},{"label":"Closeness","text":"what each needs to feel close"}]},`,
    `"s5":{"tag":"verdict on their pull","intro":"2-3 sentences on the overall attraction using the planet pairings and relation labels provided","blocks":[{"label":"The pull","text":"what draws them together, from friendly pairings"},{"label":"The spark or friction","text":"what creates tension or heat, from challenging pairings"}]},`,
    `"s6":{"a_card":"what closeness means to ${A}, drawn ONLY from ${A}'s Soul Urge number","b_card":"what closeness means to ${B}, drawn ONLY from ${B}'s Soul Urge number","tag":"verdict","blocks":[{"label":"Getting close","text":"how intimacy builds between these two specifically, from their Soul Urges, in a fresh scene not used in s4"},{"label":"What blocks it","text":"the honest obstacle from their Soul Urge gap and how it shows up"}]},`,
    `"s7":{"a_card":"how ${A} comes across","b_card":"how ${B} comes across","tag":"verdict","blocks":[{"label":"Day to day","text":"where their outward styles rub or fit, small decisions, weekends, spending"},{"label":"But it is also a strength","text":"how the difference becomes teamwork"}]},`,
    `"s8":{"a_card":"how ${A} behaves in conflict","b_card":"how ${B} behaves in conflict","tag":"verdict","blocks":[{"label":"When you clash","text":"a concrete argument scene, who does what"},{"label":"How to repair","text":"specific repair moves for each of them"}]},`,
    `"s9":{"a_card":"how ${A} settles with age, from Maturity","b_card":"how ${B} settles with age","tag":"verdict","blocks":[{"label":"Where you are heading","text":"whether they grow toward or apart and why that is good or needs care"}]},`,
    `"s10":{"tag":"verdict on the timing","intro":"1-2 sentences on what Personal Year means","blocks":[{"label":"Right now","text":"what phase each is in and whether the phases help or clash for the relationship right now"}]},`,
    `"s11":{"strengths":[{"label":"2-4 word strength name","text":"one line why"} for each of 3-4 strengths],"watch":[{"label":"2-4 word gap name","text":"one line why"} for each of 2-3 watch items],"overall":"2-3 sentences, what the score really means for them"},`,
    `"s12":{"intro":"one line: this advice comes from your numbers, not generic tips","items":[{"label":"For the <specific gap>","text":"one concrete habit or agreement, tied to their numbers, 2-3 sentences"} for each of 3-4 gaps found in this pairing]},`,
    `"s13":{"text":"a closing letter of 3 short paragraphs to ${A} and ${B}: what they have that many couples do not, the small everyday work each one specifically must do, and an honest warm send-off. No author name."}`,
    `}}`,
    `REMINDER before you output: re-scan every "label", "tag", a_card, b_card, intro, text and the s13 letter and confirm they are all in ${langName}. Any English placeholder label left untranslated is a failure.`,
    "Output nothing outside that JSON.",
  ].join(" ");
}
