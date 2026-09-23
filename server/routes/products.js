const express         = require('express');
const multer          = require('multer');
const router          = express.Router();

const Product          = require('../models/Product');
const sse              = require('../utils/sseEmitter');
const gemini           = require('../services/gemini');
const fileParser       = require('../services/fileParser');
const normalizeProduct = require('../utils/normalizeProduct');

// ─── Robust JSON parser ───────────────────────────────────────────────────────
// Handles all the ways Gemini can wrap / mangle its JSON output:
//   1. Pure JSON
//   2. ```json ... ``` fences (with or without language tag)
//   3. Explanation text before/after the JSON object
//   4. Truncated JSON — completes missing closing braces/brackets so
//      a partial response still yields the fields that were extracted
function robustParseJSON(raw) {
  if (!raw) throw new Error('Empty response from AI');
  let text = raw.trim();

  // 1. Strip ALL markdown code fences (```json, ```JSON, ```, etc.)
  text = text.replace(/^```[a-zA-Z]*\s*/gm, '').replace(/```\s*$/gm, '').trim();

  // 2. Find the first '{' and the last '}' — extract only the JSON object
  const first = text.indexOf('{');
  const last  = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  } else if (first !== -1) {
    // No closing brace — text is truncated; try to auto-close it
    text = text.slice(first);
    text = autoCloseJSON(text);
  }

  // 3. First parse attempt on cleaned text
  try {
    return JSON.parse(text);
  } catch (_) {}

  // 4. Truncated / broken — try auto-closing again on whatever we have
  try {
    return JSON.parse(autoCloseJSON(text));
  } catch (_) {}

  // 5. Last resort: remove any trailing incomplete key-value and close
  try {
    // Strip the last incomplete line (partial value not closed)
    const lines = text.split('\n');
    while (lines.length > 1) {
      lines.pop();
      const attempt = autoCloseJSON(lines.join('\n'));
      try { return JSON.parse(attempt); } catch (_) {}
    }
  } catch (_) {}

  throw new Error('Could not extract valid JSON from AI response');
}

// Add missing closing brackets/braces to a truncated JSON string
function autoCloseJSON(text) {
  // Remove trailing comma before attempting to close
  let s = text.trimEnd().replace(/,\s*$/, '');
  const stack = [];
  let inString = false;
  let escape = false;
  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  // Close any open string
  if (inString) s += '"';
  // Close all open structures in reverse order
  return s + stack.reverse().join('');
}

// multer — memory storage, 10 MB per file, up to 20 files at once
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
const uploadMany = upload.array('files', 20);

// ─── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  const mongoose = require('mongoose');
  res.json({ status: 'ok', db: mongoose.connection.readyState, ts: new Date().toISOString() });
});

// ─── POST /api/verify-pin — validate admin PIN before unlocking UI ────────────
router.post('/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  res.json({ status: 'ok' });
});

// ─── SSE — Real-time event stream ─────────────────────────────────────────────
router.get('/events', (req, res) => {
  // Explicit CORS header needed for EventSource (browser doesn't send preflight)
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.flushHeaders();

  // Send initial connected event so client knows the stream is live
  try { res.write('event: connected\ndata: {"status":"ok"}\n\n'); } catch (_) {}

  // Heartbeat every 20 s — keeps Render + proxy connections alive
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (_) { clearInterval(heartbeat); }
  }, 20000);

  sse.addClient(res);
  req.on('close', () => { clearInterval(heartbeat); sse.removeClient(res); });
});

// ─── GET /api/practices — list practices + products ───────────────────────────
router.get('/practices', async (_req, res) => {
  try {
    const docs = await Product.find({}, 'practice product').lean();
    const map = {};
    for (const d of docs) {
      if (!map[d.practice]) map[d.practice] = [];
      map[d.practice].push(d.product);
    }
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/practices — create a new practice ──────────────────────────────
router.post('/practices', async (req, res) => {
  const { pin, practiceName } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  if (!practiceName || !practiceName.trim()) return res.status(400).json({ error: 'practiceName required' });
  try {
    const name = practiceName.trim().toUpperCase();
    const existing = await Product.findOne({ practice: name }).lean();
    if (existing) return res.status(409).json({ error: `Practice "${name}" already exists` });
    res.json({ status: 'ok', practice: name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/practices/:name — rename a practice (updates all products) ──────
router.patch('/practices/:name', async (req, res) => {
  const { pin, newName } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  if (!newName || !newName.trim()) return res.status(400).json({ error: 'newName required' });
  try {
    const oldName = decodeURIComponent(req.params.name);
    const updated = newName.trim().toUpperCase();
    if (oldName === updated) return res.json({ status: 'ok', practice: updated });
    const conflict = await Product.findOne({ practice: updated }).lean();
    if (conflict) return res.status(409).json({ error: `Practice "${updated}" already exists` });
    await Product.updateMany({ practice: oldName }, { $set: { practice: updated } });
    sse.broadcast('practice_renamed', { oldName, newName: updated });
    res.json({ status: 'ok', oldName, newName: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/practices/:name — delete a practice and all its products ──────
router.delete('/practices/:name', async (req, res) => {
  const { pin } = req.query;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  try {
    const name = decodeURIComponent(req.params.name);
    const result = await Product.deleteMany({ practice: name });
    sse.broadcast('practice_deleted', { practice: name, deletedCount: result.deletedCount });
    res.json({ status: 'deleted', practice: name, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/products — list all (with optional filters) ─────────────────────
router.get('/products', async (req, res) => {
  try {
    const filter = {};
    if (req.query.practice) filter.practice = req.query.practice;
    if (req.query.product)  filter.product  = req.query.product;
    const docs = await Product.find(filter).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/products/manual — save fully-manual product data ───────────────
// IMPORTANT: must come BEFORE POST /products (no path param) and before :id routes
router.post('/products/manual', async (req, res) => {
  const { pin, ...rawData } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  if (!rawData.practice || !rawData.product) {
    return res.status(400).json({ error: 'practice and product are required' });
  }
  const productData = normalizeProduct(rawData);
  try {
    // Duplicate check — reject if same practice+product already exists and this is NOT an edit (_id absent)
    if (!productData._id) {
      const dup = await Product.findOne({ practice: productData.practice, product: productData.product }).lean();
      if (dup) return res.status(409).json({ error: `"${productData.product}" already exists in ${productData.practice}` });
    }
    const doc = await Product.findOneAndUpdate(
      { practice: productData.practice, product: productData.product },
      { $set: { ...productData, aiGenerated: false } },
      { upsert: true, new: true }
    );
    sse.broadcast('product_added', { productId: doc._id, practice: doc.practice, product: doc.product });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/products/check-duplicate — check if practice+product already exists
router.get('/products/check-duplicate', async (req, res) => {
  const { practice, product } = req.query;
  if (!practice || !product) return res.status(400).json({ error: 'practice and product are required' });
  try {
    const exists = await Product.exists({ practice, product });
    res.json({ exists: !!exists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/products/ai-fill — AI fills missing fields only ────────────────
router.post('/products/ai-fill', async (req, res) => {
  const { pin, productId, practice, product: productName } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });

  const jobId = `fill_${Date.now()}`;
  res.status(202).json({ status: 'processing', jobId });

  try {
    const existing = productId
      ? await Product.findById(productId).lean()
      : await Product.findOne({ practice, product: productName }).lean();

    sse.broadcast('ai_progress', { jobId, stage: 'analysing', percent: 10, message: 'Analysing existing data...' });

    const competitorNames = (req.body.competitors || existing?.competitors || '')
      .split(',').map(s => s.trim()).filter(Boolean);

    const generated = normalizeProduct(await gemini.generateProductData(
      existing?.product || productName,
      existing?.practice || practice,
      existing?.overview?.description || '',
      competitorNames,
      null,
      jobId
    ));

    function mergeDeep(target, source) {
      if (!target) return source;
      if (Array.isArray(target)) return target.length ? target : source;
      if (typeof target === 'object') {
        const out = { ...source };
        for (const k of Object.keys(target)) {
          if (target[k] !== null && target[k] !== undefined && target[k] !== '') out[k] = target[k];
        }
        return out;
      }
      return (target !== null && target !== undefined && target !== '') ? target : source;
    }

    const ARRAY_FIELDS  = ['keyFeatures','discoveryQuestions','recommendedResponses','strengths','weaknesses','caseStudies','keyCustomers','competitorSummary','objectionHandling','pricingTiers'];
    const OBJECT_FIELDS = ['overview','featureMatrix','tcoData','winLoss','aiCoach'];
    const merged = { ...generated };
    for (const f of ARRAY_FIELDS)  { if (existing?.[f]?.length) merged[f] = existing[f]; }
    for (const f of OBJECT_FIELDS) { if (existing?.[f]) merged[f] = mergeDeep(existing[f], generated[f]); }

    const doc = await Product.findOneAndUpdate(
      { practice: existing?.practice || practice, product: existing?.product || productName },
      { $set: { ...merged, aiGenerated: true, aiGeneratedAt: new Date() } },
      { upsert: true, new: true }
    );

    sse.broadcast('product_added', { jobId, productId: doc._id, practice: doc.practice, product: doc.product, percent: 100 });
    sse.broadcast('ai_progress', { jobId, stage: 'complete', percent: 100, message: 'Missing fields filled by AI!' });
  } catch (err) {
    sse.broadcast('ai_progress', { jobId, stage: 'error', percent: 0, message: err.message });
  }
});

// ─── POST /api/products/ai-generate-preview — generate with AI, NO DB save ───
// Broadcasts ai_progress events then a final ai_preview event with the full
// generated document. The client populates form fields from it; user must
// click "Save Product" manually to actually persist.
router.post('/products/ai-generate-preview', async (req, res) => {
  const { pin, practice, product: productName, competitors } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  if (!practice || !productName) {
    return res.status(400).json({ error: 'practice and product are required' });
  }

  const jobId = `preview_${Date.now()}`;
  res.status(202).json({ status: 'processing', jobId });

  try {
    sse.broadcast('ai_progress', { jobId, stage: 'starting', percent: 10, message: 'AI is generating product data...' });

    const competitorNames = (competitors || '')
      .split(',').map(s => s.trim()).filter(Boolean);

    const generated = normalizeProduct(await gemini.generateProductData(
      productName,
      practice,
      '',
      competitorNames,
      null,
      jobId
    ));

    sse.broadcast('ai_progress', { jobId, stage: 'complete', percent: 100, message: 'AI generation complete — review and save.' });
    // Broadcast the full generated document for the client to preview.
    // NOT saved to DB — client calls /products/manual when user clicks Save.
    sse.broadcast('ai_preview', { jobId, practice, product: productName, data: generated });
  } catch (err) {
    sse.broadcast('ai_progress', { jobId, stage: 'error', percent: 0, message: err.message });
  }
});

// ─── POST /api/products/extract-pdf — parse file → return field preview (no save) ─
// Two-pass strategy for large docs: chunk → summarise → synthesise final JSON.
router.post('/products/extract-pdf', upload.single('file'), async (req, res) => {
  if (!process.env.ADMIN_PIN || req.body.pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const parsed = await fileParser.parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);

    // Build the full text representation without truncation
    let fullText = '';
    if (parsed && parsed.text)          fullText = parsed.text;
    else if (parsed && parsed.combined) fullText = parsed.combined;
    else                                fullText = JSON.stringify(parsed, null, 2);

    // ── Extraction prompt template ────────────────────────────────────────────
    const EXTRACTION_SCHEMA = `{
  "productName": "<exact product name, or null>",
  "description": "<2-3 sentence product description capturing the core value proposition, or null>",
  "category": "<product category e.g. Identity Management / APM / SIEM, or null>",
  "deployment": "<SaaS / On-Prem / Hybrid / Cloud-native, or null>",
  "targetUsers": "<comma-separated roles/teams, or null>",
  "productLaunch": "<year launched, or null>",
  "marketPosition": "<e.g. Leader (Gartner MQ 2024), or null>",
  "gartnerMQ": "<Gartner MQ position e.g. Leader / Visionary / Challenger, or null>",
  "keyFeatures": [{ "icon": "<relevant emoji>", "name": "<feature name>", "description": "<one concise line>" }],
  "strengths": ["<specific strength or differentiator>"],
  "weaknesses": ["<specific limitation or constraint>"],
  "discoveryQuestions": ["<question a sales rep should ask prospects>"],
  "recommendedResponses": ["<matching sales response or talking point>"],
  "objectionHandling": [{ "objection": "<verbatim or paraphrased customer objection>", "response": "<effective sales response>" }],
  "caseStudies": [{ "icon": "<emoji>", "customer": "<company or type>", "type": "<industry>", "challenge": "<the problem>", "result": "<quantified outcome>" }],
  "keyCustomers": [{ "logo": "<emoji>", "name": "<company name>", "industry": "<industry>", "color": "<brand hex color>" }],
  "competitors": ["<competitor product or company name>"],
  "competitorSummary": [{ "name": "<competitor name>", "logo": "<emoji>", "color": "<hex>", "marketPosition": "<Leader/Challenger/Niche>", "overview": "<2 sentence overview>", "strengths": ["<s1>", "<s2>"], "weaknesses": ["<w1>", "<w2>"], "ourEdge": ["<how this product leads vs competitor — specific point 1>", "<point 2>", "<point 3>", "<point 4>"] }],
  "featureMatrix": { "labels": { "product": "<name>", "comp1": "<name>", "comp2": "<name>" }, "rows": [{ "feature": "<feature>", "product": "green", "comp1": "yellow", "comp2": "red" }] },
  "tcoData": { "labels": { "product": "<name>", "comp1": "<name>", "comp2": "<name>" }, "maxValue": 800, "totals": { "product": "<val>", "comp1": "<val>", "comp2": "<val>" }, "rows": [{ "component": "<cost component>", "product": "<val>", "comp1": "<val>", "comp2": "<val>" }] },
  "winLoss": { "total": 0, "won": 0, "lost": 0, "winRate": 0, "competitors": [{ "label": "<name>", "wins": 0, "pct": 0, "color": "<hex>" }], "topMessages": ["<winning message>"] },
  "aiCoach": { "customerSays": "<typical objection>", "suggestedResponse": "<response>", "recommendedCaseStudy": "<case>", "winProbability": "HIGH", "kvps": ["<key value point>"] },
  "pricingInfo": "<any pricing, tier, or licensing info found, or null>"
}`;

    const EXTRACTION_RULES = `EXTRACTION RULES — follow every rule precisely:
1. Extract EVERY piece of information present — never omit data that exists in the document
2. keyFeatures: extract EVERY feature, capability, module, use case, and section heading — include ALL of them
3. strengths: extract ALL advantages, value propositions, differentiators, "why us", competitive benefits
4. weaknesses: extract ALL limitations, prerequisites, constraints, known gaps, requirements
5. discoveryQuestions: extract from Q&A, discovery, or qualification sections; generate sales-relevant questions from product context if none exist
6. recommendedResponses: extract from "response", "answer", "talking points", "messaging" sections; match to discoveryQuestions
7. objectionHandling: extract ALL objection/response pairs; infer from competitive sections if not explicit
8. caseStudies: extract ALL customer examples, case studies, success stories, reference accounts
9. keyCustomers: extract ALL customer logos, reference accounts, named companies, partner names
10. competitors: extract EVERY competitor, alternative solution, or "compared to" product mentioned
11. competitorSummary: for each competitor found, generate a full profile including strengths, weaknesses, and an "ourEdge" array of 4-6 specific points explaining how this product leads vs that competitor
12. featureMatrix: if any comparison table exists, extract it fully; use "green"=advantage, "yellow"=partial, "red"=disadvantage
13. tcoData: extract ALL pricing, cost, ROI, or TCO data with dollar values
14. winLoss: extract win rates, deal volumes, conversion stats, competitive win/loss data
15. aiCoach: synthesise the most impactful objection/response pair from the document
16. Return null ONLY if data genuinely does not exist — never return empty arrays when data is present
17. Preserve exact numbers, percentages, and quoted text from the document
18. CRITICAL: Return ONLY a valid JSON object. No markdown, no backticks, no explanation text.
19. START your response with { and END with }`;

    // ── STRATEGY ─────────────────────────────────────────────────────────────
    // Gemini 2.5-flash supports ~1M token context (~3M chars).
    // Single-pass for docs ≤ 60 000 chars (covers 95%+ of real files).
    // Two-pass PARALLEL chunking only for very large docs — all chunks fire
    // concurrently via Promise.all, then one synthesis call merges them.
    const CHUNK_SIZE = 60000;  // ~15 000 tokens — fits in one Gemini call easily
    const OVERLAP    = 400;    // chars overlap at chunk boundaries

    let extractedData;

    const buildSinglePassPrompt = (text) =>
      `You are a senior product intelligence analyst specialising in B2B technology sales enablement.
Read the following document carefully and extract EVERY piece of product information in ONE pass.

${EXTRACTION_RULES}

DOCUMENT:
---
${text}
---

Return this exact JSON structure populated with ALL extracted data:
${EXTRACTION_SCHEMA}`;

    if (fullText.length <= CHUNK_SIZE) {
      // ── Single-pass: entire document in one call ──────────────────────────────
      const rawText = await gemini.generateAccurate(buildSinglePassPrompt(fullText));
      try {
        extractedData = robustParseJSON(rawText);
      } catch (parseErr) {
        console.error('[extract-pdf] single-pass parse failed:\n', rawText?.slice(0, 800));
        return res.status(422).json({ error: 'Could not parse AI response. Please try again.', detail: parseErr.message });
      }

    } else {
      // ── Two-pass PARALLEL: all chunks fire at the same time ───────────────────
      const chunks = [];
      for (let i = 0; i < fullText.length; i += CHUNK_SIZE - OVERLAP) {
        chunks.push(fullText.slice(i, i + CHUNK_SIZE));
        if (i + CHUNK_SIZE >= fullText.length) break;
      }
      console.log(`[extract-pdf] parallel chunked extraction: ${chunks.length} chunks, ${fullText.length} chars`);

      // Pass 1 — all chunks in parallel (fast model — speed matters here)
      const chunkResults = await Promise.all(
        chunks.map(async (chunk, ci) => {
          const chunkPrompt = `Extract all product intelligence facts from this chunk (part ${ci + 1}/${chunks.length}).
Be exhaustive — miss nothing. Return ONLY a JSON object (no markdown) with any fields present:
{ "productName":"<if found>", "description":"<if found>", "category":"<if found>",
  "deployment":"<if found>", "targetUsers":"<if found>", "productLaunch":"<if found>",
  "marketPosition":"<if found>", "gartnerMQ":"<if found>",
  "keyFeatures":[{"icon":"⚡","name":"<name>","description":"<desc>"}],
  "strengths":["<s>"], "weaknesses":["<w>"],
  "discoveryQuestions":["<q>"], "recommendedResponses":["<r>"],
  "objectionHandling":[{"objection":"<o>","response":"<r>"}],
  "caseStudies":[{"icon":"📖","customer":"<c>","type":"<ind>","challenge":"<ch>","result":"<res>"}],
  "keyCustomers":[{"logo":"🏢","name":"<n>","industry":"<ind>","color":"#4a9eff"}],
  "competitors":["<name>"],
  "pricingInfo":"<pricing text if any>",
  "winLossStats":"<win/loss stats if any>",
  "comparisonData":"<comparison or TCO text if any>" }

CHUNK:
---
${chunk}
---`;
          try {
            // Use fast model for chunk passes — they run in parallel so speed wins
            const raw = await gemini.generateWithFallback(chunkPrompt);
            return robustParseJSON(raw);
          } catch (e) {
            console.warn(`[extract-pdf] chunk ${ci + 1} failed, skipping:`, e.message);
            return null;
          }
        })
      );

      const validChunks = chunkResults.filter(Boolean);

      // Pass 2 — one synthesis call with the accurate model
      const synthesisInput = JSON.stringify(validChunks, null, 2);
      const synthesisPrompt =
        `You are a senior product intelligence analyst. Synthesise these ${validChunks.length} chunk extractions from a product document into one complete, deduplicated intelligence record.

${EXTRACTION_RULES}

CHUNK EXTRACTIONS:
---
${synthesisInput}
---

Merge all arrays (remove exact duplicates), pick the most complete scalar values, and return:
${EXTRACTION_SCHEMA}`;

      const synthRaw = await gemini.generateAccurate(synthesisPrompt);
      try {
        extractedData = robustParseJSON(synthRaw);
      } catch (parseErr) {
        console.error('[extract-pdf] synthesis parse failed:\n', synthRaw?.slice(0, 800));
        return res.status(422).json({ error: 'Could not parse AI synthesis response. Please try again.', detail: parseErr.message });
      }
    }

    res.json({ status: 'ok', data: extractedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/products/upload — files + form → Gemini → MongoDB ──────────────
router.post('/products/upload', uploadMany, async (req, res) => {
  if (!process.env.ADMIN_PIN || req.body.pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  const { productName, practice, competitors, description } = req.body;
  if (!productName || !practice) {
    return res.status(400).json({ error: 'productName and practice are required' });
  }

  const jobId = Date.now().toString();
  res.status(202).json({ status: 'processing', jobId });

  let rawData = null;
  if (req.files && req.files.length > 0) {
    rawData = await fileParser.parseFiles(req.files);
  }

  sse.broadcast('ai_progress', { jobId, stage: 'starting', percent: 0, message: 'Starting AI generation...' });

  try {
    const competitorList = competitors ? competitors.split(',').map(s => s.trim()).filter(Boolean) : [];
    const geminiRawData  = rawData ? { ...rawData, text: rawData.combined } : null;
    const generated = normalizeProduct(await gemini.generateProductData(productName, practice, description || '', competitorList, geminiRawData, jobId));

    const docData = {
      ...generated,
      practice,
      product: productName,
      competitors: competitorList.join(', '),
      rawInputData: rawData,
      aiGenerated: true,
      aiGeneratedAt: new Date(),
    };

    const doc = await Product.findOneAndUpdate(
      { practice, product: productName },
      { $set: docData },
      { upsert: true, new: true }
    );

    sse.broadcast('product_added', { jobId, productId: doc._id, practice, product: productName, percent: 100 });
    sse.broadcast('ai_progress', { jobId, stage: 'complete', percent: 100, message: 'Product saved to database!' });
  } catch (err) {
    sse.broadcast('ai_progress', { jobId, stage: 'error', percent: 0, message: err.message });
  }
});

// ─── POST /api/products — create from JSON body ───────────────────────────────
router.post('/products', async (req, res) => {
  try {
    const data = req.body;
    if (!data.practice || !data.product) {
      return res.status(400).json({ error: 'practice and product are required' });
    }
    const doc = await Product.findOneAndUpdate(
      { practice: data.practice, product: data.product },
      { $set: data },
      { upsert: true, new: true }
    );
    sse.broadcast('product_added', { productId: doc._id, practice: doc.practice, product: doc.product });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/products/:id — single product by Mongo _id ─────────────────────
// Must be AFTER all literal /products/xxx routes
router.get('/products/:id', async (req, res) => {
  try {
    const doc = await Product.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/products/:id — update a product by id ──────────────────────────
router.put('/products/:id', async (req, res) => {
  const { pin } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  const normalized = normalizeProduct(req.body);
  try {
    const doc = await Product.findByIdAndUpdate(req.params.id, { $set: normalized }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    sse.broadcast('product_added', { productId: doc._id, practice: doc.practice, product: doc.product });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
router.delete('/products/:id', async (req, res) => {
  const { pin } = req.query;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  try {
    const doc = await Product.findByIdAndDelete(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    sse.broadcast('product_deleted', { productId: req.params.id, practice: doc.practice, product: doc.product });
    res.json({ status: 'deleted', productId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/competitors/generate ──────────────────────────────────────────
router.post('/competitors/generate', async (req, res) => {
  const { competitorName, productName, practice, pin } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  if (!competitorName || !productName || !practice) {
    return res.status(400).json({ error: 'competitorName, productName, practice are required' });
  }

  const jobId = `comp_${Date.now()}`;
  res.status(202).json({ status: 'processing', jobId });

  try {
    sse.broadcast('ai_progress', { jobId, stage: 'generating_competitor', percent: 10, message: `Generating profile for ${competitorName}...` });

    const profile = await gemini.generateCompetitorProfile(competitorName, productName, practice);

    await Product.findOneAndUpdate(
      { practice, product: productName },
      { $push: { competitorSummary: profile } }
    );

    sse.broadcast('competitor_added', { jobId, competitorName, practice, product: productName, profile });
    sse.broadcast('ai_progress', { jobId, stage: 'complete', percent: 100, message: `${competitorName} profile saved!` });
  } catch (err) {
    sse.broadcast('ai_progress', { jobId, stage: 'error', percent: 0, message: err.message });
  }
});

// ─── POST /api/coach/chat — live AI Sales Coach Q&A ──────────────────────────
router.post('/coach/chat', async (req, res) => {
  const { question, productName, practice, productContext } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  // Build a rich context-aware prompt
  const contextBlock = productContext
    ? `
PRODUCT CONTEXT:
- Product: ${productContext.product || productName}
- Practice: ${productContext.practice || practice}
- Category: ${productContext.overview?.category || ''}
- Description: ${productContext.overview?.description || ''}
- Key Strengths: ${(productContext.strengths || []).slice(0, 4).join('; ')}
- Key Weaknesses: ${(productContext.weaknesses || []).slice(0, 3).join('; ')}
- Competitors: ${productContext.competitors || ''}
- Win Rate: ${productContext.winLoss?.winRate ? productContext.winLoss.winRate + '%' : ''}
`
    : `PRODUCT: ${productName || 'Unknown'} | PRACTICE: ${practice || 'Unknown'}`;

  const prompt = `You are an expert AI Sales Coach for Lauren Group, specialising in ${practice || 'technology'} solutions. You help sales representatives handle objections, position products, and close deals.

${contextBlock}

A sales rep is asking you the following question:
"${question.trim()}"

Provide a helpful, concise, and actionable response. Focus on:
- Practical sales advice they can use immediately
- Specific talking points, objection handling, or competitive positioning as relevant
- Keep the response clear and well-structured (use short paragraphs or bullet points where helpful)
- Be direct and confident — this is a live sales situation

Do NOT use markdown headers with ##. Use plain text with short paragraphs or simple bullet points starting with •.`;

  try {
    const answer = await gemini.generateWithFallback(prompt);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

module.exports = router;

