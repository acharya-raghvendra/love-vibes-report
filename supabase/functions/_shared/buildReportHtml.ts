// buildReportHtml — Variation B "Soft Romance". Server-side, POSTed to Browserless as html.
// Structured sections (s1..s13). Band-based score ring color. Mobile-readable:
// his/her cards stack vertically, large type, generous spacing.

const LOGO_URL =
  "https://love.talktoguruji.com/__l5e/assets-v1/1826ef0e-d66c-48a4-8123-8270594dca3f/talktoguruji-logo.png";

interface NumFact { compound: number; display: number; score: number; isMaster: boolean; }
interface CoreNumbers {
  lifePath: NumFact; destiny: NumFact; soulUrge: NumFact; personality: NumFact;
  maturity?: NumFact; personalYear?: number; first?: string;
}
interface ChemPair { pair: string; a_planet: string; b_planet: string; relation: string; }
interface SectionBlock { label: string; text: string; }
interface AnalyticalSection {
  a_card?: string; b_card?: string; tag?: string; intro?: string; blocks?: SectionBlock[];
}
interface Facts {
  language?: string; score: number; band: string; shared?: string[];
  person_a: CoreNumbers; person_b: CoreNumbers;
  chemistry?: ChemPair[]; names?: { a?: string; b?: string };
}

const SECTION_TITLES: Record<string, string> = {
  s1: "How compatible are you two", s2: "Your core numbers",
  s3: "Life Path: how you each move through life", s4: "Soul Urge: how you each love",
  s5: "Chemistry & attraction", s6: "Intimacy & closeness",
  s7: "Personality: how you come across", s8: "Conflict & repair",
  s9: "Maturity: how you grow over time", s10: "Right now: the timing",
  s11: "At a glance: strengths & what to watch", s12: "What you can do",
  s13: "One honest note",
};

function esc(s: unknown): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

// Band-based ring color so a high score never shows a "red flag" arc.
function ringColor(score: number): string {
  if (score >= 80) return "#1FA97A"; // Strong  - green/teal
  if (score >= 60) return "#C9A25E"; // Balanced- gold
  if (score >= 40) return "#E0A24E"; // Mixed   - amber
  return "#D8746B";                  // Challenging - coral
}

function relationDot(rel: string): string {
  const r = (rel || "").toLowerCase();
  if (r.includes("friend") || r.includes("warm")) return "#1FA97A";
  if (r.includes("challeng") || r.includes("enem") || r.includes("cold")) return "#D8746B";
  return "#C9A25E";
}

function numRows(c: CoreNumbers): string {
  const row = (label: string, f: NumFact) => {
    const compound = f.compound !== f.display ? `${f.compound}/${f.display}` : `${f.display}`;
    const shown = f.isMaster ? `${f.score} (Master ${f.display})` : compound;
    return `<div class="nrow"><span class="v">${esc(f.display)}</span>`
      + `<span class="meta"><b>${label}</b><span>${esc(shown)}</span></span></div>`;
  };
  return row("Life Path", c.lifePath) + row("Destiny", c.destiny)
    + row("Soul Urge", c.soulUrge) + row("Personality", c.personality);
}

function pairStrip(chem: ChemPair[]): string {
  return `<div class="pairs">` + chem.map((p) =>
    `<div class="pair"><span class="pdot" style="background:${relationDot(p.relation)}"></span>`
    + `<b>${esc(p.pair)}</b><small>${esc(p.a_planet)} &amp; ${esc(p.b_planet)}</small></div>`
  ).join("") + `</div>`;
}

function ringSvg(score: number): string {
  const r = 78, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  return `<svg width="180" height="180" viewBox="0 0 180 180">`
    + `<circle cx="90" cy="90" r="${r}" fill="none" stroke="#F3E1DC" stroke-width="13"/>`
    + `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${ringColor(score)}" stroke-width="13" `
    + `stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" `
    + `transform="rotate(-90 90 90)"/></svg>`;
}

function frun(pg: number): string {
  return `<div class="frun"><span>TalkToGuruji &nbsp;•&nbsp; Love Match Report</span><span class="pg">${pg}</span></div>`;
}
function eyebrow(n: string): string {
  const nn = n.length < 2 ? "0" + n : n;
  return `<div class="eyebrow-s"><span class="rings"><i></i><i></i></span> Section ${nn}</div>`;
}
function head(id: string): string {
  return eyebrow(id.replace("s", "")) + `<h2 class="sec serif">${esc(SECTION_TITLES[id])}</h2><div class="rule"></div>`;
}

function cards2(nameA: string, nameB: string, s: AnalyticalSection): string {
  if (!s.a_card && !s.b_card) return "";
  return `<div class="mcard his"><div class="who"><span class="d"></span>${esc(nameA)}</div><p>${esc(s.a_card || "")}</p></div>`
    + `<div class="mcard hers"><div class="who"><span class="d"></span>${esc(nameB)}</div><p>${esc(s.b_card || "")}</p></div>`;
}
function blocks(bl?: SectionBlock[]): string {
  if (!bl || !bl.length) return "";
  return bl.map((b) =>
    `<div class="blk-row"><div class="lab">${esc(b.label)}</div><p>${esc(b.text)}</p></div>`
  ).join("");
}

function analyticalPage(id: string, nameA: string, nameB: string, s: AnalyticalSection, pg: number, extra = ""): string {
  let inner = head(id) + cards2(nameA, nameB, s);
  if (s.tag) inner += `<div class="verdict">${esc(s.tag)}</div>`;
  inner += extra;
  if (s.intro) inner += `<div class="hero-quote">${esc(s.intro)}</div>`;
  inner += blocks(s.blocks);
  return `<div class="page">${inner}${frun(pg)}</div>`;
}

export function buildReportHtml(facts: Facts, sections: Record<string, unknown>): string {
  const hi = facts.language === "hi";
  const nameA = facts.person_a?.first || facts.names?.a || "Person A";
  const nameB = facts.person_b?.first || facts.names?.b || "Person B";
  const S = sections as Record<string, unknown>;
  let pg = 1;

  // Cover
  let pages = `<div class="page cover">`
    + `<div class="badge"><span class="heart">&#9829;</span></div>`
    + `<div class="eyebrow">Compatibility Analysis</div>`
    + `<h1 class="serif">Love Match Report</h1>`
    + `<div class="names serif">${esc(nameA)} <span class="amp">&amp;</span> ${esc(nameB)}</div>`
    + `<div class="pill">Honest, not just flattering.</div>`
    + `<div class="signoff"><img src="${LOGO_URL}" alt="TalkToGuruji"/><span>by TalkToGuruji</span></div>`
    + `</div>`;

  // s1 score
  const s1 = (S.s1 || {}) as { headline?: string; what_it_means?: string; honest_note?: string };
  let sharedHtml = "";
  if (facts.shared && facts.shared.length) {
    sharedHtml = `<div class="shared">You share: ${facts.shared.map((x) => `<b>${esc(x)}</b>`).join(", ")}.</div>`;
  }
  pages += `<div class="page">${head("s1")}`
    + `<div class="score-hero"><div class="ring">${ringSvg(facts.score)}`
    + `<div class="lbl"><b>${facts.score}</b><span>out of 100</span></div></div>`
    + `<div class="band-pill">${esc(facts.band)}</div>`
    + (s1.headline ? `<div class="band-sub">${esc(s1.headline)}</div>` : "")
    + `</div>`
    + sharedHtml
    + (s1.what_it_means ? `<div class="hero-quote"><b>What the score means.</b> ${esc(s1.what_it_means)}</div>` : "")
    + (s1.honest_note ? `<p class="body">${esc(s1.honest_note)}</p>` : "")
    + frun(++pg) + `</div>`;

  // s2 core numbers (stacked person cards = mobile-readable)
  const s2 = (S.s2 || {}) as { shared_note?: string };
  pages += `<div class="page">${head("s2")}`
    + `<div class="pcol his"><h3>${esc(nameA)}</h3>${numRows(facts.person_a)}</div>`
    + `<div class="pcol hers"><h3>${esc(nameB)}</h3>${numRows(facts.person_b)}</div>`
    + (s2.shared_note ? `<div class="shared">${esc(s2.shared_note)}</div>` : "")
    + frun(++pg) + `</div>`;

  // s3-s10 analytical
  for (const id of ["s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"]) {
    const sec = (S[id] || { blocks: [] }) as AnalyticalSection;
    const extra = id === "s5" && facts.chemistry ? pairStrip(facts.chemistry) : "";
    pages += analyticalPage(id, nameA, nameB, sec, ++pg, extra);
  }

  // s11 lists
  const s11 = (S.s11 || {}) as { strengths?: SectionBlock[]; watch?: SectionBlock[]; overall?: string };
  const li = (items: SectionBlock[] | undefined, cls: string) =>
    (items || []).map((i) => `<div class="li ${cls}"><span class="b">&#10022;</span><span class="t"><b>${esc(i.label)}.</b> <span>${esc(i.text)}</span></span></div>`).join("");
  pages += `<div class="page">${head("s11")}`
    + `<div class="listcol"><h4>Your strengths</h4>${li(s11.strengths, "good")}</div>`
    + `<div class="listcol watch"><h4>What to watch</h4>${li(s11.watch, "watch")}</div>`
    + (s11.overall ? `<div class="hero-quote"><b>Overall.</b> ${esc(s11.overall)}</div>` : "")
    + frun(++pg) + `</div>`;

  // s12 advice
  const s12 = (S.s12 || {}) as { intro?: string; items?: SectionBlock[] };
  pages += `<div class="page">${head("s12")}`
    + (s12.intro ? `<p class="body intro-line">${esc(s12.intro)}</p>` : "")
    + (s12.items || []).map((i) => `<div class="blk-row"><div class="lab">${esc(i.label)}</div><p>${esc(i.text)}</p></div>`).join("")
    + frun(++pg) + `</div>`;

  // s13 closing letter
  const s13 = (S.s13 || {}) as { text?: string };
  const letterParas = esc(s13.text || "").split("\n").filter(Boolean).map((p) => `<p>${p}</p>`).join("");
  pages += `<div class="page">${head("s13")}`
    + `<div class="letter">${letterParas}</div>`
    + `<div class="sign"><img src="${LOGO_URL}" alt="TalkToGuruji"/><span>With warm regards, TalkToGuruji</span></div>`
    + frun(++pg) + `</div>`;

  return `<!DOCTYPE html><html lang="${hi ? "hi" : "en"}"><head><meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--ink:#3D2B2E;--muted:#9C8A8C;--soft:#6E5A5D;--coral:#D8746B;--coral-dk:#C25A50;--coral-lt:#F3D4CF;--coral-wash:#FBEDEA;--gold:#C9A25E;--blush:#F7E9E6;--cream:#FDF6F3;--line:#F0E2DE;--peach1:#F9E0D6;--peach2:#F3CBC5;}
*{box-sizing:border-box;margin:0;padding:0;}html{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{font-family:'Inter',sans-serif;color:var(--ink);}
body.hi{font-family:'Noto Sans Devanagari',sans-serif;}
.serif{font-family:'Fraunces',serif;}
body.hi .serif{font-family:'Noto Sans Devanagari',sans-serif;}
@page{size:A4;margin:0;}
.page{width:210mm;min-height:297mm;padding:26mm 24mm 22mm;position:relative;page-break-after:always;background:var(--cream);display:flex;flex-direction:column;}
.page:last-child{page-break-after:auto;}
.frun{margin-top:auto;padding-top:16px;display:flex;justify-content:space-between;color:var(--muted);font-size:9.5px;}
.frun .pg{color:var(--coral);font-weight:600;}
.heart{color:var(--coral);}
.rings{width:24px;height:15px;position:relative;display:inline-block;}
.rings i{position:absolute;top:0;width:15px;height:15px;border-radius:50%;border:1.5px solid var(--coral);}
.rings i:first-child{left:0;}.rings i:last-child{left:8px;border-color:var(--gold);}
.cover{background:linear-gradient(165deg,var(--peach1) 0%,var(--peach2) 55%,#EBB6AE 100%);align-items:center;text-align:center;padding:40mm 24mm;}
.cover .badge{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;margin-bottom:20px;}
.cover .badge .heart{font-size:30px;}
.cover .eyebrow{color:rgba(120,70,64,.7);letter-spacing:.36em;font-size:10.5px;text-transform:uppercase;margin-top:34mm;}
.cover h1{font-size:54px;line-height:1.02;font-weight:500;margin-top:12px;color:#5C332E;}
.cover .names{margin-top:26px;font-size:30px;color:#7A4038;font-weight:500;}
.cover .names .amp{color:#fff;}
.cover .pill{margin-top:22px;background:rgba(255,255,255,.6);color:#8A4A42;font-size:13px;padding:8px 20px;border-radius:24px;font-style:italic;}
.cover .signoff{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:6px;}
.cover .signoff img{height:34px;object-fit:contain;opacity:.9;}
.cover .signoff span{color:rgba(120,70,64,.6);font-size:10px;letter-spacing:.08em;}
.eyebrow-s{display:flex;align-items:center;gap:8px;color:var(--coral);letter-spacing:.16em;font-size:10px;text-transform:uppercase;font-weight:700;}
h2.sec{font-size:29px;font-weight:500;margin:10px 0 0;line-height:1.12;color:var(--ink);}
.rule{width:40px;height:3px;background:var(--coral);margin:14px 0 22px;border-radius:3px;}
p.body{font-size:13px;line-height:1.82;color:var(--soft);margin-bottom:12px;}
p.body b{color:var(--ink);}
.intro-line{font-style:italic;color:var(--muted);}
.score-hero{display:flex;flex-direction:column;align-items:center;text-align:center;margin:6px 0 18px;}
.ring{position:relative;width:180px;height:180px;}
.ring .lbl{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.ring .lbl b{font-family:'Fraunces',serif;font-size:50px;font-weight:500;line-height:1;color:var(--ink);}
.ring .lbl span{font-size:10.5px;color:var(--muted);letter-spacing:.16em;margin-top:4px;text-transform:uppercase;}
.band-pill{margin-top:16px;background:#fff;border:1.5px solid var(--coral-lt);color:var(--coral-dk);font-family:'Fraunces',serif;font-size:16px;padding:6px 20px;border-radius:24px;}
.band-sub{font-size:12.5px;color:var(--muted);margin-top:8px;max-width:80%;}
.hero-quote{background:var(--coral-wash);border-radius:16px;padding:15px 18px;font-size:13px;line-height:1.76;color:var(--soft);margin-bottom:16px;}
.hero-quote b{color:var(--ink);}
.shared{background:#fff;border:1px solid var(--coral-lt);border-radius:14px;padding:14px 16px;font-size:12.5px;line-height:1.7;color:var(--soft);margin-top:6px;}
.shared b{color:var(--coral-dk);}
.pcol{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 20px 8px;margin-bottom:14px;box-shadow:0 2px 0 var(--blush);position:relative;overflow:hidden;}
.pcol::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;}
.pcol.his::before{background:var(--gold);}.pcol.hers::before{background:var(--coral);}
.pcol h3{font-family:'Fraunces',serif;font-size:19px;font-weight:500;margin-bottom:8px;}
.nrow{display:flex;align-items:baseline;gap:14px;padding:9px 0;border-bottom:1px solid var(--line);}
.nrow:last-child{border-bottom:0;}
.nrow .v{font-family:'Fraunces',serif;font-size:24px;font-weight:500;color:var(--gold);min-width:48px;line-height:1;}
.pcol.hers .nrow .v{color:var(--coral);}
.nrow .meta b{display:block;font-size:12.5px;color:var(--ink);}
.nrow .meta span{font-size:10.5px;color:var(--muted);}
.mcard{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 18px;margin-bottom:11px;box-shadow:0 2px 0 var(--blush);}
.mcard .who{font-weight:700;font-size:14px;margin-bottom:6px;display:flex;align-items:center;gap:8px;color:var(--ink);}
.mcard .who .d{width:8px;height:8px;border-radius:50%;}
.mcard.his .who .d{background:var(--gold);}.mcard.hers .who .d{background:var(--coral);}
.mcard p{font-size:12.5px;line-height:1.64;color:var(--soft);}
.verdict{display:inline-block;background:#fff;color:var(--coral-dk);border:1.5px solid var(--coral-lt);font-family:'Fraunces',serif;font-size:14px;padding:6px 18px;border-radius:24px;margin:4px 0 16px;}
.blk-row{background:#fff;border-radius:14px;padding:13px 16px;margin-bottom:10px;border:1px solid var(--line);}
.blk-row .lab{font-weight:700;font-size:11px;color:var(--coral);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;}
.blk-row p{font-size:12.5px;line-height:1.7;color:var(--soft);}
.pairs{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 16px;}
.pair{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:6px 12px;font-size:11px;}
.pair .pdot{width:8px;height:8px;border-radius:50%;}
.pair small{color:var(--muted);}
.listcol{margin-bottom:16px;}
.listcol h4{font-family:'Fraunces',serif;font-size:17px;font-weight:500;margin-bottom:10px;color:var(--ink);}
.li{display:flex;gap:10px;padding:8px 0;border-bottom:1px dotted var(--line);}
.li .b{font-size:13px;line-height:1.4;}
.li.good .b{color:var(--gold);}.li.watch .b{color:var(--coral);}
.li .t b{font-size:12.5px;color:var(--ink);}.li .t span{font-size:12px;color:var(--soft);}
.letter{font-family:'Fraunces',serif;font-size:14.5px;line-height:1.9;color:var(--soft);font-style:italic;}
.letter p{margin-bottom:14px;}
.sign{margin-top:18px;display:flex;flex-direction:column;gap:6px;}
.sign img{height:30px;object-fit:contain;opacity:.9;}
.sign span{font-size:11px;color:var(--muted);}
</style></head><body class="${hi ? "hi" : ""}">${pages}</body></html>`;
}
