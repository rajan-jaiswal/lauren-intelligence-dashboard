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

// ─── POST /api/products/extract-pdf — parse PDF → return field preview (no save) ─
// Used by the frontend "Extract from PDF" button to pre-fill the form.
router.post('/products/extract-pdf', upload.single('file'), async (req, res) => {
  if (!process.env.ADMIN_PIN || req.body.pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const parsed = await fileParser.parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);

    // Build a text representation for Gemini
    let text = '';
    if (parsed && parsed.text)          text = parsed.text;
    else if (parsed && parsed.combined) text = parsed.combined;
    else                                text = JSON.stringify(parsed, null, 2);

    // Reduce to a safe limit so the total prompt + JSON response fits within
    // Gemini's output token window.  The prompt template itself is ~2 KB, so
    // leave 16 000 chars for the document and ~8 000 tokens for the response.
    const MAX_CHARS = 16000;
    if (text.length > MAX_CHARS) {
      // Take the first 10 000 chars (intro / overview) + last 6 000 (summary / conclusions)
      // This preserves context from both ends of large documents.
      const head = text.slice(0, 10000);
      const tail = text.slice(-6000);
      text = head + '\n\n...[middle truncated for length]...\n\n' + tail;
    }

    const extractPrompt = `You are a senior product intelligence analyst specialising in B2B technology sales enablement. Read the following document carefully and extract EVERY piece of product information into the JSON structure below.

DOCUMENT:
---
${text}
---

EXTRACTION RULES:
- Extract ALL information present — never leave a field empty if data exists in the document
- keyFeatures: extract every feature, module, capability, use case, or section heading as { icon, name } objects. Minimum 6 if present
- strengths: advantages, value propositions, differentiators, "why us", benefits. Minimum 4 if present
- weaknesses: limitations, requirements, constraints, known gaps
- discoveryQuestions: sales questions a rep should ask — extract from any Q&A or discovery sections
- recommendedResponses: matching sales responses — extract from any "response", "answer", or talking-points sections
- objectionHandling: extract any objection/response pairs as { objection, response } objects
- caseStudies: extract any customer examples as { icon, customer, type, challenge, result } objects
- keyCustomers: extract any customer or reference names as { logo, name, industry, color } objects
- competitors: any product or company names mentioned as competitors
- featureMatrix: if a comparison table exists, extract as { labels: {product, comp1, comp2}, rows: [{feature, product, comp1, comp2}] } using "green"/"yellow"/"red"
- tcoData: if pricing/TCO data exists, extract as { labels, totals, rows } with dollar values
- winLoss: if win rates or deal stats exist, extract total/won/lost/winRate numbers and topMessages
- aiCoach: extract a typical customer objection and suggested response as { customerSays, suggestedResponse, recommendedCaseStudy, winProbability, kvps }
- gartnerMQ: extract any Gartner Magic Quadrant position mentioned
- Return null for a field ONLY if it truly cannot be found — do not return empty arrays
- Keep string values concise (max 2 sentences each) to avoid truncation
- CRITICAL: Your entire response must be a single valid JSON object. Do NOT wrap it in markdown. Do NOT add any text before or after the JSON.

START YOUR RESPONSE WITH { AND END WITH }:

{
  "productName": "<exact product name, or null>",
  "description": "<2-3 sentence product description, or null>",
  "category": "<product category e.g. Identity Management / APM / SIEM, or null>",
  "deployment": "<SaaS / On-Prem / Hybrid / Cloud-native, or null>",
  "targetUsers": "<comma-separated roles/teams, or null>",
  "productLaunch": "<year launched, or null>",
  "marketPosition": "<e.g. Leader (Gartner MQ 2024), or null>",
  "gartnerMQ": "<Gartner MQ position e.g. Leader / Visionary / Challenger, or null>",
  "keyFeatures": [{ "icon": "<emoji>", "name": "<feature name>" }],
  "strengths": ["<strength>"],
  "weaknesses": ["<weakness>"],
  "discoveryQuestions": ["<question a sales rep should ask>"],
  "recommendedResponses": ["<matching sales response>"],
  "objectionHandling": [{ "objection": "<customer objection>", "response": "<sales response>" }],
  "caseStudies": [{ "icon": "<emoji>", "customer": "<name/type>", "type": "<industry>", "challenge": "<challenge>", "result": "<result>" }],
  "keyCustomers": [{ "logo": "<emoji>", "name": "<company>", "industry": "<industry>", "color": "<hex>" }],
  "competitors": ["<competitor name>"],
  "featureMatrix": { "labels": { "product": "<name>", "comp1": "<name>", "comp2": "<name>" }, "rows": [{ "feature": "<feature>", "product": "green", "comp1": "yellow", "comp2": "red" }] },
  "tcoData": { "labels": { "product": "<name>", "comp1": "<name>", "comp2": "<name>" }, "maxValue": 800, "totals": { "product": "<val>", "comp1": "<val>", "comp2": "<val>" }, "rows": [{ "component": "<name>", "product": "<val>", "comp1": "<val>", "comp2": "<val>" }] },
  "winLoss": { "total": 0, "won": 0, "lost": 0, "winRate": 0, "competitors": [], "topMessages": ["<message>"] },
  "aiCoach": { "customerSays": "<objection>", "suggestedResponse": "<response>", "recommendedCaseStudy": "<case>", "winProbability": "HIGH", "kvps": ["<point>"] },
  "pricingInfo": "<any pricing info found, or null>"
}`;

    const rawText = await gemini.generateWithFallback(extractPrompt);

    let extractedData;
    try {
      extractedData = robustParseJSON(rawText);
    } catch (parseErr) {
      // Log the raw response to server console so it's debuggable
      console.error('[extract-pdf] JSON parse failed. Raw Gemini output (first 800 chars):\n', rawText?.slice(0, 800));
      return res.status(422).json({
        error: 'Could not parse AI response — the AI returned malformed output. Please try again or upload a different file.',
        detail: parseErr.message,
      });
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

