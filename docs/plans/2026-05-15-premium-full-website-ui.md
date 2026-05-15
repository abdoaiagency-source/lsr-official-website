# Premium Full Website UI Implementation Plan

> **For Hermes:** Use `premium-frontend-engineer` throughout. Do not implement until the plan is approved. If implementation starts later, execute task-by-task with visual QA after each coherent pass.

**Goal:** Upgrade the full LSR official website from a good single-page landing page into a consistently premium, credible Arabic/RTL service-company website across every visible section.

**Architecture:** Keep the current Next.js single-page structure and static content model. Improve component semantics, section composition, visual hierarchy, and responsive behavior without adding unnecessary dependencies. The design direction is official/editorial: restrained navy/paper/gold palette, real operational process, legally conservative copy, and no AI-ish decoration.

**Tech Stack:** Next.js App Router, TypeScript, React server component page, CSS/Tailwind entry in `src/app/globals.css`, static content in `src/lib/content.ts`, Vercel deployment.

---

## Current Structure

**Files inspected:**
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/lib/content.ts`

**Visible sections:**
1. Hero/navigation
2. Intro / company positioning
3. Services
4. Process / workflow
5. Sectors
6. Why LSR
7. Contact
8. Footer

**Current issue:** The hero has improved, but the full page still needs a complete premium pass. Some sections still feel like card grids from a generated landing page rather than a cohesive official service-company site.

---

## Premium Design Direction

The site should feel like:

> A serious Libyan official service company managing sensitive labor/residency operations for businesses.

It should not feel like:

> A generic AI/SaaS landing page with repeated cards, pills, and decorative template sections.

### Visual principles

- Use restrained navy, ink, paper, ivory, and controlled gold/copper accent.
- Prefer editorial layouts: split sections, timelines, annotated panels, institutional blocks.
- Avoid excessive gradients, glassmorphism, repeated equal cards, fake metrics, and decorative floating objects.
- Make every section communicate a business purpose: scope, process, risk reduction, operational trust, contact path.
- Arabic typography must breathe: comfortable line height, no cramped headings, no over-tight tracking on Arabic text.

---

## Task 1: Strengthen the Content Model

**Objective:** Add structured content that supports richer premium sections without hardcoding everything in JSX.

**Files:**
- Modify: `src/lib/content.ts`

**Steps:**
1. Add a `serviceGroups` or enriched `services` structure with:
   - `title`
   - `text`
   - `scope` or `items`
   - optional `riskReduced`
2. Add a `trustPrinciples` array for credible “why” content instead of generic benefit cards.
3. Add a `contactIntake` array for what the client should send before contacting.
4. Keep all wording legally conservative; avoid guarantees.

**Verification:**
- Run `npm run typecheck` after JSX updates later.
- No fake statistics or invented certifications.

---

## Task 2: Refactor `page.tsx` into Clear Section Blocks

**Objective:** Make the page structure easier to scan and more intentional before styling.

**Files:**
- Modify: `src/app/page.tsx`

**Steps:**
1. Keep `SectionLabel`.
2. Add small presentational helpers if useful:
   - `SectionHeader`
   - `ServiceArticle`
   - `NumberedStep`
3. Reorder/reshape content into a stronger story:
   - Hero: promise + methodology panel.
   - Intro: company role and operating posture.
   - Services: grouped official scope, not six equal generic cards only.
   - Process: timeline/checkpoint system.
   - Sectors: compact institutional sector matrix.
   - Trust: principles/risk-reduction panel.
   - Contact: intake checklist + direct contact card.
   - Footer: official compact footer with navigation/contact.
4. Preserve RTL and semantic HTML.

**Verification:**
- JSX remains server-component friendly.
- Navigation anchors still work: `#services`, `#process`, `#sectors`, `#contact`.

---

## Task 3: Make Services Feel Premium and Operational

**Objective:** Replace “six cards in a grid” feeling with a more official service-scope presentation.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Steps:**
1. Use one featured service/scope panel and a supporting grid/list.
2. Add small structured labels like “النطاق”, “المتابعة”, or “تقليل المخاطر” only if backed by content.
3. Reduce heavy shadows; use borders, spacing, and typography instead.
4. Ensure cards are not identical SaaS boxes; vary hierarchy intentionally.

**Verification:**
- The services section should answer: “What exactly do they manage?”
- No section should rely on decorative numbers alone for sophistication.

---

## Task 4: Upgrade Process into a Premium Timeline

**Objective:** Make the workflow look like an accountable operational sequence.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Steps:**
1. Replace simple stacked process rows with a refined timeline/checkpoint layout.
2. Include a side note/panel explaining what the client prepares or what LSR tracks.
3. Keep step numbers but make them secondary to meaning.
4. Ensure mobile timeline does not become cramped.

**Verification:**
- On desktop, process should feel like a serious operating model.
- On mobile, each step should be readable without horizontal overflow.

---

## Task 5: Redesign Sectors and Why Sections

**Objective:** Remove generic pill/card feeling and make sectors/trust feel institutional.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Steps:**
1. Convert sectors from simple equal pills into a compact matrix/list with stronger section framing.
2. Convert “why” reasons into trust principles or risk-reduction statements.
3. Use subtle dividers and editorial spacing instead of many isolated boxes.
4. Keep sector labels short and scannable.

**Verification:**
- The section should not look like an AI-generated tag cloud.
- The trust section should explain why clients would rely on LSR.

---

## Task 6: Premium Contact / Conversion Section

**Objective:** Make the final contact area feel trustworthy and action-oriented.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Steps:**
1. Add an intake checklist: sector, number of workers, roles, timing, current status.
2. Keep email/phone/address direct and readable.
3. Add clear primary action: email contact.
4. Avoid fake chat widgets or forms unless they are actually implemented.
5. Make mobile contact details wrap safely.

**Verification:**
- User knows exactly what to send.
- Contact card does not overflow on 390px width.

---

## Task 7: Global CSS Premium System Pass

**Objective:** Make all sections share one mature design language.

**Files:**
- Modify: `src/app/globals.css`

**Steps:**
1. Introduce reusable section/panel classes if helpful:
   - `.shell`
   - `.section-header`
   - `.eyebrow`
   - `.panel`
   - `.split-panel`
2. Normalize spacing rhythm across sections.
3. Reduce repeated large shadows.
4. Use border/divider systems for institutional polish.
5. Tune mobile typography and spacing.
6. Add `@media (prefers-reduced-motion: reduce)` if any transitions become more prominent.

**Verification:**
- Desktop: cohesive visual rhythm from top to bottom.
- Mobile: no section feels squeezed or like raw stacked divs.

---

## Task 8: Local Quality Gates

**Objective:** Catch code issues before visual QA.

**Files:**
- No source changes unless fixing errors.

**Commands:**
```bash
cd /opt/data/lsr-official-website
npm run typecheck
npm run lint
npm run build
```

**Expected:**
- TypeScript passes.
- ESLint passes.
- Next.js production build passes.

---

## Task 9: Desktop and Mobile Visual QA

**Objective:** Verify the redesign actually looks premium, not just different.

**Files:**
- No source changes unless fixing QA blockers.

**Commands:**
```bash
cd /opt/data/lsr-official-website
npm run start -- --hostname 127.0.0.1 --port 3008
PLAYWRIGHT_BROWSERS_PATH=/opt/data/.cache/ms-playwright npx playwright@latest screenshot --viewport-size=1440,1200 --full-page http://127.0.0.1:3008 /tmp/lsr-qa/full-premium-desktop.png
PLAYWRIGHT_BROWSERS_PATH=/opt/data/.cache/ms-playwright npx playwright@latest screenshot --viewport-size=390,1200 --full-page http://127.0.0.1:3008 /tmp/lsr-qa/full-premium-mobile.png
```

**Review checklist:**
- Does a real business owner trust it?
- Does any section still look like AI template output?
- Are Arabic headings readable and balanced?
- Are services/process/contact clear?
- No overflow at 390px mobile.
- No generic floating/glass decoration.
- No fake metrics or claims.

---

## Task 10: Commit, Push, Deploy, Verify

**Objective:** Ship only after checks and visual QA pass.

**Files:**
- Commit modified source files.

**Commands:**
```bash
cd /opt/data/lsr-official-website
git status --short
git add src/app/page.tsx src/app/globals.css src/lib/content.ts
git commit -m "style: premium full-site UI redesign"
git push origin main
```

If normal push auth fails, use the existing environment token fallback already used in this repo.

Deploy:
```bash
set -a
. /opt/data/.env
set +a
npx vercel@latest --prod --token "$VERCEL_TOKEN" --yes
```

Verify:
```bash
curl -L -s -o /tmp/lsr-live-premium.html -w '%{http_code}' https://lsr-official-website.vercel.app
```

Expected:
- HTTP 200.
- Page title remains `الإقامة الآمنة الليبية للخدمات العمالية`.
- New unique premium content marker appears in live HTML.

---

## Definition of Done

- Full website feels cohesive and premium from hero to footer.
- No section looks like generic AI/SaaS-template output.
- Arabic RTL typography and layout are clean on desktop and mobile.
- Services/process/trust/contact all communicate real operational value.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- Desktop/mobile screenshots are reviewed.
- Changes are committed, pushed, deployed, and verified on canonical Vercel URL.
