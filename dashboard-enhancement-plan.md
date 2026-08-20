# Dashboard Enhancement Plan — Lauren Intelligence Dashboard

## Top-Level Overview

The current dashboard renders all 13 section components in a single scrollable wall of cards (4 rows) with no page separation. The sidebar exists purely as a smooth-scroll anchor — clicking an item just jumps to a position within the same giant page. The UI uses 10–11px font throughout, inline styles everywhere, no charts beyond a basic SVG donut, no real visual hierarchy, and product names are hard-coded into the TCO table (e.g., the Vault TCO table still refers to `instana`/`datadog`/`dynatrace` column keys even though Vault's competitors are HashiCorp and CyberArk).

**Goal:** Transform each sidebar navigation item into a **dedicated full-screen page**, enrich every page with enhanced UI/UX, fix all data mis-mappings (especially TCO column names), add real public pricing context for all products and competitors, and make the entire dashboard dynamic so the correct data renders when any product is selected.

**Scope includes:**
1. Page-based navigation (each sidebar item = its own routed/state-driven page)
2. Enhanced UI/UX across all 9 pages (better typography, spacing, color use, charts)
3. Fully dynamic column labels (no more hard-coded "instana/datadog/dynatrace")
4. Real indicative pricing data for all 4 IBM products and 6 competitor products
5. TCO Comparison page redesigned to show per-product vs competitor pricing properly
6. Win/Loss page with proper competitor label mapping
7. All sidebar items wired to separate, distinct pages

**Tech stack:** React 19 + Vite, Express + MongoDB, existing CSS variables — no new libraries needed.

---

## Sub-Tasks

---

### Sub-Task 1 — Page-Based Navigation Architecture

**Intent:** Replace the single-scroll wall with a page router. Each sidebar item maps to a dedicated full-page component. The `DashboardPage.jsx` renders only the active page based on `activeNav` state.

**Expected Outcomes:**
- Clicking any sidebar item instantly shows only that section's content in a full main-area view
- Sidebar highlights the active item
- The active page fills the entire main content area
- No more "scroll to anchor" — sidebar drives a state switch

**Todo List:**
1. In `DashboardPage.jsx`, replace the 4-row all-in-one layout with a `renderPage(activeNav)` switch/map that returns the correct page component
2. Remove all `id=` anchor attributes used for scroll from section components (they are no longer needed)
3. Keep `activeNav` state as-is; the sidebar already calls `onSelect`
4. Create a wrapper `<PageContainer>` styled div that takes full height of main area, with its own overflow-y scroll
5. Update `Sidebar.jsx` to remove the `scrollIntoView` call — just call `onSelect(item.id)`

**Relevant Context:**
- `client/src/pages/DashboardPage.jsx` — orchestrator, needs the switch logic
- `client/src/components/Sidebar.jsx` — remove scroll call, keep `onSelect`
- All section components in `client/src/components/sections/`

**Status:** [ ] pending

---

### Sub-Task 2 — Enhanced Sidebar UI

**Intent:** Redesign the sidebar to look polished and modern — wider, better icons, clear active/hover states, product context badge at the bottom.

**Expected Outcomes:**
- Sidebar is 160px wide with a cleaner icon + label layout
- Active item has a left accent bar + subtle highlight + white text
- Non-active items have softer muted text with a subtle hover effect
- A small product context badge at the bottom shows the currently selected product (e.g., "Instana")
- Icons are replaced with proper emoji or unicode symbols that visually match each section

**Todo List:**
1. Update `Sidebar.jsx` styles: increase width to 160px, increase padding, larger font (12px), improve icon sizing (22px)
2. Add a bottom "context badge" showing the current product name from `useSelection()`
3. Improve hover transition (background highlight on entire row width)
4. Add a thin divider line between groups (Overview + Product group, then Analysis group, then Sales tools group)
5. Add tooltips on narrow view (title attribute)

**Relevant Context:**
- `client/src/components/Sidebar.jsx`
- `client/src/context/SelectionContext.jsx` — to pull current product name

**Status:** [ ] pending

---

### Sub-Task 3 — Fix Dynamic Column Labels in TCO & Feature Matrix

**Intent:** The current `TcoComparison.jsx` and `FeatureMatrix.jsx` hard-code "instana", "datadog", "dynatrace" as column keys. When Vault is selected (competitors: HashiCorp, CyberArk), the columns still say "instana/datadog/dynatrace". The data keys in `vault.js` also incorrectly reuse `instana`/`datadog`/`dynatrace` as property names for a non-Instana product.

**Expected Outcomes:**
- TCO table column headers show the actual product and competitor names from the currently selected product's data
- Bar chart labels are the actual competitor names
- Feature matrix dots map correctly to each product/competitor
- The seed data for `vault.js` and `wiz.js` are corrected to use generic keys (`product`, `comp1`, `comp2`) with a `labels` object providing display names

**Todo List:**
1. Update the data schema in `tcoData` and `featureMatrix` to use generic keys: `{ labels: { product, comp1, comp2 }, rows: [{ component, product, comp1, comp2 }], totals: { product, comp1, comp2 }, maxValue }`
2. Update `server/seed/instana.js`, `vault.js`, `wiz.js`, `datadog.js` with the new schema
3. Update `server/models/Dashboard.js` schema to reflect the new structure if it uses strict typing
4. Update `TcoComparison.jsx` to read `tcoData.labels` for column headers and bar labels
5. Update `FeatureMatrix.jsx` to read `featureMatrix.labels` for column headers (the feature matrix rows also need generic keys)
6. Update `WinLoss.jsx` to use dynamic competitor labels (currently hard-codes "Datadog" / "Dynatrace")
7. Re-run `npm run seed` to reload MongoDB with the corrected data

**Relevant Context:**
- `server/seed/instana.js`, `vault.js`, `wiz.js`, `datadog.js`
- `client/src/components/sections/TcoComparison.jsx`
- `client/src/components/sections/FeatureMatrix.jsx`
- `client/src/components/sections/WinLoss.jsx`
- `server/models/Dashboard.js`

**Status:** [ ] pending

---

### Sub-Task 4 — Enrich Product Data with Real Pricing & Competitor Details

**Intent:** Add real-world indicative public pricing data for all 4 IBM products and their 6 competitors. Also add a 5th seed product (Datadog as standalone, already exists) with its proper competitors. This forms the foundation for the TCO and pricing comparison pages.

**Expected Outcomes:**
- Every product seed file has detailed, realistic pricing tiers sourced from public pricing pages
- Each product has a `pricingTiers` object (free tier / starter / professional / enterprise) with monthly/annual costs and features included
- Competitor data also includes real pricing comparisons
- The data is rich enough for a "Pricing" sub-section within the TCO page

**Pricing Data to Include (realistic/indicative from public sources):**

| Product | Product Pricing | Competitor 1 | Competitor 2 |
|---------|----------------|--------------|--------------|
| **IBM Instana** | $75/host/mo (SaaS), $150K+/yr enterprise | Datadog: $15-$23/host/mo infra, $31/host APM | Dynatrace: $0.08/hr full-stack host |
| **IBM Vault** (Secrets Manager) | $0.20/secret/mo (IBM Cloud), $1K/mo floor | HashiCorp Vault Enterprise: $30K+/yr | CyberArk: $50K-$200K+/yr |
| **Wiz** | ~$25K-$150K+/yr based on cloud spend | Prisma Cloud: $30K-$200K+/yr workloads | Orca Security: ~$20K-$100K/yr |
| **Datadog** | $15/host infra, $31/host APM, $27 logs/mo | New Relic: $0/free, $49 Full Stack | Dynatrace: $69/mo full-stack |

**Todo List:**
1. Add `pricingTiers` and `realPricing` fields to each seed file with per-tier breakdown
2. Add `competitorPricing` object to each seed file with competitor tier data
3. Ensure all `tcoData` rows use the corrected generic schema from Sub-Task 3
4. Add a new `instana.js` competitor pricing entry for Datadog with public tier data
5. Update MongoDB seed to capture new fields

**Relevant Context:**
- `server/seed/instana.js`, `vault.js`, `wiz.js`, `datadog.js`
- `server/seed/index.js`
- `server/models/Dashboard.js`

**Status:** [ ] pending

---

### Sub-Task 5 — Overview Page (Full-Screen)

**Intent:** Transform the Overview section into a rich, full-page product overview experience — not a small card, but the full main area.

**Expected Outcomes:**
- Full-width hero section with product logo, name, tagline, and market position badge
- 2-column layout: left column has product metadata, right column has key highlights (top 3 strengths, win rate badge, market position)
- A "Quick Stats" bar below hero: # of customers, win rate, TCO advantage, competitors tracked
- Smooth, professional visual design using existing CSS variables

**Todo List:**
1. Create `client/src/pages/sections/OverviewPage.jsx` (new full-page component wrapping the data from `overview`, `winLoss`, `strengths`, `keyCustomers`)
2. Design the hero section with product name in large type, logo emoji large, category badge, deployment badge
3. Add quick stats row (4 stat boxes: win rate, total customers, avg TCO savings, competitors tracked)
4. Add a 2-column detail area: left = product meta table, right = top 3 strengths + top winning messages
5. Keep the component null-safe (if data is still loading, show a skeleton)

**Relevant Context:**
- `client/src/components/sections/ProductOverview.jsx` (existing, to be redesigned as full page)
- Data props: `data.overview`, `data.winLoss`, `data.strengths`, `data.keyCustomers`

**Status:** [ ] pending

---

### Sub-Task 6 — Product Details Page (Full-Screen)

**Intent:** Combine Key Features, Discovery Questions, Recommended Responses, Strengths, and Weaknesses into one rich Product Details page.

**Expected Outcomes:**
- Top section: 4-column feature grid with larger cards (icon + name + short description if available)
- Middle section: 2-column layout — Discovery Questions (left) + Recommended Responses (right) with visual pairing
- Bottom section: side-by-side Strengths (green) and Weaknesses (red) columns with visual icon rows

**Todo List:**
1. Create `client/src/pages/sections/ProductDetailsPage.jsx`
2. Design the features grid section with proper card styling (larger icons, subtle border, hover effect)
3. Design the Q&A section with numbered questions paired with answer cards
4. Design the Strengths/Weaknesses columns with color-coded rows
5. Remove these sections from the old all-in-one layout

**Relevant Context:**
- `client/src/components/sections/KeyFeatures.jsx`
- `client/src/components/sections/DiscoveryQuestions.jsx`
- `client/src/components/sections/RecommendedResponses.jsx`
- `client/src/components/sections/Strengths.jsx`
- `client/src/components/sections/Weaknesses.jsx`

**Status:** [ ] pending

---

### Sub-Task 7 — Competitive Analysis Page (Full-Screen)

**Intent:** Combine CompetitorSummary and FeatureMatrix into one rich full-page competitive analysis view.

**Expected Outcomes:**
- Top section: Competitor cards — 2 wide cards side by side, each showing logo, name, overview text, strengths list, weaknesses list, market position badge
- Bottom section: Full-width Feature Matrix table with color-coded dots (green/yellow/red), larger rows, better spacing, product name dynamic column headers
- A "battle card" feel — clear at-a-glance comparison

**Todo List:**
1. Create `client/src/pages/sections/CompetitiveAnalysisPage.jsx`
2. Design the competitor profile cards with visual hierarchy (name large, overview medium, lists small)
3. Design the feature matrix with proper table styling (alternating row backgrounds, larger dot indicators)
4. Wire dynamic column headers from `featureMatrix.labels` (from Sub-Task 3)
5. Add a "competitive summary" paragraph at top describing the competitive landscape

**Relevant Context:**
- `client/src/components/sections/CompetitorSummary.jsx`
- `client/src/components/sections/FeatureMatrix.jsx`
- Dynamic labels from Sub-Task 3

**Status:** [ ] pending

---

### Sub-Task 8 — TCO Comparison Page (Full-Screen)

**Intent:** Make the TCO page the flagship pricing intelligence page — full-screen, rich charts, real pricing tiers, and a clear "why IBM wins on cost" narrative.

**Expected Outcomes:**
- A large horizontal bar chart (CSS-based) showing total 3-year TCO per product with dollar labels
- A detailed breakdown table with proper color-coded columns using actual product/competitor names
- A "Pricing Tiers" section below the TCO — shows per-tier pricing for the IBM product vs each competitor (monthly/annual breakdown)
- A "TCO Advantage" callout box highlighting how much cheaper IBM's product is vs each competitor
- All column names are dynamic (from `tcoData.labels`)

**Todo List:**
1. Create `client/src/pages/sections/TcoComparisonPage.jsx` (full-page version of TcoComparison)
2. Design the enhanced bar chart section (taller bars, percentage labels, clear legend)
3. Design the breakdown table with color-coded product columns
4. Add a Pricing Tiers section reading from `pricingTiers` data (added in Sub-Task 4)
5. Add a "TCO Advantage" callout box (e.g., "Instana saves $170K vs Datadog over 3 years")
6. Ensure all labels come from `tcoData.labels` (dynamic)

**Relevant Context:**
- `client/src/components/sections/TcoComparison.jsx` (to be superseded by full-page version)
- `tcoData.labels`, `tcoData.rows`, `tcoData.totals` (updated schema from Sub-Task 3)
- `pricingTiers` (added in Sub-Task 4)

**Status:** [ ] pending

---

### Sub-Task 9 — Case Studies Page (Full-Screen)

**Intent:** Transform case studies into a rich full-page view with 3 large story cards.

**Expected Outcomes:**
- 3 large case study cards arranged in a responsive grid (3 columns on wide, 1 on narrow)
- Each card has: customer type badge (colored), company name large, challenge section (with problem icon), result section (with impact number highlighted)
- A sidebar list of all key customers with logos visible

**Todo List:**
1. Create `client/src/pages/sections/CaseStudiesPage.jsx`
2. Design large case study cards with distinct challenge/result visual sections
3. Add a compact customer logos strip at the bottom using `keyCustomers` data
4. Style result numbers/stats in large bold colored type for visual impact

**Relevant Context:**
- `client/src/components/sections/CaseStudies.jsx`
- `client/src/components/sections/KeyCustomers.jsx`
- Data: `data.caseStudies`, `data.keyCustomers`

**Status:** [ ] pending

---

### Sub-Task 10 — Customers Page (Full-Screen)

**Intent:** Give customers their own dedicated page — not just a row of emoji logos but a proper customer showcase.

**Expected Outcomes:**
- Large logo/emoji grid with customer names under each
- A "Customer Win Highlights" section pulling from case study results
- Win rate stats contextualized per customer segment if data allows

**Todo List:**
1. Create `client/src/pages/sections/CustomersPage.jsx`
2. Design the customer showcase grid (larger cards, name + industry segment if available)
3. Add customer win highlights section with a brief stat from each relevant case study
4. Style with a clean white card layout per customer

**Relevant Context:**
- `client/src/components/sections/KeyCustomers.jsx`
- Data: `data.keyCustomers`, `data.caseStudies`

**Status:** [ ] pending

---

### Sub-Task 11 — Objection Handling Page (Full-Screen)

**Intent:** Make the objection handling page a full interactive-feeling battle card page.

**Expected Outcomes:**
- Each objection-response pair displayed as a large card
- Objection in a "customer voice" style (italic, colored border, speech bubble feel)
- Response in a clear response block with a confirm icon
- Cards are visually distinct and easy to scan

**Todo List:**
1. Create `client/src/pages/sections/ObjectionHandlingPage.jsx`
2. Design the objection cards with speech-bubble styling for the objection text
3. Design the response block with a green confirm icon and clean response text
4. Lay out in a 2-column grid (2 objections per row)

**Relevant Context:**
- `client/src/components/sections/ObjectionHandling.jsx`
- Data: `data.objectionHandling`

**Status:** [ ] pending

---

### Sub-Task 12 — Win/Loss Intelligence Page (Full-Screen)

**Intent:** Transform the win/loss section into a full analytics-style page with bigger stats and richer visuals.

**Expected Outcomes:**
- 4 large KPI stat boxes across the top (total, won, lost, win rate %) with color coding
- A larger donut chart (120px) in the center with competitor breakdown
- The donut uses dynamic competitor labels (not hard-coded "Datadog/Dynatrace")
- Top Winning Messages list with visual emphasis (numbered + bold)
- A "Win Rate Trend" placeholder section (static visual for now)

**Todo List:**
1. Create `client/src/pages/sections/WinLossPage.jsx`
2. Design large KPI stat boxes (larger font, padding, color-coded borders)
3. Scale up the SVG donut chart to 150px and adjust stroke width
4. Fix dynamic competitor labels — read from `winLoss.competitors` array (or use `data.competitors` string from context)
5. Style the Top Winning Messages as a numbered list with bold highlights
6. Update the seed data in `vault.js` and `wiz.js` to use the correct competitor names in `winLoss` labels (currently `vsDatadog`/`vsDynatrace` even for Vault and Wiz)

**Relevant Context:**
- `client/src/components/sections/WinLoss.jsx`
- Data: `data.winLoss`, `data.competitors`
- `server/seed/vault.js`, `wiz.js` — fix `vsDatadog`/`vsDynatrace` field names

**Status:** [ ] pending

---

### Sub-Task 13 — AI Sales Coach Page (Full-Screen)

**Intent:** Elevate the AI Sales Coach into a proper full-page AI assistant feel with clear visual sections.

**Expected Outcomes:**
- A prominent "AI Insight" box at the top with the customer objection and suggested response
- Case study recommendation card
- Win probability badge (large, prominent, color-coded)
- Key Value Points in a 2-column grid of badge-style tags
- A "Related Objections" section linking to the objection handling page

**Todo List:**
1. Create `client/src/pages/sections/AiSalesCoachPage.jsx`
2. Design the AI Insight box with a distinct background (e.g., subtle gradient or bordered card)
3. Design the case study recommendation as a mini card
4. Make the win probability badge large and prominent (circle with color)
5. Design KVPs as styled pill/badge tags in a wrap layout
6. Add a "Related Objections" link/button that navigates to the objections page

**Relevant Context:**
- `client/src/components/sections/AiSalesCoach.jsx`
- Data: `data.aiCoach`

**Status:** [ ] pending

---

### Sub-Task 14 — Global UI Polish (CSS + Header)

**Intent:** Upgrade the global CSS and Header to match the new page-based design system. Better typography, improved header layout, refined color palette.

**Expected Outcomes:**
- `index.css` updated: larger base font (14px), better heading scales, improved card shadow, refined spacing variables
- Header: better visual weight, product name shown prominently, cleaner dropdown styling
- Page titles (each page component has a consistent `<PageTitle>` styled heading)
- Consistent page padding and max-width container for all pages
- Scrollbars styled (thin, dark)

**Todo List:**
1. Update `client/src/index.css` — increase base font to 14px, add `--shadow-card`, `--radius-card` variables, add `.page-header` class, add `.page-container` class
2. Add new CSS classes: `.kpi-box`, `.badge`, `.pill-tag`, `.donut-legend`, `.price-tier-card`
3. Update `Header.jsx` to show current product name more prominently
4. Add thin custom scrollbar styles

**Relevant Context:**
- `client/src/index.css`
- `client/src/components/Header.jsx`

**Status:** [ ] pending

---

## Implementation Order

The sub-tasks should be executed in this sequence to avoid broken intermediate states:

```
Sub-Task 3  → Fix data schema (tcoData/featureMatrix dynamic keys)
Sub-Task 4  → Enrich seed data with real pricing
Sub-Task 1  → Page navigation architecture (shell / routing)
Sub-Task 2  → Enhanced sidebar
Sub-Task 14 → Global CSS polish
Sub-Task 5  → Overview page
Sub-Task 6  → Product details page
Sub-Task 7  → Competitive analysis page
Sub-Task 8  → TCO comparison page
Sub-Task 9  → Case studies page
Sub-Task 10 → Customers page
Sub-Task 11 → Objection handling page
Sub-Task 12 → Win/loss page
Sub-Task 13 → AI sales coach page
```

Sub-Tasks 3 and 4 must run first because they fix the data layer that all page components depend on.
Sub-Task 1 must run before any page component sub-tasks.
Sub-Tasks 5–13 can be done in any order after Sub-Tasks 1, 3, 4 are complete.

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page routing mechanism | React state (`activeNav`) — full page switch, no scroll anchors | Each sidebar item replaces main content entirely — confirmed by user |
| Chart library | **Recharts** (`npm install recharts --prefix client`) | Animated bar charts, pie/donut, tooltips — confirmed by user |
| Pricing detail level | Full tier table per product: Free / Starter / Professional / Enterprise | Monthly + annual costs from public sources — confirmed by user |
| Data schema for TCO/FeatureMatrix | Generic keys with `labels` metadata object | Decouples column identity from product name; fixes vault/wiz mis-mapping |
| New page components location | `client/src/pages/sections/` | Distinguishes page-level from card-level components |
| Pricing data source | Indicative/public pricing in seed files + `pricingTiers` object | No live API needed; data is for internal sales intelligence |

## Confirmed User Choices

1. **Pricing**: Full pricing tier table per product (Free / Starter / Professional / Enterprise) with monthly + annual costs from public sources
2. **Navigation**: Full page switch — each sidebar item replaces main content entirely, no scroll anchors
3. **Charts**: Add Recharts library for animated bar charts, donut/pie charts, and interactive tooltips

## Sub-Task 0 — Install Recharts (Pre-requisite, first step)

**Intent:** Install the Recharts charting library as a client dependency before any page components that use it are built.

**Expected Outcomes:**
- `recharts` appears in `client/package.json` under `dependencies`
- `npm install recharts` completes without errors

**Todo List:**
1. Run `npm install recharts --prefix client` from workspace root
2. Verify `recharts` entry exists in `client/package.json`

**Relevant Context:**
- `client/package.json`

**Status:** [ ] pending
