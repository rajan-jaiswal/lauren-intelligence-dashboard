# Product Data Engine Plan — Lauren Intelligence Dashboard

## Top-Level Overview

**Goal:** Build a full-stack "Product Data Engine" — a new page inside the existing Lauren Intelligence Dashboard where the team can upload or type in product and competitor information (structured or unstructured, any format), have Google Gemini AI auto-generate all missing product intelligence fields, and have everything stored in MongoDB with real-time sync to all open dashboard tabs.

**Scope:**
1. **Backend foundation** — Create the Express server entry point, MongoDB connection, Mongoose models, and REST + WebSocket/SSE API layer (the server directory currently has no entry point, models, or routes).
2. **Gemini AI service** — A server-side module that sends product/competitor names + any uploaded data to Gemini and streams back a fully structured product intelligence document.
3. **MongoDB data layer** — Migrate the 5 existing static products (Instana, IBM MQ, IBM Sterling, Turbonomic, AWS) into MongoDB via a seed script; all dashboard reads come from the database going forward.
4. **Product Upload Page (UI)** — A new page accessible from the dashboard sidebar where the team fills a form (product name, description, competitor names) and optionally uploads a file (CSV, JSON, Excel). AI fills in all missing fields and saves the result.
5. **Competitor Profile auto-generation** — When a competitor name is entered (manually or in a file), Gemini generates a full competitor profile that populates both the Competitive Analysis page and a standalone Competitor Profile card.
6. **Real-time dashboard sync** — Server-Sent Events (SSE) push product/competitor additions to all open dashboard tabs immediately; Gemini streaming is used to show a live progress indicator during AI generation.
7. **Frontend data layer migration** — Replace the static `dashboardData.js` with Axios API calls; the dashboard reads all product data from MongoDB.

**What is NOT in scope:**
- Authentication / user login
- Multi-tenant or role-based access
- Editing or deleting existing products (view-only for now)
- Deployment / hosting

**Tech stack additions:**
- `@google/generative-ai` (Gemini Node.js SDK) — backend only
- `multer` — file upload handling on Express
- `xlsx` — Excel file parsing on server
- `socket.io` or native SSE — real-time push (SSE chosen, no extra client lib needed)
- `dotenv` — environment variables for API keys

---

## What I Need From You

Before implementation starts, please provide the following:

| Item | Where to put it |
|------|----------------|
| **Google Gemini API key** | Will be stored in `server/.env` as `GEMINI_API_KEY=<your-key>` |
| **MongoDB connection string** | Will be stored in `server/.env` as `MONGO_URI=mongodb://localhost:27017/lauren-dashboard` (or your custom URI) |
| Confirm Node.js is installed on your machine (`node --version`) | Just run this in terminal and tell me the version |
| Confirm MongoDB is running locally (`mongod --version`) | Just run this in terminal and tell me the version |

I will create the `.env` file template — you fill in the actual values.

---

## Architecture Diagram

```
Browser Tabs
   │
   │  HTTP (Axios)   SSE (/api/events)   File Upload (multipart)
   ▼
Express Server  (server/index.js)
   │
   ├── /api/products         GET all products (from MongoDB)
   ├── /api/products/:id     GET single product
   ├── /api/products         POST add product (form + file)
   ├── /api/products/generate  POST trigger Gemini AI generation
   ├── /api/competitors      POST add competitor to product
   └── /api/events           GET SSE stream (real-time push)
   │
   ├── Gemini AI Service  (server/services/gemini.js)
   │       └── Streams structured product JSON from Gemini 1.5 Pro
   │
   ├── File Parser  (server/services/fileParser.js)
   │       └── Parses CSV / JSON / Excel uploads into JS object
   │
   └── MongoDB via Mongoose  (server/models/Product.js)
           └── Products collection (all 5 existing + new ones)
```

---

## Data Model

All products stored in MongoDB follow this unified schema (a superset of the existing static data structure):

```js
{
  practice: String,           // "IBM" | "AWS"
  product: String,            // "Instana" | "IBM MQ" | etc.
  competitors: String,        // "Datadog, Dynatrace"
  overview: { ... },
  keyFeatures: [ ... ],
  discoveryQuestions: [ ... ],
  recommendedResponses: [ ... ],
  strengths: [ ... ],
  weaknesses: [ ... ],
  caseStudies: [ ... ],
  keyCustomers: [ ... ],
  competitorSummary: [ ... ],
  featureMatrix: { labels: { product, comp1, comp2 }, rows: [ ... ] },
  tcoData: { labels: { product, comp1, comp2 }, rows: [ ... ], totals: { ... }, maxValue },
  objectionHandling: [ ... ],
  winLoss: { ... },
  aiCoach: { ... },
  pricingTiers: [ ... ],      // AI-generated
  rawInputData: Object,       // whatever the team uploaded (stored as-is)
  aiGenerated: Boolean,       // true if Gemini filled in the fields
  createdAt: Date,
  updatedAt: Date
}
```

---

## Sub-Tasks

---

### Sub-Task 1 — Backend Foundation: Server Entry Point + MongoDB Connection

**Intent:** Create the Express server that was stubbed but never implemented. This is the absolute prerequisite for everything else — without it no API calls, no database writes, and no AI calls work.

**Expected Outcomes:**
- `server/index.js` exists and starts a working Express server on port 5000
- MongoDB connects successfully on `MONGO_URI` from `.env`
- CORS is configured to allow the Vite dev server (`http://localhost:5173`)
- A health-check route `GET /api/health` returns `{ status: "ok" }`
- `server/package.json` is created (currently missing) with proper start/dev scripts
- `server/.env.example` documents the required environment variables

**Todo List:**
1. Create `server/package.json` with dependencies: `express`, `mongoose`, `cors`, `dotenv`, `multer`, `xlsx`, `@google/generative-ai`; scripts: `dev` (nodemon), `start` (node), `seed` (node seed/index.js)
2. Create `server/.env.example` with `GEMINI_API_KEY=`, `MONGO_URI=`, `PORT=5000`
3. Create `server/index.js` — Express app with `cors`, `express.json()`, MongoDB connect via `mongoose.connect(process.env.MONGO_URI)`, mount router placeholder, listen on `PORT`
4. Add `GET /api/health` route returning `{ status: "ok", db: mongoose.connection.readyState }`
5. Test: run `npm run dev` in `server/`, check health endpoint responds

**Relevant Context:**
- `server/` directory (currently empty except models/routes/seed folders and package-lock.json)
- `server/package-lock.json` — existing lock file shows mongoose 8.4.0, express 4.19.2, cors, dotenv already locked (just need package.json)

**Status:** [ ] pending

---

### Sub-Task 2 — MongoDB Product Model + Seed Script

**Intent:** Define the Mongoose schema for products (matching the data structure above) and run a seed script that migrates the 5 existing static products from `client/src/dashboardData.js` into MongoDB. After this sub-task, the database is the single source of truth.

**Expected Outcomes:**
- `server/models/Product.js` defines a complete Mongoose schema covering all existing data fields plus new fields (`pricingTiers`, `rawInputData`, `aiGenerated`, `createdAt`, `updatedAt`)
- `server/seed/index.js` reads the existing static product data and inserts all 5 products into MongoDB (idempotent — uses `upsert` so re-running is safe)
- Running `npm run seed` (from server/) populates the `products` collection in MongoDB
- The 5 products appear in the `products` collection with correct data

**Todo List:**
1. Create `server/models/Product.js` — Mongoose schema with all fields from the data model above; use `Mixed` type for `rawInputData` to accept anything
2. Create `server/seed/products.js` — copy and convert the 5 existing products from `dashboardData.js` into individual seed objects (keep data identical)
3. Create `server/seed/index.js` — connects to MongoDB, runs `Product.bulkWrite` with `upsert` on `{ practice, product }`, then disconnects
4. Add `"seed": "node seed/index.js"` script to `server/package.json`
5. Run `npm run seed` and verify 5 documents in MongoDB

**Relevant Context:**
- `client/src/dashboardData.js` — source of truth for existing product data (all 5 products)
- `server/models/` — currently empty, create `Product.js` here
- `server/seed/` — currently empty, create `index.js` and `products.js` here

**Status:** [ ] pending

---

### Sub-Task 3 — REST API Routes for Products

**Intent:** Build the Express REST API that the frontend will call instead of reading from the static `dashboardData.js`. The dashboard needs to load products from the database, and the upload page needs to POST new products.

**Expected Outcomes:**
- `GET /api/products` — returns all products (array), supports optional `?practice=IBM&product=Instana` query filter
- `GET /api/products/:id` — returns a single product by MongoDB `_id`
- `POST /api/products` — accepts JSON body (product data), saves to MongoDB, broadcasts SSE event
- `GET /api/products/practices` — returns list of available practices + product names (for the welcome screen dropdown)
- All routes mounted at `/api` via `server/routes/products.js`

**Expected Outcomes:**
- Frontend can fetch `http://localhost:5000/api/products?practice=IBM&product=Instana` and get the full product object
- A new product POSTed appears immediately in the database

**Todo List:**
1. Create `server/routes/products.js` — Express Router with the 4 routes listed above
2. Mount it in `server/index.js` as `app.use('/api', productsRouter)`
3. Add an SSE emitter helper (`server/utils/sseEmitter.js`) that broadcasts to all connected clients; call it from the POST route after save
4. Test all routes with a REST client (or curl) before moving to frontend

**Relevant Context:**
- `server/index.js` — add router mount here
- `server/models/Product.js` — query the products collection
- `server/utils/sseEmitter.js` — will be used by both this sub-task and the AI generation sub-task

**Status:** [ ] pending

---

### Sub-Task 4 — Server-Sent Events (SSE) Real-Time Layer

**Intent:** Implement SSE so that when any team member adds a new product or competitor, all other open dashboard tabs receive a push event and automatically refresh their product list — without polling.

**Expected Outcomes:**
- `GET /api/events` — an SSE endpoint that keeps a long-lived connection open with each browser tab
- When a product is added (POST /api/products) or AI generation completes, all SSE clients receive an event: `{ type: "product_added", productId, practice, product }`
- During AI generation, progress events are streamed: `{ type: "ai_progress", stage: "generating_features", percent: 40 }`
- The frontend listens on `EventSource('/api/events')` and dispatches updates to state

**Todo List:**
1. Create `server/utils/sseEmitter.js` — maintains an in-memory Set of SSE response objects; exposes `addClient(res)`, `removeClient(res)`, `broadcast(eventName, data)`
2. Add `GET /api/events` route in `server/routes/products.js` — sets SSE headers, registers client, removes on close
3. Wire `broadcast("product_added", {...})` call into the POST /api/products handler after successful save
4. Wire progress broadcasts into the Gemini AI service (Sub-Task 5) — emit `ai_progress` events as each section is generated
5. Create `client/src/hooks/useSSE.js` — a React hook that sets up `EventSource`, parses events, and returns a state object updated in real-time

**Relevant Context:**
- `server/utils/sseEmitter.js` — new file
- `server/routes/products.js` — add SSE endpoint here
- `client/src/hooks/` — currently empty, create `useSSE.js` here

**Status:** [ ] pending

---

### Sub-Task 5 — Gemini AI Generation Service

**Intent:** Build the server-side service that takes a product name, description, and competitor names (plus any uploaded raw data) and calls Google Gemini to generate a fully structured product intelligence document in the exact schema format the dashboard expects.

**Expected Outcomes:**
- `server/services/gemini.js` exports `generateProductData(productName, description, competitorNames, rawData)` 
- The function sends a carefully crafted prompt to Gemini 1.5 Pro instructing it to return a JSON document matching the product schema
- The response is parsed, validated, and returned as a JavaScript object ready to save to MongoDB
- Competitor-only generation: `generateCompetitorProfile(competitorName, productContext)` returns a `competitorSummary` entry
- If the team provided raw data (from file upload), it is included in the prompt as additional context
- Progress events are broadcast via SSE emitter as each section is generated (overview → features → competitors → TCO → objections)

**Todo List:**
1. Install `@google/generative-ai` in `server/package.json`
2. Create `server/services/gemini.js` — initialize the Gemini client with `process.env.GEMINI_API_KEY`
3. Write the `generateProductData` function with a detailed system prompt that instructs Gemini to output a JSON document matching the exact product schema (include schema as example in prompt)
4. Write the `generateCompetitorProfile` function with a targeted competitor analysis prompt
5. Add streaming support: use Gemini's streaming API and emit SSE `ai_progress` events as content arrives (parse partial JSON sections by key)
6. Add a `validateAndFillDefaults(aiOutput, providedData)` helper that merges AI-generated fields with any manually provided fields (manually entered data takes priority)
7. Write a test script (`server/scripts/testGemini.js`) to run the generation locally and print the output

**Relevant Context:**
- `server/services/` — new directory to create
- `server/utils/sseEmitter.js` — import and use for progress events
- Product schema from `server/models/Product.js` (Sub-Task 2)
- Gemini Node.js SDK docs: `@google/generative-ai` v1.x

**Status:** [ ] pending

---

### Sub-Task 6 — File Upload & Parser Service

**Intent:** Allow the team to upload any file (CSV, JSON, Excel .xlsx, plain text) containing product or competitor data. The server parses the file into a structured JavaScript object and passes it to the Gemini service as raw context to enrich the AI generation.

**Expected Outcomes:**
- `POST /api/products/upload` accepts `multipart/form-data` with a file field plus form fields (product name, practice, competitors)
- The server uses `multer` for file handling (memory storage, no disk writes needed)
- `server/services/fileParser.js` exports `parseFile(buffer, mimetype, originalname)` → returns a plain JS object or string representing the file's content
- Supported formats: `.json`, `.csv`, `.xlsx`, `.xls`, `.txt`
- The parsed content is passed to `generateProductData()` as the `rawData` argument
- The raw content is also stored in `product.rawInputData` in MongoDB so it's never lost

**Todo List:**
1. Install `multer` and `xlsx` in `server/package.json`
2. Create `server/services/fileParser.js` — switch on file extension; use `JSON.parse` for JSON, manually parse CSV rows, use `xlsx.read()` for Excel, plain `toString` for text
3. Add `POST /api/products/upload` route in `server/routes/products.js` — multer middleware → parse file → call Gemini → save → broadcast SSE
4. Limit file size to 10MB in multer config
5. Return a `{ status: "processing", jobId }` response immediately (non-blocking); SSE will deliver the final result to the browser

**Relevant Context:**
- `server/routes/products.js` — add upload route
- `server/services/fileParser.js` — new file
- `server/services/gemini.js` — called with parsed file content

**Status:** [ ] pending

---

### Sub-Task 7 — Frontend Data Layer Migration

**Intent:** Replace the static `dashboardData.js` file with Axios API calls. The dashboard will load all product data from `http://localhost:5000/api` instead of the hardcoded file. The welcome screen will populate practices and products from the database.

**Expected Outcomes:**
- `client/src/api/products.js` — a thin API client module with `fetchProducts()`, `fetchProduct(practice, product)`, `fetchPractices()`
- `client/src/context/DataContext.jsx` — React context that loads data from the API, caches it in state, and exposes `getProductData(practice, product)` (same signature as the old static function)
- `App.jsx` wraps everything in `<DataContext.Provider>` and reads practice/product options from the API
- All existing pages that previously received `data` as a prop continue to work identically — the prop origin changes from static to API, nothing else changes
- `dashboardData.js` is kept as a fallback but no longer imported by `App.jsx`
- The Vite dev proxy is configured to forward `/api` calls to `localhost:5000` (avoids CORS in dev)

**Todo List:**
1. Create `client/src/api/products.js` — Axios-based functions: `fetchProducts(filters)`, `fetchProduct(practice, product)`, `fetchPractices()`
2. Create `client/src/context/DataContext.jsx` — provides `productData`, `practices`, `loading`, `error`, `getProductData`
3. Update `client/vite.config.js` — add server proxy: `/api` → `http://localhost:5000`
4. Update `client/src/App.jsx` — wrap in `DataContext.Provider`, load practice/product list from API for the welcome screen dropdowns, replace `import { getProductData } from './dashboardData'` with context
5. Hook up `useSSE` from Sub-Task 4 — when a `product_added` event arrives, refresh the product list in context

**Relevant Context:**
- `client/src/App.jsx` — welcome screen + product selection logic
- `client/src/dashboardData.js` — the static file being replaced
- `client/src/context/` — currently empty, create `DataContext.jsx` here
- `client/vite.config.js` — add proxy config here

**Status:** [ ] pending

---

### Sub-Task 8 — Product Upload Page (UI)

**Intent:** Build the "Add Product" page that team members navigate to from the sidebar. It presents a form with product name, practice selector, description, competitor names, and an optional file drop zone. On submit, it calls the API, shows a real-time AI generation progress bar (streamed via SSE), and displays the completed product card when done.

**Expected Outcomes:**
- A new sidebar item "➕ Add Product" appears in the sidebar navigation (both IBM and AWS practices)
- The page has three sections:
  - **Section A — Product Info**: product name (text), practice (dropdown: IBM/AWS), product description (textarea), competitor names (comma-separated text field or tag input)
  - **Section B — File Upload (optional)**: drag-and-drop zone accepting CSV, JSON, Excel, TXT; shows filename on attach
  - **Section C — AI Generation Options**: checkboxes for which sections to auto-generate (all checked by default); a prominent "Generate with AI" button
- On submit: button shows a spinner, a progress bar updates in real-time via SSE events (`ai_progress`), showing which section is currently being generated (Overview → Features → TCO → Competitors → Objections → Coach)
- On completion: a success card shows the generated product name and a "View in Dashboard" link that navigates to the product's overview page

**Todo List:**
1. Create `client/src/pages/sections/AddProductPage.jsx` — the full page component with the three-section form layout
2. Style the file drop zone using existing CSS variables (dashed border, hover highlight, file icon)
3. Implement the tag-style competitor input (type name, press Enter or comma to add a tag chip)
4. Wire the form submit to `POST /api/products/upload` via Axios (multipart/form-data)
5. Connect the SSE hook (`useSSE`) to display real-time progress — render a progress bar and stage label
6. On SSE `product_added` event: show the success card and refresh the sidebar product list
7. Add "➕ Add Product" to the sidebar nav items in `App.jsx` (before the logout position; works for both practices)

**Relevant Context:**
- `client/src/pages/sections/` — create `AddProductPage.jsx` here
- `client/src/App.jsx` — add new nav item to sidebar nav array
- `client/src/hooks/useSSE.js` — import for progress updates
- `client/src/index.css` — reuse existing card, badge, and button CSS variables; add `.file-drop-zone`, `.progress-bar`, `.tag-chip` classes if needed

**Status:** [ ] pending

---

### Sub-Task 9 — Competitor Profile Auto-Generation & Display

**Intent:** When a competitor name is entered (on the Add Product page or standalone), Gemini generates a full competitor profile. This profile populates two places: the Competitive Analysis page for that product AND a new standalone Competitor Profile card within the product view.

**Expected Outcomes:**
- On the Add Product page, after entering competitor names, an "Enrich Competitors with AI" button calls `POST /api/competitors/generate` for each competitor name
- The generated competitor data is merged into the product's `competitorSummary` array in MongoDB
- The Competitive Analysis page renders the AI-generated competitor cards immediately (since it reads from MongoDB via API)
- A standalone "Competitor Profiles" section is added to the Competitive Analysis page showing each competitor's: name, market position badge, overview paragraph, strengths list, weaknesses list, and pricing summary

**Todo List:**
1. Add `POST /api/competitors/generate` route — accepts `{ competitorName, productName, practice }`, calls `generateCompetitorProfile()`, updates the product document in MongoDB (`$push` to `competitorSummary`), broadcasts SSE `competitor_added` event
2. Update `client/src/pages/sections/CompetitiveAnalysisPage.jsx` — render `competitorSummary` items as expanded profile cards (not just summary snippets); add a "Competitor Profiles" header section above the feature matrix
3. On the Add Product page, add an "Enrich Competitors" button that calls the competitor generation endpoint for each entered competitor name
4. Ensure the competitor profile card layout is visually consistent with the existing competitor summary card style

**Relevant Context:**
- `server/routes/products.js` — add competitor route
- `server/services/gemini.js` — `generateCompetitorProfile()` function from Sub-Task 5
- `client/src/pages/sections/CompetitiveAnalysisPage.jsx` — update to show richer competitor profiles

**Status:** [ ] pending

---

### Sub-Task 10 — End-to-End Integration Test & Polish

**Intent:** Run through the full flow end-to-end (server up → seed data → open dashboard → add a new product via form → watch AI generate → see it appear on all tabs) and fix any integration gaps. Then do a final UI polish pass on the Add Product page.

**Expected Outcomes:**
- Complete workflow verified: seed → dashboard loads 5 products → add new product → Gemini generates → MongoDB stores → SSE pushes → dashboard refreshes
- The welcome screen dropdown shows all products from MongoDB (including newly added ones)
- Error states handled: server down shows a clear "Cannot connect to server" message; Gemini API key missing shows a clear error on the upload page
- The Add Product page is visually polished and consistent with the rest of the dashboard (same dark/light theme, same card style, same font sizes)
- `server/.env.example` is finalized with clear comments explaining each variable

**Todo List:**
1. Run full end-to-end test: start MongoDB → `npm run seed` → start server → start client → navigate to Add Product → submit with a new product name + competitor names → watch AI progress → verify product appears in welcome screen
2. Fix any broken API calls, CORS issues, or parsing errors found during testing
3. Polish the Add Product page: ensure dark/light theme works, progress bar animates smoothly, tags look correct
4. Add a loading skeleton to all existing dashboard pages (Overview, Product Details, etc.) so they show a placeholder while API data loads instead of crashing on undefined
5. Update `server/.env.example` with comments: which key goes where and how to get a Gemini API key (link to Google AI Studio)

**Relevant Context:**
- All files created in Sub-Tasks 1–9
- `client/src/App.jsx` — check welcome screen dropdowns
- `client/src/pages/sections/` — add loading skeletons to existing pages

**Status:** [ ] pending

---

## Implementation Order

```
Sub-Task 1  → Backend: server entry point + MongoDB connection
Sub-Task 2  → MongoDB model + seed existing 5 products
Sub-Task 3  → REST API routes for products
Sub-Task 4  → SSE real-time layer
Sub-Task 5  → Gemini AI generation service
Sub-Task 6  → File upload + parser service
Sub-Task 7  → Frontend data layer migration (dashboardData.js → API)
Sub-Task 8  → Add Product page UI
Sub-Task 9  → Competitor auto-generation + profile display
Sub-Task 10 → End-to-end integration + polish
```

Sub-Tasks 1–4 are server-only and must complete before any frontend work.
Sub-Task 5–6 require Sub-Task 1 (server running) and can run in parallel.
Sub-Task 7 requires Sub-Tasks 1–3 complete.
Sub-Tasks 8–9 require Sub-Tasks 5–7 complete.
Sub-Task 10 requires all previous sub-tasks complete.

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Real-time push mechanism | Server-Sent Events (SSE) | No extra client library needed; one-directional (server → client) is sufficient for data sync |
| AI generation model | Gemini 1.5 Pro | Best balance of JSON output quality and speed; supports streaming |
| File storage | In-memory only (no disk) | Use multer memory storage; raw content saved to MongoDB `rawInputData`; no file system needed |
| Competitor data storage | Embedded in product document | Competitors are always queried in context of a product; embedding avoids extra joins |
| Frontend data flow | React Context (DataContext) | Avoids prop drilling; consistent with how existing pages receive `data` prop |
| API proxy | Vite dev proxy | Avoids CORS in development without touching server config; production just uses same origin or nginx |
| Schema flexibility | `rawInputData: Mixed` | Allows any structured or unstructured upload data to be stored without schema changes |

---

## Files To Be Created

### Server (new)
- `server/package.json`
- `server/index.js`
- `server/.env.example`
- `server/models/Product.js`
- `server/routes/products.js`
- `server/seed/index.js`
- `server/seed/products.js`
- `server/services/gemini.js`
- `server/services/fileParser.js`
- `server/utils/sseEmitter.js`
- `server/scripts/testGemini.js`

### Client (new or modified)
- `client/src/api/products.js` ← new
- `client/src/context/DataContext.jsx` ← new
- `client/src/hooks/useSSE.js` ← new
- `client/src/pages/sections/AddProductPage.jsx` ← new
- `client/src/App.jsx` ← modified (DataContext + new nav item)
- `client/vite.config.js` ← modified (add proxy)
- `client/src/index.css` ← modified (add `.file-drop-zone`, `.progress-bar`, `.tag-chip`)
- `client/src/pages/sections/CompetitiveAnalysisPage.jsx` ← modified (competitor profiles section)
