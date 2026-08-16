import type { SiteLanguage } from "@/lib/site-language";

// One bilingual dictionary for all marketing chrome (header, landing, input,
// footer). Hindi keeps common loanwords in Latin (report, unlock, WhatsApp,
// coupon, steps) because that is how the audience actually reads them.

export const CTA_LABEL: Record<SiteLanguage, string> = {
  hi: "Compatibility check करें",
  en: "Check Compatibility",
};

export const NEW_PAIR_LABEL: Record<SiteLanguage, string> = {
  hi: "नई जोड़ी check करें",
  en: "Check a new pair",
};


export const META: Record<
  "landing" | "input",
  Record<SiteLanguage, { title: string; description: string }>
> = {
  landing: {
    hi: {
      title: "Love Match — क्या आपकी जोड़ी सच में बनी है? | TalkToGuruji",
      description:
        "सिर्फ़ नाम और जन्म-तारीख से जानिए आप दोनों की compatibility. तुरंत score, और 12-पेज personalized numerology report WhatsApp + email पर.",
    },
    en: {
      title: "Love Match — Numerology Compatibility Report | TalkToGuruji",
      description:
        "Discover if your souls are aligned by the numbers. Instant compatibility score plus a 12-page personalized report on WhatsApp and email.",
    },
  },
  input: {
    hi: {
      title: "अपनी details भरें — Love Match Compatibility | TalkToGuruji",
      description:
        "दोनों के नाम और जन्म-तारीख भरें और तुरंत अपना numerology compatibility score देखें.",
    },
    en: {
      title: "Enter Your Details — Love Match Compatibility | TalkToGuruji",
      description:
        "Share both birth details to reveal your numerology compatibility score instantly.",
    },
  },
};

export const HEADER_COPY = {
  hi: {
    nav: [
      { href: "/#hero", label: "होम" },
      { href: "/#how-it-works", label: "कैसे काम करता है" },
      { href: "/#faq", label: "आम सवाल" },
    ],
    openMenu: "मेन्यू खोलें",
    closeMenu: "मेन्यू बंद करें",
    languageLabel: "भाषा चुनें",
  },
  en: {
    nav: [
      { href: "/#hero", label: "Home" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/#faq", label: "FAQ" },
    ],
    openMenu: "Open menu",
    closeMenu: "Close menu",
    languageLabel: "Choose language",
  },
} as const;

export const FOOTER_COPY = {
  hi: {
    tagline:
      "प्राचीन numerology, आज के seekers के लिए. दो लोगों के बीच का cosmic blueprint जानिए.",
    quickLinks: "ज़रूरी links",
    trust: "भरोसा और support",
    links: {
      "/": "होम",
      "/privacy": "Privacy Policy",
      "/terms": "Terms",
      "/refund": "Refund Policy",
      "/contact": "संपर्क करें",
    },
    razorpay: "Razorpay सुरक्षित",
    upi: "UPI",
    whatsapp: "WhatsApp support",
  },
  en: {
    tagline:
      "Ancient numerology, decoded for modern seekers. Discover the cosmic blueprint between two souls.",
    quickLinks: "Quick Links",
    trust: "Trust & Support",
    links: {
      "/": "Home",
      "/privacy": "Privacy Policy",
      "/terms": "Terms",
      "/refund": "Refund Policy",
      "/contact": "Contact",
    },
    razorpay: "Razorpay Secure",
    upi: "UPI",
    whatsapp: "WhatsApp Support",
  },
} as const;

export const LANDING_COPY = {
  hi: {
    heroTitleLead: "क्या आपकी जोड़ी सच में बनी है? ",
    heroTitleAccent: "अंक बताएँगे।",
    heroSub:
      "सिर्फ़ नाम और जन्म-तारीख से जानिए — आप दोनों कहाँ जुड़ते हैं, और कहाँ टकराते हैं।",
    priceLine: (p: number) => `₹${p} में 12-पेज personalized report · WhatsApp + email पर तुरंत`,
    compatibility: "मेल",
    trustLine: "50,000+ seekers का भरोसा",
    stepsHeading: "3 आसान steps",
    steps: [
      { icon: "edit_calendar", title: "1. दोनों के नाम और जन्म-तारीख भरें", body: "सही गणना के लिए बस इतना ही चाहिए।" },
      { icon: "analytics", title: "2. तुरंत अपना compatibility score देखें", body: "प्राचीन numerology पर आधारित instant score।" },
      { icon: "lock_open", title: "3. पूरी 12-पेज report unlock करें", body: "Destiny number, soul urge और आगे का रास्ता — विस्तार से।" },
    ],
    samplePreview: "Sample preview",
    previewTitle: "आपकी report तैयार है",
    previewBody: "अपनी personalized 12-पेज compatibility report unlock कीजिए।",
    previewCta: "अभी unlock करें",
    seeker1: "पहला साथी",
    seeker2: "दूसरा साथी",
    testimonialsHeading: "लोग क्या कहते हैं",
    testimonials: [
      "सटीकता देखकर हैरान रह गए। लगा जैसे Guruji हमारी आत्मा का नक्शा पढ़ रहे हैं। अब समझ आया कि हमारा जुड़ाव ऐसा क्यों है।",
      "मुश्किल दौर में इसने राह दिखाई। अंकों की समझ से हमें अपने फ़र्क़ बिना झगड़े के बात करने की भाषा मिल गई।",
    ],
    faqHeading: "आम सवाल",
    faqs: [
      {
        q: "यह कितना सही होता है?",
        a: "हमारी report स्थापित Chaldean और Vedic numerology तरीकों से दो लोगों के बीच का मेल निकालती है। Numerology समझ और आत्म-चिंतन का ज़रिया है, कोई पक्की भविष्यवाणी नहीं। ज़्यादातर पाठकों को यह विश्लेषण अपने असली अनुभव से मिलता-जुलता लगता है।",
      },
      {
        q: "मुझे क्या जानकारी देनी होगी?",
        a: "बस दोनों के पूरे नाम और जन्म-तारीख। विश्लेषण के लिए इतना ही ज़रूरी है।",
      },
      {
        q: "क्या यह निजी रहता है?",
        a: "हाँ। आपका डेटा encrypted रहता है और कभी साझा नहीं किया जाता। हम आपकी जानकारी सिर्फ़ आपकी report बनाने के लिए इस्तेमाल करते हैं।",
      },
      {
        q: "क्या refund मिल सकता है?",
        a: "यह personalized digital report है जो तुरंत डिलीवर हो जाती है, इसलिए बन जाने के बाद refund नहीं दिया जा सकता। डिलीवरी में कोई तकनीकी दिक़्क़त हो तो हमें बताइए, हम उसे ठीक करेंगे।",
      },
    ],
  },
  en: {
    heroTitleLead: "Discover if Your Souls are Aligned by the ",
    heroTitleAccent: "Numbers",
    heroSub: "Enter your destinies to reveal the cosmic connection between you.",
    priceLine: (p: number) =>
      `₹${p} — 12-page personalized report · instant on WhatsApp + email`,
    compatibility: "Compatibility",
    trustLine: "Trusted by 50,000+ Seekers",
    stepsHeading: "The Path to Clarity",
    steps: [
      { icon: "edit_calendar", title: "1. Enter Details", body: "Share your birth dates and names for precise cosmic calculation." },
      { icon: "analytics", title: "2. Get Score", body: "See your instant affinity score based on ancient numerology." },
      { icon: "lock_open", title: "3. Unlock Full Report", body: "Deep dive into destiny numbers, soul urges, and future paths." },
    ],
    samplePreview: "Sample Preview",
    previewTitle: "Your Destiny Awaits",
    previewBody: "Unlock your personalized 12-page compatibility report today.",
    previewCta: "Unlock Now",
    seeker1: "Seeker 1",
    seeker2: "Seeker 2",
    testimonialsHeading: "Whispers of Truth",
    testimonials: [
      "The accuracy was breathtaking. It felt like Guruji was reading the very blueprint of our souls. We finally understand why we connect the way we do.",
      "Guided us through a tough transition. The numerical insights gave us a common language to discuss our differences without friction.",
    ],
    faqHeading: "Common Inquiries",
    faqs: [
      {
        q: "How accurate is this?",
        a: "Our reports use established Chaldean and Vedic numerology methods to map compatibility between two people. Numerology is an interpretive system for insight and self-reflection, not a guaranteed prediction. Many readers find the analysis resonates closely with their real experience.",
      },
      {
        q: "What do I need to provide?",
        a: "Just the full birth names and dates of birth of both people. That is all the analysis needs.",
      },
      {
        q: "Is it private?",
        a: "Yes. Your data is encrypted and never shared. We handle your personal information with strict care and use it only to generate your report.",
      },
      {
        q: "Can I get a refund?",
        a: "Because this is a personalized digital report delivered instantly, we are unable to offer refunds once it has been generated. If you face any technical issue with delivery, reach out and we will make it right.",
      },
    ],
  },
} as const;

export const INPUT_COPY = {
  hi: {
    headingLead: "अपनी ",
    headingAccent: "details भरें",
    sub: "दोनों के नाम और जन्म-तारीख भरें — बाक़ी अंक बता देंगे।",
    partner: (n: 1 | 2) => `साथी ${n}`,
    roleA: "लड़का",
    roleB: "लड़की",
    name: "नाम",
    namePlaceholder: "पूरा नाम English में लिखें",
    dob: "जन्म-तारीख",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    whatsapp: "WhatsApp नंबर",
    whatsappHelp: "(report इसी नंबर पर आएगी)",
    whatsappPlaceholder: "10 अंकों का नंबर",
    email: "Email पता",
    emailHelp: "(report इसी email पर भेजी जाएगी)",
    language: "Report की भाषा",
    languageHelp: "(आपकी report इसी भाषा में लिखी जाएगी)",
    submit: CTA_LABEL.hi,
    secure: "100% सुरक्षित और गोपनीय",
    priceLine: (p: number) => `₹${p} में 12-पेज personalized report · WhatsApp + email पर तुरंत`,
    errors: {
      name: "कृपया नाम English में लिखें।",
      dob: "कृपया जन्म-तारीख चुनें।",
      phone: "10 अंकों का WhatsApp नंबर डालें।",
      emailRequired: "Email ज़रूरी है — report यहीं भेजी जाएगी।",
      emailInvalid: "सही email डालें, जैसे name@example.com",
    },
  },
  en: {
    headingLead: "Enter Your ",
    headingAccent: "Details",
    sub: "Share your birth details to reveal your cosmic compatibility.",
    partner: (n: 1 | 2) => `Partner ${n}`,
    roleA: "Initiator",
    roleB: "Companion",
    name: "Name",
    namePlaceholder: "Enter full name in English",
    dob: "Date of Birth",
    gender: "Gender",
    male: "MALE",
    female: "FEMALE",
    whatsapp: "WhatsApp Number",
    whatsappHelp: "(required to deliver your report)",
    whatsappPlaceholder: "WhatsApp Number",
    email: "Email Address",
    emailHelp: "(your report is emailed here)",
    language: "Report Language",
    languageHelp: "(your report is written in this language)",
    submit: CTA_LABEL.en,
    secure: "100% Secure & Confidential",
    priceLine: (p: number) =>
      `₹${p} — 12-page personalized report · instant on WhatsApp + email`,
    errors: {
      name: "Please enter the name in English.",
      dob: "Please select a date of birth.",
      phone: "Enter a 10-digit WhatsApp number.",
      emailRequired: "Email address is required — we send your report here.",
      emailInvalid: "Enter a valid email address, e.g. name@example.com",
    },
  },
} as const;
