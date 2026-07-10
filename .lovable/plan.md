Make a targeted change to `supabase/functions/_shared/buildReportHtml.ts` so partner-branded PDFs (called by `partner-generate-full` with `showUpsell: false`) have no TalkToGuruji sign-off, while the consumer/finalize path (no `opts`) stays byte-identical.

### Change
In the s13 closing letter block, gate the sign-off `<div class="sign">...</div>` on `opts?.showUpsell !== false`. The existing sign-off line is preserved literally when the condition is true; when false, an empty string is concatenated instead.

### Before
```typescript
  // s13 closing letter
  const s13 = (S.s13 || {}) as { text?: string };
  const letterParas = esc(s13.text || "").split("\n").filter(Boolean).map((p) => `<p>${p}</p>`).join("");
  pages += `<div class="page">${head("s13", hi)}`
    + `<div class="letter">${letterParas}</div>`
    + `<div class="sign"><img src="${logoUrl}" alt="TalkToGuruji"/><span>${hi ? "सादर, TalkToGuruji" : "With warm regards, TalkToGuruji"}</span></div>`
    + frun(++pg, hi, footerOverride) + `</div>`;
```

### After
```typescript
  // s13 closing letter
  const s13 = (S.s13 || {}) as { text?: string };
  const letterParas = esc(s13.text || "").split("\n").filter(Boolean).map((p) => `<p>${p}</p>`).join("");
  const signoff = opts?.showUpsell === false
    ? ""
    : `<div class="sign"><img src="${logoUrl}" alt="TalkToGuruji"/><span>${hi ? "सादर, TalkToGuruji" : "With warm regards, TalkToGuruji"}</span></div>`;
  pages += `<div class="page">${head("s13", hi)}`
    + `<div class="letter">${letterParas}</div>`
    + signoff
    + frun(++pg, hi, footerOverride) + `</div>`;
```

### Constraints
- Only modify `supabase/functions/_shared/buildReportHtml.ts`.
- Do not touch `love-match-finalize`, `partner-generate-full/index.ts`, `admin-create-free-report`, or any other file.
- When `opts` is undefined, the output HTML for that block remains byte-identical to today.

### Deploy
Redeploy `partner-generate-full` so the updated shared `buildReportHtml.ts` is live.
