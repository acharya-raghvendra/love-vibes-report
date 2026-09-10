// reportStrings.ts — every fixed (non-LLM) string in the Love Match PDF,
// in all supported report languages.
//
// Replaces SECTION_TITLES_EN / SECTION_TITLES_HI and every inline
// `hi ? "..." : "..."` ternary in buildReportHtml.ts.
//
// Rule: LLM prose is never in here. Only headings, labels, cover, upsell,
// disclaimer and sign-off. Loanwords (report, score, compatibility, strengths,
// Life Path) deliberately stay in Latin script in every language, matching the
// conversational register the Hindi report already ships with.

export type ReportLang = "en" | "hi" | "mr" | "ta" | "te" | "kn" | "ml";

export const REPORT_LANGS: ReportLang[] = ["en", "hi", "mr", "ta", "te", "kn", "ml"];

/** Script family. Drives the @font-face + line-height block in buildReportHtml. */
export const LANG_SCRIPT: Record<ReportLang, string> = {
  en: "latin",
  hi: "devanagari",
  mr: "devanagari",
  ta: "tamil",
  te: "telugu",
  kn: "kannada",
  ml: "malayalam",
};

export interface ReportStrings {
  htmlLang: string;
  reportTitle: string;          // footer running head + cover H1
  sectionWord: string;          // eyebrow, "Section 03"
  sections: Record<string, string>; // s1..s13

  num: {
    lifePath: string; destiny: string; soulUrge: string;
    personality: string; master: string;
  };

  cover: { eyebrow: string; pill: string; disclaimer: string; by: string };

  score: { outOf: string; meansLabel: string };

  sharedPrefix: string;

  s11: { strengths: string; watch: string; overallLabel: string };

  signoff: string;

  upsell: {
    eyebrow: string; title: string; body: string;
    card: string; sub: string; cta: string; note: string;
  };

  disclaimer: {
    title: string; lead: string; items: string[]; close: string;
  };
}

// ---------------------------------------------------------------------------

const en: ReportStrings = {
  htmlLang: "en",
  reportTitle: "Love Match Report",
  sectionWord: "Section",
  sections: {
    s1: "How compatible are you two",
    s2: "Your core numbers",
    s3: "Life Path: how you each move through life",
    s4: "Soul Urge: how you each love",
    s5: "Chemistry & attraction",
    s6: "Intimacy & closeness",
    s7: "Personality: how you come across",
    s8: "Conflict & repair",
    s9: "Maturity: how you grow over time",
    s10: "Right now: the timing",
    s11: "At a glance: strengths & what to watch",
    s12: "What you can do",
    s13: "One honest note",
  },
  num: {
    lifePath: "Life Path", destiny: "Destiny", soulUrge: "Soul Urge",
    personality: "Personality", master: "Master",
  },
  cover: {
    eyebrow: "Compatibility Analysis",
    pill: "Honest, not just flattering.",
    disclaimer:
      "This report is based on numerology for guidance and self-reflection only. It is not a guarantee of any outcome, nor a substitute for professional advice.",
    by: "by",
  },
  score: { outOf: "out of 100", meansLabel: "What the score means." },
  sharedPrefix: "You share: ",
  s11: { strengths: "Your strengths", watch: "What to watch", overallLabel: "Overall." },
  signoff: "With warm regards, TalkToGuruji",
  upsell: {
    eyebrow: "One more thing",
    title: "Your numbers don't stop at love",
    body:
      "This report read your Soul Urge and Destiny straight from your name. But is your name spelling quietly helping you, or holding you back? Your full Numerology Report reveals your Name Correction and Mobile Number analysis, the everyday numbers steering your money, work, and relationships.",
    card: "Numerology Report",
    sub: "Name Correction + Mobile Number Analysis",
    cta: "Get your report",
    note: "Code LOVE is already applied in your link.",
  },
  disclaimer: {
    title: "Important Disclaimer",
    lead: "This is your personalized Love Match reading, reflecting the numerology of you both.",
    items: [
      "This report is based on numerology principles and symbolic interpretation.",
      "The insights are meant for understanding, awareness, and guidance only.",
      "This is not a prediction of guaranteed outcomes in your relationship.",
      "Results may vary based on your own choices, actions, and circumstances.",
      "Accuracy depends on the names and birth dates you provided.",
      "This is not legal, medical, financial, or psychological advice.",
      "Major relationship decisions should rest on your own judgment or a qualified professional.",
      "The creators and brand are not responsible for decisions taken solely based on this report.",
      "No refunds once the digital report has been delivered.",
    ],
    close:
      "Numerology is a traditional framework for self-reflection. Use this reading as a tool to understand yourselves and each other with greater awareness.",
  },
};

// --- HINDI: shipped and verified in production. Do not reword. ---------------

const hi: ReportStrings = {
  htmlLang: "hi",
  reportTitle: "लव मैच रिपोर्ट",
  sectionWord: "सेक्शन",
  sections: {
    s1: "आप दोनों कितने compatible हैं",
    s2: "आपके core numbers",
    s3: "Life Path: आप दोनों ज़िंदगी कैसे जीते हैं",
    s4: "Soul Urge: आप दोनों प्यार कैसे करते हैं",
    s5: "Chemistry और attraction",
    s6: "नज़दीकी और intimacy",
    s7: "Personality: आप बाहर से कैसे दिखते हैं",
    s8: "टकराव और repair",
    s9: "Maturity: वक़्त के साथ आप कैसे बदलते हैं",
    s10: "अभी का वक़्त",
    s11: "एक नज़र में: strengths और ध्यान रखने वाली बातें",
    s12: "आप क्या कर सकते हैं",
    s13: "एक honest बात",
  },
  num: {
    lifePath: "लाइफ़ पाथ", destiny: "डेस्टिनी", soulUrge: "सोल अर्ज",
    personality: "पर्सनैलिटी", master: "मास्टर",
  },
  cover: {
    eyebrow: "कम्पैटिबिलिटी analysis",
    pill: "Honest, सिर्फ़ तारीफ़ नहीं.",
    disclaimer:
      "यह report सिर्फ़ guidance और self-reflection के लिए numerology पर आधारित है. किसी नतीजे की guarantee नहीं, और professional advice का विकल्प नहीं.",
    by: "by",
  },
  score: { outOf: "में से 100", meansLabel: "Score का मतलब." },
  sharedPrefix: "आप दोनों में common: ",
  s11: { strengths: "आपकी strengths", watch: "ध्यान रखने वाली बातें", overallLabel: "कुल मिलाकर." },
  signoff: "सादर, TalkToGuruji",
  upsell: {
    eyebrow: "एक और बात",
    title: "आपके numbers सिर्फ़ love तक नहीं रुकते",
    body:
      "इस report ने आपके नाम से Soul Urge और Destiny पढ़ा. पर क्या आपके नाम की spelling आपका साथ दे रही है, या चुपके से रोक रही है? आपकी पूरी Numerology Report आपका Name Correction और Mobile Number analysis खोलती है, वो रोज़मर्रा के numbers जो आपके पैसे, काम और रिश्तों को चला रहे हैं.",
    card: "Numerology Report",
    sub: "Name Correction + Mobile Number Analysis",
    cta: "अपनी report पाएं",
    note: "Code LOVE आपके link में पहले से लगा है.",
  },
  disclaimer: {
    title: "ज़रूरी Disclaimer",
    lead: "यह आपकी personalized Love Match reading है, जो आप दोनों की numerology को दर्शाती है.",
    items: [
      "यह report numerology के सिद्धांतों और symbolic व्याख्या पर आधारित है.",
      "इसकी insights सिर्फ़ समझ, awareness और guidance के लिए हैं.",
      "यह आपके रिश्ते में किसी guaranteed नतीजे की भविष्यवाणी नहीं है.",
      "नतीजे आपकी अपनी choices, actions और परिस्थितियों पर निर्भर करते हैं.",
      "Accuracy आपके दिए गए नामों और जन्म तिथियों पर निर्भर करती है.",
      "यह legal, medical, financial या psychological सलाह नहीं है.",
      "बड़े रिश्ते के फ़ैसले आपकी अपनी समझ या किसी qualified professional पर आधारित होने चाहिए.",
      "इस report के आधार पर लिए गए फ़ैसलों के लिए creators और brand ज़िम्मेदार नहीं हैं.",
      "Digital report deliver होने के बाद कोई refund नहीं मिलेगा.",
    ],
    close:
      "Numerology self-reflection के लिए एक पारंपरिक framework है. इस reading को एक tool की तरह इस्तेमाल करें ताकि आप ख़ुद को और एक-दूसरे को ज़्यादा awareness के साथ समझ सकें.",
  },
};

// --- MARATHI -----------------------------------------------------------------

const mr: ReportStrings = {
  htmlLang: "mr",
  reportTitle: "लव्ह मॅच रिपोर्ट",
  sectionWord: "सेक्शन",
  sections: {
    s1: "तुम्ही दोघं किती compatible आहात",
    s2: "तुमचे core numbers",
    s3: "Life Path: तुम्ही दोघं आयुष्य कसं जगता",
    s4: "Soul Urge: तुम्ही दोघं प्रेम कसं करता",
    s5: "Chemistry आणि attraction",
    s6: "जवळीक आणि intimacy",
    s7: "Personality: तुम्ही बाहेरून कसे दिसता",
    s8: "वाद आणि समेट",
    s9: "Maturity: काळानुसार तुम्ही कसे बदलता",
    s10: "आत्ताची वेळ",
    s11: "एका नजरेत: strengths आणि लक्ष ठेवण्याच्या गोष्टी",
    s12: "तुम्ही काय करू शकता",
    s13: "एक honest गोष्ट",
  },
  num: {
    lifePath: "लाइफ पाथ", destiny: "डेस्टिनी", soulUrge: "सोल अर्ज",
    personality: "पर्सनॅलिटी", master: "मास्टर",
  },
  cover: {
    eyebrow: "कम्पॅटिबिलिटी analysis",
    pill: "Honest, फक्त कौतुक नाही.",
    disclaimer:
      "हा report फक्त guidance आणि self-reflection साठी numerology वर आधारित आहे. कोणत्याही निकालाची guarantee नाही, आणि professional advice चा पर्याय नाही.",
    by: "by",
  },
  score: { outOf: "पैकी 100", meansLabel: "Score चा अर्थ." },
  sharedPrefix: "तुमच्या दोघांमध्ये common: ",
  s11: { strengths: "तुमच्या strengths", watch: "लक्ष ठेवण्याच्या गोष्टी", overallLabel: "एकूण." },
  signoff: "सादर, TalkToGuruji",
  upsell: {
    eyebrow: "आणखी एक गोष्ट",
    title: "तुमचे numbers फक्त love पुरते थांबत नाहीत",
    body:
      "या report ने तुमच्या नावातून Soul Urge आणि Destiny वाचलं. पण तुमच्या नावाचं spelling तुम्हाला साथ देतंय, की गुपचूप अडवतंय? तुमची पूर्ण Numerology Report तुमचं Name Correction आणि Mobile Number analysis उघडते, तेच रोजचे numbers जे तुमचा पैसा, काम आणि नाती चालवतात.",
    card: "Numerology Report",
    sub: "Name Correction + Mobile Number Analysis",
    cta: "तुमची report मिळवा",
    note: "Code LOVE तुमच्या link मध्ये आधीच लावलेला आहे.",
  },
  disclaimer: {
    title: "महत्त्वाचा Disclaimer",
    lead: "ही तुमची personalized Love Match reading आहे, जी तुम्हा दोघांची numerology दर्शवते.",
    items: [
      "हा report numerology च्या तत्त्वांवर आणि symbolic अर्थावर आधारित आहे.",
      "याच्या insights फक्त समज, awareness आणि guidance साठी आहेत.",
      "ही तुमच्या नात्यातील कोणत्याही guaranteed निकालाची भविष्यवाणी नाही.",
      "निकाल तुमच्या स्वतःच्या choices, actions आणि परिस्थितीवर अवलंबून असतात.",
      "Accuracy तुम्ही दिलेल्या नावांवर आणि जन्मतारखांवर अवलंबून आहे.",
      "हा legal, medical, financial किंवा psychological सल्ला नाही.",
      "नात्यातील मोठे निर्णय तुमच्या स्वतःच्या समजुतीवर किंवा qualified professional वर आधारित असावेत.",
      "या report च्या आधारे घेतलेल्या निर्णयांसाठी creators आणि brand जबाबदार नाहीत.",
      "Digital report deliver झाल्यानंतर कोणताही refund मिळणार नाही.",
    ],
    close:
      "Numerology ही self-reflection साठीची एक पारंपरिक framework आहे. ही reading एक tool म्हणून वापरा, जेणेकरून तुम्ही स्वतःला आणि एकमेकांना अधिक awareness ने समजू शकाल.",
  },
};

// --- TAMIL -------------------------------------------------------------------

const ta: ReportStrings = {
  htmlLang: "ta",
  reportTitle: "லவ் மேட்ச் ரிப்போர்ட்",
  sectionWord: "பிரிவு",
  sections: {
    s1: "நீங்கள் இருவரும் எவ்வளவு compatible",
    s2: "உங்கள் core numbers",
    s3: "Life Path: நீங்கள் இருவரும் வாழ்க்கையை எப்படி எதிர்கொள்கிறீர்கள்",
    s4: "Soul Urge: நீங்கள் இருவரும் எப்படி காதலிக்கிறீர்கள்",
    s5: "Chemistry மற்றும் attraction",
    s6: "நெருக்கமும் intimacy-யும்",
    s7: "Personality: வெளியில் நீங்கள் எப்படித் தெரிகிறீர்கள்",
    s8: "மோதலும் சமரசமும்",
    s9: "Maturity: காலப்போக்கில் நீங்கள் எப்படி மாறுகிறீர்கள்",
    s10: "இப்போதைய நேரம்",
    s11: "ஒரே பார்வையில்: strengths மற்றும் கவனிக்க வேண்டியவை",
    s12: "நீங்கள் என்ன செய்யலாம்",
    s13: "ஒரு honest விஷயம்",
  },
  num: {
    lifePath: "லைஃப் பாத்", destiny: "டெஸ்டினி", soulUrge: "சோல் அர்ஜ்",
    personality: "பர்சனாலிட்டி", master: "மாஸ்டர்",
  },
  cover: {
    eyebrow: "Compatibility பகுப்பாய்வு",
    pill: "Honest, வெறும் புகழ்ச்சி இல்லை.",
    disclaimer:
      "இந்த report guidance மற்றும் self-reflection-க்காக மட்டுமே numerology அடிப்படையில் தயாரிக்கப்பட்டது. எந்த முடிவுக்கும் guarantee இல்லை, professional advice-க்கு மாற்றும் அல்ல.",
    by: "by",
  },
  score: { outOf: "100-க்கு", meansLabel: "Score-ன் அர்த்தம்." },
  sharedPrefix: "உங்கள் இருவருக்கும் common: ",
  s11: { strengths: "உங்கள் strengths", watch: "கவனிக்க வேண்டியவை", overallLabel: "மொத்தத்தில்." },
  signoff: "அன்புடன், TalkToGuruji",
  upsell: {
    eyebrow: "இன்னொரு விஷயம்",
    title: "உங்கள் numbers காதலோடு நிற்பதில்லை",
    body:
      "இந்த report உங்கள் பெயரிலிருந்தே Soul Urge மற்றும் Destiny-யைப் படித்தது. ஆனால் உங்கள் பெயரின் spelling உங்களுக்கு உதவுகிறதா, அல்லது அமைதியாகத் தடுக்கிறதா? உங்கள் முழு Numerology Report உங்கள் Name Correction மற்றும் Mobile Number analysis-ஐத் திறக்கிறது, அதாவது உங்கள் பணம், வேலை, உறவுகளை இயக்கும் அன்றாட numbers.",
    card: "Numerology Report",
    sub: "Name Correction + Mobile Number Analysis",
    cta: "உங்கள் report-ஐப் பெறுங்கள்",
    note: "Code LOVE உங்கள் link-இல் ஏற்கனவே சேர்க்கப்பட்டுள்ளது.",
  },
  disclaimer: {
    title: "முக்கியமான Disclaimer",
    lead: "இது உங்கள் personalized Love Match reading, உங்கள் இருவரின் numerology-யை பிரதிபலிக்கிறது.",
    items: [
      "இந்த report numerology கொள்கைகள் மற்றும் symbolic விளக்கத்தின் அடிப்படையில் அமைந்தது.",
      "இதன் insights புரிதல், awareness மற்றும் guidance-க்காக மட்டுமே.",
      "இது உங்கள் உறவில் எந்த உறுதியான முடிவின் கணிப்பும் அல்ல.",
      "முடிவுகள் உங்கள் சொந்த choices, actions மற்றும் சூழ்நிலைகளைப் பொறுத்தது.",
      "Accuracy நீங்கள் அளித்த பெயர்கள் மற்றும் பிறந்த தேதிகளைப் பொறுத்தது.",
      "இது legal, medical, financial அல்லது psychological ஆலோசனை அல்ல.",
      "உறவு சார்ந்த பெரிய முடிவுகள் உங்கள் சொந்த பகுத்தறிவு அல்லது qualified professional-ஐ சார்ந்திருக்க வேண்டும்.",
      "இந்த report-ஐ மட்டுமே அடிப்படையாகக் கொண்டு எடுக்கப்படும் முடிவுகளுக்கு creators மற்றும் brand பொறுப்பல்ல.",
      "Digital report deliver ஆன பிறகு எந்த refund-ம் கிடையாது.",
    ],
    close:
      "Numerology என்பது self-reflection-க்கான ஒரு பாரம்பரிய framework. இந்த reading-ஐ ஒரு tool-ஆகப் பயன்படுத்துங்கள், உங்களையும் ஒருவரையொருவரும் அதிக awareness-உடன் புரிந்துகொள்ள.",
  },
};

// --- TELUGU ------------------------------------------------------------------

const te: ReportStrings = {
  htmlLang: "te",
  reportTitle: "లవ్ మ్యాచ్ రిపోర్ట్",
  sectionWord: "విభాగం",
  sections: {
    s1: "మీ ఇద్దరూ ఎంత compatible",
    s2: "మీ core numbers",
    s3: "Life Path: మీ ఇద్దరూ జీవితాన్ని ఎలా ఎదుర్కొంటారు",
    s4: "Soul Urge: మీ ఇద్దరూ ఎలా ప్రేమిస్తారు",
    s5: "Chemistry మరియు attraction",
    s6: "సాన్నిహిత్యం మరియు intimacy",
    s7: "Personality: బయటికి మీరు ఎలా కనిపిస్తారు",
    s8: "గొడవ మరియు సర్దుబాటు",
    s9: "Maturity: కాలంతో మీరు ఎలా మారతారు",
    s10: "ప్రస్తుత సమయం",
    s11: "ఒక్క చూపులో: strengths మరియు గమనించాల్సినవి",
    s12: "మీరు ఏం చేయవచ్చు",
    s13: "ఒక honest మాట",
  },
  num: {
    lifePath: "లైఫ్ పాత్", destiny: "డెస్టినీ", soulUrge: "సోల్ అర్జ్",
    personality: "పర్సనాలిటీ", master: "మాస్టర్",
  },
  cover: {
    eyebrow: "Compatibility విశ్లేషణ",
    pill: "Honest, కేవలం పొగడ్త కాదు.",
    disclaimer:
      "ఈ report కేవలం guidance మరియు self-reflection కోసం numerology ఆధారంగా రూపొందించబడింది. ఏ ఫలితానికీ guarantee లేదు, professional advice కు ప్రత్యామ్నాయం కాదు.",
    by: "by",
  },
  score: { outOf: "100లో", meansLabel: "Score అర్థం." },
  sharedPrefix: "మీ ఇద్దరిలో common: ",
  s11: { strengths: "మీ strengths", watch: "గమనించాల్సినవి", overallLabel: "మొత్తంగా." },
  signoff: "ప్రేమతో, TalkToGuruji",
  upsell: {
    eyebrow: "మరో విషయం",
    title: "మీ numbers ప్రేమ దగ్గరే ఆగిపోవు",
    body:
      "ఈ report మీ పేరు నుంచే Soul Urge మరియు Destiny చదివింది. కానీ మీ పేరు spelling మీకు సహాయపడుతోందా, లేక నిశ్శబ్దంగా అడ్డుపడుతోందా? మీ పూర్తి Numerology Report మీ Name Correction మరియు Mobile Number analysis ను తెరుస్తుంది, అంటే మీ డబ్బు, పని, సంబంధాలను నడిపే రోజువారీ numbers.",
    card: "Numerology Report",
    sub: "Name Correction + Mobile Number Analysis",
    cta: "మీ report పొందండి",
    note: "Code LOVE మీ link లో ఇప్పటికే వర్తింపజేయబడింది.",
  },
  disclaimer: {
    title: "ముఖ్యమైన Disclaimer",
    lead: "ఇది మీ personalized Love Match reading, మీ ఇద్దరి numerology ను ప్రతిబింబిస్తుంది.",
    items: [
      "ఈ report numerology సూత్రాలు మరియు symbolic వ్యాఖ్యానం ఆధారంగా ఉంది.",
      "దీని insights కేవలం అవగాహన, awareness మరియు guidance కోసమే.",
      "ఇది మీ సంబంధంలో ఏ ఖచ్చితమైన ఫలితానికీ అంచనా కాదు.",
      "ఫలితాలు మీ స్వంత choices, actions మరియు పరిస్థితులపై ఆధారపడి ఉంటాయి.",
      "Accuracy మీరు ఇచ్చిన పేర్లు మరియు పుట్టిన తేదీలపై ఆధారపడి ఉంటుంది.",
      "ఇది legal, medical, financial లేదా psychological సలహా కాదు.",
      "సంబంధానికి సంబంధించిన పెద్ద నిర్ణయాలు మీ స్వంత అవగాహన లేదా qualified professional పై ఆధారపడి ఉండాలి.",
      "ఈ report ఆధారంగా మాత్రమే తీసుకున్న నిర్ణయాలకు creators మరియు brand బాధ్యత వహించరు.",
      "Digital report deliver అయిన తర్వాత ఎలాంటి refund ఉండదు.",
    ],
    close:
      "Numerology అనేది self-reflection కోసం ఒక సాంప్రదాయ framework. ఈ reading ను ఒక tool గా వాడండి, మిమ్మల్ని మరియు ఒకరినొకరు ఎక్కువ awareness తో అర్థం చేసుకోవడానికి.",
  },
};

// --- KANNADA -----------------------------------------------------------------

const kn: ReportStrings = {
  htmlLang: "kn",
  reportTitle: "ಲವ್ ಮ್ಯಾಚ್ ರಿಪೋರ್ಟ್",
  sectionWord: "ವಿಭಾಗ",
  sections: {
    s1: "ನೀವಿಬ್ಬರೂ ಎಷ್ಟು compatible",
    s2: "ನಿಮ್ಮ core numbers",
    s3: "Life Path: ನೀವಿಬ್ಬರೂ ಬದುಕನ್ನು ಹೇಗೆ ಎದುರಿಸುತ್ತೀರಿ",
    s4: "Soul Urge: ನೀವಿಬ್ಬರೂ ಹೇಗೆ ಪ್ರೀತಿಸುತ್ತೀರಿ",
    s5: "Chemistry ಮತ್ತು attraction",
    s6: "ಹತ್ತಿರತನ ಮತ್ತು intimacy",
    s7: "Personality: ಹೊರಗಿನಿಂದ ನೀವು ಹೇಗೆ ಕಾಣುತ್ತೀರಿ",
    s8: "ಜಗಳ ಮತ್ತು ಸಮಾಧಾನ",
    s9: "Maturity: ಕಾಲಕ್ರಮೇಣ ನೀವು ಹೇಗೆ ಬದಲಾಗುತ್ತೀರಿ",
    s10: "ಈಗಿನ ಸಮಯ",
    s11: "ಒಂದೇ ನೋಟದಲ್ಲಿ: strengths ಮತ್ತು ಗಮನಿಸಬೇಕಾದವು",
    s12: "ನೀವು ಏನು ಮಾಡಬಹುದು",
    s13: "ಒಂದು honest ಮಾತು",
  },
  num: {
    lifePath: "ಲೈಫ್ ಪಾತ್", destiny: "ಡೆಸ್ಟಿನಿ", soulUrge: "ಸೋಲ್ ಅರ್ಜ್",
    personality: "ಪರ್ಸನಾಲಿಟಿ", master: "ಮಾಸ್ಟರ್",
  },
  cover: {
    eyebrow: "Compatibility ವಿಶ್ಲೇಷಣೆ",
    pill: "Honest, ಬರೀ ಹೊಗಳಿಕೆ ಅಲ್ಲ.",
    disclaimer:
      "ಈ report ಕೇವಲ guidance ಮತ್ತು self-reflection ಗಾಗಿ numerology ಆಧಾರದ ಮೇಲೆ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ. ಯಾವುದೇ ಫಲಿತಾಂಶದ guarantee ಇಲ್ಲ, professional advice ಗೆ ಪರ್ಯಾಯವೂ ಅಲ್ಲ.",
    by: "by",
  },
  score: { outOf: "100 ರಲ್ಲಿ", meansLabel: "Score ಅರ್ಥ." },
  sharedPrefix: "ನಿಮ್ಮಿಬ್ಬರಲ್ಲೂ common: ",
  s11: { strengths: "ನಿಮ್ಮ strengths", watch: "ಗಮನಿಸಬೇಕಾದವು", overallLabel: "ಒಟ್ಟಾರೆ." },
  signoff: "ಪ್ರೀತಿಯಿಂದ, TalkToGuruji",
  upsell: {
    eyebrow: "ಇನ್ನೊಂದು ಮಾತು",
    title: "ನಿಮ್ಮ numbers ಪ್ರೀತಿಯಲ್ಲೇ ನಿಲ್ಲುವುದಿಲ್ಲ",
    body:
      "ಈ report ನಿಮ್ಮ ಹೆಸರಿನಿಂದಲೇ Soul Urge ಮತ್ತು Destiny ಓದಿತು. ಆದರೆ ನಿಮ್ಮ ಹೆಸರಿನ spelling ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತಿದೆಯೇ, ಅಥವಾ ಸದ್ದಿಲ್ಲದೆ ತಡೆಯುತ್ತಿದೆಯೇ? ನಿಮ್ಮ ಪೂರ್ಣ Numerology Report ನಿಮ್ಮ Name Correction ಮತ್ತು Mobile Number analysis ಅನ್ನು ತೆರೆಯುತ್ತದೆ, ಅಂದರೆ ನಿಮ್ಮ ಹಣ, ಕೆಲಸ, ಸಂಬಂಧಗಳನ್ನು ನಡೆಸುವ ದಿನನಿತ್ಯದ numbers.",
    card: "Numerology Report",
    sub: "Name Correction + Mobile Number Analysis",
    cta: "ನಿಮ್ಮ report ಪಡೆಯಿರಿ",
    note: "Code LOVE ನಿಮ್ಮ link ನಲ್ಲಿ ಈಗಾಗಲೇ ಅನ್ವಯಿಸಲಾಗಿದೆ.",
  },
  disclaimer: {
    title: "ಮುಖ್ಯವಾದ Disclaimer",
    lead: "ಇದು ನಿಮ್ಮ personalized Love Match reading, ನಿಮ್ಮಿಬ್ಬರ numerology ಯನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ.",
    items: [
      "ಈ report numerology ತತ್ವಗಳು ಮತ್ತು symbolic ವ್ಯಾಖ್ಯಾನದ ಆಧಾರದ ಮೇಲಿದೆ.",
      "ಇದರ insights ಕೇವಲ ಅರ್ಥೈಸಿಕೊಳ್ಳಲು, awareness ಮತ್ತು guidance ಗಾಗಿ ಮಾತ್ರ.",
      "ಇದು ನಿಮ್ಮ ಸಂಬಂಧದಲ್ಲಿ ಯಾವುದೇ ಖಚಿತ ಫಲಿತಾಂಶದ ಭವಿಷ್ಯವಾಣಿ ಅಲ್ಲ.",
      "ಫಲಿತಾಂಶಗಳು ನಿಮ್ಮ ಸ್ವಂತ choices, actions ಮತ್ತು ಸಂದರ್ಭಗಳ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿವೆ.",
      "Accuracy ನೀವು ನೀಡಿದ ಹೆಸರುಗಳು ಮತ್ತು ಜನ್ಮ ದಿನಾಂಕಗಳ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿದೆ.",
      "ಇದು legal, medical, financial ಅಥವಾ psychological ಸಲಹೆ ಅಲ್ಲ.",
      "ಸಂಬಂಧದ ದೊಡ್ಡ ನಿರ್ಧಾರಗಳು ನಿಮ್ಮ ಸ್ವಂತ ವಿವೇಚನೆ ಅಥವಾ qualified professional ಮೇಲೆ ಆಧರಿಸಿರಬೇಕು.",
      "ಈ report ಆಧಾರದ ಮೇಲೆ ಮಾತ್ರ ತೆಗೆದುಕೊಂಡ ನಿರ್ಧಾರಗಳಿಗೆ creators ಮತ್ತು brand ಜವಾಬ್ದಾರರಲ್ಲ.",
      "Digital report deliver ಆದ ನಂತರ ಯಾವುದೇ refund ಸಿಗುವುದಿಲ್ಲ.",
    ],
    close:
      "Numerology ಎಂಬುದು self-reflection ಗಾಗಿ ಒಂದು ಸಾಂಪ್ರದಾಯಿಕ framework. ಈ reading ಅನ್ನು ಒಂದು tool ಆಗಿ ಬಳಸಿ, ನಿಮ್ಮನ್ನು ಮತ್ತು ಒಬ್ಬರನ್ನೊಬ್ಬರು ಹೆಚ್ಚು awareness ನಿಂದ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು.",
  },
};

// --- MALAYALAM ---------------------------------------------------------------

const ml: ReportStrings = {
  htmlLang: "ml",
  reportTitle: "ലവ് മാച്ച് റിപ്പോർട്ട്",
  sectionWord: "വിഭാഗം",
  sections: {
    s1: "നിങ്ങൾ രണ്ടുപേരും എത്ര compatible",
    s2: "നിങ്ങളുടെ core numbers",
    s3: "Life Path: നിങ്ങൾ രണ്ടുപേരും ജീവിതത്തെ എങ്ങനെ നേരിടുന്നു",
    s4: "Soul Urge: നിങ്ങൾ രണ്ടുപേരും എങ്ങനെ സ്നേഹിക്കുന്നു",
    s5: "Chemistry-യും attraction-ഉം",
    s6: "അടുപ്പവും intimacy-യും",
    s7: "Personality: പുറമേ നിങ്ങൾ എങ്ങനെ തോന്നുന്നു",
    s8: "വഴക്കും ഒത്തുതീർപ്പും",
    s9: "Maturity: കാലക്രമേണ നിങ്ങൾ എങ്ങനെ മാറുന്നു",
    s10: "ഇപ്പോഴത്തെ സമയം",
    s11: "ഒറ്റനോട്ടത്തിൽ: strengths-ഉം ശ്രദ്ധിക്കേണ്ടതും",
    s12: "നിങ്ങൾക്ക് എന്തു ചെയ്യാം",
    s13: "ഒരു honest കാര്യം",
  },
  num: {
    lifePath: "ലൈഫ് പാത്ത്", destiny: "ഡെസ്റ്റിനി", soulUrge: "സോൾ അർജ്",
    personality: "പേഴ്സണാലിറ്റി", master: "മാസ്റ്റർ",
  },
  cover: {
    eyebrow: "Compatibility വിശകലനം",
    pill: "Honest, വെറും പുകഴ്ത്തലല്ല.",
    disclaimer:
      "ഈ report guidance-നും self-reflection-നും വേണ്ടി മാത്രം numerology അടിസ്ഥാനമാക്കി തയ്യാറാക്കിയതാണ്. ഒരു ഫലത്തിനും guarantee ഇല്ല, professional advice-ന് പകരവുമല്ല.",
    by: "by",
  },
  score: { outOf: "100-ൽ", meansLabel: "Score-ന്റെ അർത്ഥം." },
  sharedPrefix: "നിങ്ങൾ രണ്ടുപേർക്കും common: ",
  s11: { strengths: "നിങ്ങളുടെ strengths", watch: "ശ്രദ്ധിക്കേണ്ടവ", overallLabel: "മൊത്തത്തിൽ." },
  signoff: "സ്നേഹപൂർവ്വം, TalkToGuruji",
  upsell: {
    eyebrow: "ഒരു കാര്യം കൂടി",
    title: "നിങ്ങളുടെ numbers പ്രണയത്തിൽ നിൽക്കുന്നില്ല",
    body:
      "ഈ report നിങ്ങളുടെ പേരിൽ നിന്നുതന്നെ Soul Urge-ഉം Destiny-യും വായിച്ചു. പക്ഷേ നിങ്ങളുടെ പേരിന്റെ spelling നിങ്ങളെ സഹായിക്കുകയാണോ, അതോ നിശ്ശബ്ദമായി തടയുകയാണോ? നിങ്ങളുടെ പൂർണ്ണ Numerology Report നിങ്ങളുടെ Name Correction-ഉം Mobile Number analysis-ഉം തുറക്കുന്നു, അതായത് നിങ്ങളുടെ പണം, ജോലി, ബന്ധങ്ങൾ എന്നിവ നയിക്കുന്ന ദൈനംദിന numbers.",
    card: "Numerology Report",
    sub: "Name Correction + Mobile Number Analysis",
    cta: "നിങ്ങളുടെ report നേടൂ",
    note: "Code LOVE നിങ്ങളുടെ link-ൽ ഇതിനകം ചേർത്തിട്ടുണ്ട്.",
  },
  disclaimer: {
    title: "പ്രധാനപ്പെട്ട Disclaimer",
    lead: "ഇത് നിങ്ങളുടെ personalized Love Match reading ആണ്, നിങ്ങൾ രണ്ടുപേരുടെയും numerology പ്രതിഫലിപ്പിക്കുന്നു.",
    items: [
      "ഈ report numerology തത്വങ്ങളും symbolic വ്യാഖ്യാനവും അടിസ്ഥാനമാക്കിയുള്ളതാണ്.",
      "ഇതിലെ insights മനസ്സിലാക്കാനും awareness-നും guidance-നും വേണ്ടി മാത്രമാണ്.",
      "ഇത് നിങ്ങളുടെ ബന്ധത്തിൽ ഉറപ്പുള്ള ഒരു ഫലത്തിന്റെയും പ്രവചനമല്ല.",
      "ഫലങ്ങൾ നിങ്ങളുടെ സ്വന്തം choices, actions, സാഹചര്യങ്ങൾ എന്നിവയെ ആശ്രയിച്ചിരിക്കുന്നു.",
      "Accuracy നിങ്ങൾ നൽകിയ പേരുകളെയും ജനനത്തീയതികളെയും ആശ്രയിച്ചിരിക്കുന്നു.",
      "ഇത് legal, medical, financial അല്ലെങ്കിൽ psychological ഉപദേശമല്ല.",
      "ബന്ധത്തിലെ വലിയ തീരുമാനങ്ങൾ നിങ്ങളുടെ സ്വന്തം വിവേകത്തെയോ qualified professional-നെയോ ആശ്രയിച്ചാവണം.",
      "ഈ report മാത്രം അടിസ്ഥാനമാക്കി എടുക്കുന്ന തീരുമാനങ്ങൾക്ക് creators-ഉം brand-ഉം ഉത്തരവാദികളല്ല.",
      "Digital report deliver ചെയ്ത ശേഷം refund ലഭിക്കില്ല.",
    ],
    close:
      "Numerology എന്നത് self-reflection-നുള്ള ഒരു പരമ്പരാഗത framework ആണ്. ഈ reading ഒരു tool ആയി ഉപയോഗിക്കൂ, നിങ്ങളെയും പരസ്പരവും കൂടുതൽ awareness-ഓടെ മനസ്സിലാക്കാൻ.",
  },
};

// ---------------------------------------------------------------------------

export const reportStrings: Record<ReportLang, ReportStrings> = {
  en, hi, mr, ta, te, kn, ml,
};

/** Never throws. Unknown or missing language falls back to English. */
export function getStrings(lang: unknown): ReportStrings {
  const k = typeof lang === "string" ? lang.toLowerCase() : "";
  return (reportStrings as Record<string, ReportStrings>)[k] ?? en;
}

export function isReportLang(lang: unknown): lang is ReportLang {
  return typeof lang === "string" && lang in reportStrings;
}

export function scriptFor(lang: unknown): string {
  return isReportLang(lang) ? LANG_SCRIPT[lang] : "latin";
}
