// buildReportHtml — server-side report HTML for Browserless (Option 3).
// Ported verbatim from the original print template; the client-side #data
// decoder is removed and facts/sections are injected directly into markup.
//
// Expected shape:
//   facts.score, facts.band, facts.shared[]
//   facts.person_a / person_b: CoreNumbers { lifePath{display,compound,isMaster,score}, destiny, soulUrge, personality, ... }
//   facts.chemistry: [{ pair, a_planet, b_planet, relation }]  (NO numbers — matches Gemini payload)
//   facts.names: { a, b } (fallback if person objects lack first names)
//   facts.language: "hi" | "en"
//   sections: { s1..s13 } prose strings

interface NumFact { compound: number; display: number; score: number; isMaster: boolean; }
interface CoreNumbers {
  lifePath: NumFact; destiny: NumFact; soulUrge: NumFact; personality: NumFact;
  maturity?: NumFact; personalYear?: number; first?: string;
}
interface ChemPair { pair: string; a_planet: string; b_planet: string; relation: string; }
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

function relationColor(rel: string): string {
  const r = (rel || "").toLowerCase();
  if (r.includes("friend") || r.includes("warm")) return "var(--warm)";
  if (r.includes("challeng") || r.includes("enem") || r.includes("cold")) return "var(--cold)";
  return "var(--neutral)";
}

function numFact(label: string, f: NumFact): string {
  const compound = f.compound !== f.display ? `${f.compound}/${f.display}` : `${f.display}`;
  const shown = f.isMaster ? `${f.score} (Master ${f.display})` : compound;
  return `<div class="numrow"><div class="v">${esc(f.display)}</div>`
    + `<div class="k"><b>${label}</b><span>${esc(shown)}</span></div></div>`;
}

function personCol(name: string, c: CoreNumbers): string {
  return `<div class="person"><h3>${esc(name)}</h3>`
    + numFact("Life Path", c.lifePath) + numFact("Destiny", c.destiny)
    + numFact("Soul Urge", c.soulUrge) + numFact("Personality", c.personality)
    + `</div>`;
}

function pairStrip(chem: ChemPair[]): string {
  return `<div class="pairs">` + chem.map((p) =>
    `<div class="pair"><span class="dot" style="background:${relationColor(p.relation)}"></span>`
    + `<b>${esc(p.pair)}</b><small>${esc(p.a_planet)} &amp; ${esc(p.b_planet)}</small></div>`
  ).join("") + `</div>`;
}

function dial(score: number, band: string): string {
  const r = 66, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  return `<div class="dial-wrap"><div class="dial">`
    + `<svg width="150" height="150" viewBox="0 0 150 150">`
    + `<circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--gold-soft)" stroke-width="12"/>`
    + `<circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--gold)" stroke-width="12" `
    + `stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" `
    + `transform="rotate(-90 75 75)"/></svg>`
    + `<div class="num"><b>${score}</b><span>/ 100</span></div></div>`
    + `<div><div class="band">${esc(band)}</div></div></div>`;
}

function foot(): string {
  return `<div class="foot-run"><span>TalkToGuruji • Love Match Report</span><span>Confidential</span></div>`;
}

function sectionPage(id: string, prose: string, extra = ""): string {
  const n = id.replace("s", "");
  const nn = n.length < 2 ? "0" + n : n;
  const body = esc(prose).split("\n").map((para) => `<p class="body">${para}</p>`).join("");
  return `<div class="page">`
    + `<div class="eyebrow-s">Section ${nn}</div>`
    + `<h2 class="sec serif">${esc(SECTION_TITLES[id])}</h2><div class="rule"></div>`
    + extra + body + foot() + `</div>`;
}

export function buildReportHtml(facts: Facts, sections: Record<string, string>): string {
  const hi = facts.language === "hi";
  const nameA = facts.person_a?.first || facts.names?.a || "Person A";
  const nameB = facts.person_b?.first || facts.names?.b || "Person B";

  let sharedHtml = "";
  if (facts.shared && facts.shared.length) {
    sharedHtml = `<div class="shared">You share: `
      + facts.shared.map((x) => `<b>${esc(x)}</b>`).join(", ") + `.</div>`;
  }

  let pages = "";
  // Cover
  pages += `<div class="page cover">`
    + `<div class="mark">✦</div><div class="brand">TalkToGuruji</div>`
    + `<div class="acharya">Acharya Raghvendra Singh</div>`
    + `<div class="eyebrow">Compatibility Analysis</div>`
    + `<h1 class="serif">Love Match<br/>Report</h1>`
    + `<div class="names serif">${esc(nameA)} &amp; ${esc(nameB)}</div>`
    + `<div class="tagline">Honest, not just flattering.</div>`
    + `<div class="foot">© TalkToGuruji • Inno-One Service LLP</div></div>`;

  pages += sectionPage("s1", sections.s1 || "", dial(facts.score, facts.band) + sharedHtml);
  pages += sectionPage("s2", sections.s2 || "",
    `<div class="grid2">${personCol(nameA, facts.person_a)}${personCol(nameB, facts.person_b)}</div>`);

  for (const id of ["s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12", "s13"]) {
    const extra = id === "s5" && facts.chemistry ? pairStrip(facts.chemistry) : "";
    pages += sectionPage(id, sections[id] || "", extra);
  }

  return `<!DOCTYPE html><html lang="${hi ? "hi" : "en"}"><head><meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--ink:#26221C;--muted:#6B655A;--gold:#B8934A;--gold-soft:#EFE6D2;--line:#E4DECF;--cream:#FBF8F1;--cover1:#2A2140;--cover2:#17121F;--warm:#1D9E75;--cold:#C4553F;--neutral:#B6AE9C;}
*{box-sizing:border-box;margin:0;padding:0;}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{font-family:'Inter',sans-serif;color:var(--ink);background:#fff;}
body.hi{font-family:'Noto Sans Devanagari',sans-serif;}
.serif{font-family:'Fraunces',serif;}
body.hi .serif{font-family:'Noto Sans Devanagari',sans-serif;}
@page{size:A4;margin:0;}
.page{width:210mm;min-height:297mm;padding:22mm 20mm 18mm;position:relative;page-break-after:always;background:#fff;display:flex;flex-direction:column;}
.page:last-child{page-break-after:auto;}
.cover{background:linear-gradient(160deg,var(--cover1),var(--cover2));color:#fff;justify-content:flex-start;padding:30mm 20mm;}
.cover .mark{width:46px;height:46px;border:1.5px solid var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:20px;margin-bottom:14px;}
.cover .brand{color:var(--gold);font-weight:600;letter-spacing:.12em;font-size:15px;}
.cover .acharya{color:#C9C2D4;font-size:12px;margin-top:4px;letter-spacing:.04em;}
.cover .eyebrow{color:var(--gold);letter-spacing:.28em;font-size:12px;margin-top:42mm;text-transform:uppercase;}
.cover h1{font-size:58px;line-height:1.02;font-weight:600;margin-top:10px;}
.cover .names{color:var(--gold-soft);font-size:26px;margin-top:20px;font-weight:600;}
.cover .tagline{color:#E7E2F0;font-size:15px;margin-top:34mm;border-left:2px solid var(--gold);padding-left:12px;font-style:italic;}
.cover .foot{color:#9A93A8;font-size:11px;margin-top:auto;}
.eyebrow-s{color:var(--gold);letter-spacing:.22em;font-size:11px;text-transform:uppercase;font-weight:600;}
h2.sec{font-size:30px;font-weight:600;margin:6px 0 2px;line-height:1.1;}
.rule{width:46px;height:2px;background:var(--gold);margin:12px 0 20px;}
p.body{font-size:13.5px;line-height:1.72;color:#3A342B;margin-bottom:12px;}
.foot-run{margin-top:auto;padding-top:14px;color:var(--muted);font-size:10px;border-top:1px solid var(--line);display:flex;justify-content:space-between;}
.dial-wrap{display:flex;align-items:center;gap:26px;margin:6px 0 18px;}
.dial{position:relative;width:150px;height:150px;flex:none;}
.dial .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.dial .num b{font-size:40px;font-weight:700;}
.dial .num span{font-size:12px;color:var(--muted);}
.band{font-size:15px;font-weight:600;color:var(--gold);}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:6px;}
.person h3{font-family:'Fraunces',serif;font-size:19px;margin-bottom:10px;}
body.hi .person h3{font-family:'Noto Sans Devanagari',sans-serif;}
.numrow{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);}
.numrow .v{font-family:'Fraunces',serif;font-size:20px;font-weight:600;color:var(--gold);min-width:46px;}
.numrow .k b{display:block;font-size:12.5px;}
.numrow .k span{color:var(--muted);font-size:11px;}
.pairs{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 16px;}
.pair{display:flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:6px;padding:6px 10px;font-size:11px;background:var(--cream);}
.pair .dot{width:9px;height:9px;border-radius:50%;}
.pair small{color:var(--muted);}
.shared{background:var(--cream);border:1px solid var(--line);border-radius:8px;padding:12px 14px;font-size:12.5px;margin-top:8px;}
.shared b{color:var(--gold);}
</style></head><body class="${hi ? "hi" : ""}">${pages}</body></html>`;
}
