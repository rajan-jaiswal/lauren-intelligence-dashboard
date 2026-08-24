const express         = require('express');
const multer          = require('multer');
const router          = express.Router();

const Product          = require('../models/Product');
const sse              = require('../utils/sseEmitter');
const gemini           = require('../services/gemini');
const fileParser       = require('../services/fileParser');
const normalizeProduct = require('../utils/normalizeProduct');

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
  const { pin, ...productData } = req.body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return res.status(401).json({ error: 'Invalid PIN' });
  if (!productData.practice || !productData.product) {
    return res.status(400).json({ error: 'practice and product are required' });
  }
  try {
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
  try {
    const doc = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
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

