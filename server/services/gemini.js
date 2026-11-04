/**
 * AI service — Google Gemini REST API (direct HTTPS, no SDK fetch issues).
 * Uses a PARALLEL RACE strategy: fires all models at once, first to respond wins.
 * This eliminates waiting for slow/503 models and maximises speed.
 *
 * Exported interface (unchanged):
 *   generateProductData / generateCompetitorProfile / generateWithFallback / generateAccurate
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');
const sse   = require('../utils/sseEmitter');

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set in server/.env');
  return key;
}

// All models available on this API key — fired in parallel, fastest wins
const MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
];

const MODELS_ACCURATE = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Call a single Gemini model via direct HTTPS REST.
 * Returns the generated text string on success, throws on error.
 */
function callGeminiREST(modelName, prompt, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${modelName}:generateContent`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': getApiKey(),
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);

          // Handle API-level errors
          if (json.error) {
            const code = json.error.code || 0;
            const msg  = json.error.message || 'Unknown Gemini error';
            return reject(new Error(`Gemini ${code} (${modelName}): ${msg}`));
          }

          // Extract text from response
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text || !text.trim()) {
            return reject(new Error(`Gemini: empty response from ${modelName}`));
          }
          resolve(text.trim());
        } catch (e) {
          reject(new Error(`Gemini JSON parse error (${modelName}): ${raw.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Gemini network error (${modelName}): ${e.message}`)));

    // Hard timeout — destroy socket if model hangs
    const timer = setTimeout(() => {
      req.destroy(new Error(`Gemini timeout after ${timeoutMs / 1000}s (${modelName})`));
    }, timeoutMs);
    req.on('close', () => clearTimeout(timer));

    req.write(body);
    req.end();
  });
}

/**
 * PARALLEL RACE: fire all models simultaneously, resolve with whichever
 * responds first. Models that return 503/404 are silently skipped.
 * Falls back to sequential retry if race produces no winner.
 */
async function generateWithFallback(prompt, modelList) {
  const models = [...(modelList || MODELS)];

  // ── Phase 1: Parallel race (all models fired at once) ─────────────────────
  const raceResult = await new Promise((resolve) => {
    let settled = false;
    let failures = 0;

    models.forEach((modelName) => {
      callGeminiREST(modelName, prompt)
        .then((text) => {
          if (!settled) {
            settled = true;
            console.log(`[gemini] ✅ ${modelName} won the race`);
            resolve({ ok: true, text });
          }
        })
        .catch((err) => {
          failures++;
          const msg = err.message || '';
          console.warn(`[gemini] ⚠ ${modelName} failed: ${msg.slice(0, 100)}`);
          if (failures === models.length && !settled) {
            settled = true;
            resolve({ ok: false, lastErr: err });
          }
        });
    });
  });

  if (raceResult.ok) return raceResult.text;

  // ── Phase 2: Sequential retry after brief wait ─────────────────────────────
  console.warn('[gemini] All parallel attempts failed — retrying sequentially after 4s...');
  await sleep(4000);

  let lastErr;
  for (const modelName of models) {
    try {
      const text = await callGeminiREST(modelName, prompt);
      console.log(`[gemini] ✅ ${modelName} succeeded on retry`);
      return text;
    } catch (err) {
      lastErr = err;
      console.warn(`[gemini] ⚠ ${modelName} retry failed: ${(err.message || '').slice(0, 100)}`);
    }
  }

  throw lastErr || new Error('All Gemini models failed');
}

function parseAiJSON(text) {
  let cleaned = text.trim();
  // Strip markdown code fences
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/gm, '').replace(/```\s*$/gm, '').trim();
  // Extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];
  return JSON.parse(cleaned);
}

function buildProductPrompt(productName, practice, description, competitorNames, rawData) {
  const c1 = competitorNames[0] || 'Competitor1';
  const c2 = competitorNames[1] || 'Competitor2';
  const competitorList =
    competitorNames.length > 0
      ? competitorNames.join(', ')
      : `the 2 most well-known real competitors of ${productName} in the market`;

  let rawSection = '';
  if (rawData) {
    const content =
      rawData.text ||
      rawData.combined ||
      (typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2));
    const truncated = content.length > 6000 ? content.slice(0, 6000) + '\n...[truncated]' : content;
    rawSection = `\n\nCONTEXT FROM FILES:\n${truncated}`;
  }

  return `You are a senior product intelligence analyst. Generate a sales dashboard JSON document.

PRODUCT: ${productName}
PRACTICE: ${practice}
DESCRIPTION: ${description || 'Infer from product name and industry knowledge'}
COMPETITORS: ${competitorList}
${rawSection}

IMPORTANT: Return ONLY a valid JSON object. No markdown. No explanation. Start with { end with }.

{"overview":{"logo":"<emoji>","name":"${productName.toUpperCase()}","category":"<category>","deployment":"<SaaS/On-Prem/Hybrid>","targetUsers":"<users>","productLaunch":"<year>","marketPosition":"<position>","description":"<2-3 sentences>"},"keyFeatures":[{"icon":"<emoji>","name":"<name>","description":"<one line>"},{"icon":"<emoji>","name":"<name>","description":"<one line>"},{"icon":"<emoji>","name":"<name>","description":"<one line>"},{"icon":"<emoji>","name":"<name>","description":"<one line>"},{"icon":"<emoji>","name":"<name>","description":"<one line>"},{"icon":"<emoji>","name":"<name>","description":"<one line>"},{"icon":"<emoji>","name":"<name>","description":"<one line>"},{"icon":"<emoji>","name":"<name>","description":"<one line>"}],"discoveryQuestions":["<q1>","<q2>","<q3>","<q4>","<q5>"],"recommendedResponses":["<r1>","<r2>","<r3>","<r4>","<r5>"],"strengths":["<s1>","<s2>","<s3>","<s4>","<s5>","<s6>"],"weaknesses":["<w1>","<w2>","<w3>","<w4>"],"caseStudies":[{"icon":"🏢","customer":"Enterprise","type":"Finance","challenge":"<challenge>","result":"<result>"},{"icon":"🏥","customer":"Healthcare","type":"Healthcare","challenge":"<challenge>","result":"<result>"},{"icon":"🛒","customer":"Retail","type":"Retail","challenge":"<challenge>","result":"<result>"}],"keyCustomers":[{"logo":"🏢","name":"<company>","industry":"<industry>","color":"#3b82f6"},{"logo":"🏭","name":"<company>","industry":"<industry>","color":"#8b5cf6"},{"logo":"🏦","name":"<company>","industry":"<industry>","color":"#059669"},{"logo":"🛒","name":"<company>","industry":"<industry>","color":"#f59e0b"},{"logo":"🏥","name":"<company>","industry":"<industry>","color":"#ef4444"}],"competitorSummary":[{"name":"${c1}","logo":"<emoji>","color":"#ef4444","marketPosition":"Challenger","overview":"<2 sentences>","strengths":["<s1>","<s2>","<s3>"],"weaknesses":["<w1>","<w2>","<w3>"],"ourEdge":["<e1>","<e2>","<e3>","<e4>","<e5>"],"pricingSummary":"<pricing>"},{"name":"${c2}","logo":"<emoji>","color":"#8b5cf6","marketPosition":"Leader","overview":"<2 sentences>","strengths":["<s1>","<s2>","<s3>"],"weaknesses":["<w1>","<w2>","<w3>"],"ourEdge":["<e1>","<e2>","<e3>","<e4>","<e5>"],"pricingSummary":"<pricing>"}],"featureMatrix":{"labels":{"product":"${productName}","comp1":"${c1}","comp2":"${c2}"},"rows":[{"feature":"<feature>","product":"green","comp1":"yellow","comp2":"red"},{"feature":"<feature>","product":"green","comp1":"green","comp2":"yellow"},{"feature":"<feature>","product":"green","comp1":"red","comp2":"yellow"},{"feature":"<feature>","product":"green","comp1":"yellow","comp2":"red"},{"feature":"<feature>","product":"green","comp1":"red","comp2":"red"},{"feature":"<feature>","product":"green","comp1":"yellow","comp2":"yellow"},{"feature":"<feature>","product":"green","comp1":"red","comp2":"yellow"},{"feature":"<feature>","product":"green","comp1":"yellow","comp2":"red"}]},"tcoData":{"labels":{"product":"${productName}","comp1":"${c1}","comp2":"${c2}"},"maxValue":800,"totals":{"product":"$320K","comp1":"$650K","comp2":"$580K"},"rows":[{"category":"Licensing","product":"$120K","comp1":"$280K","comp2":"$240K"},{"category":"Implementation","product":"$80K","comp1":"$160K","comp2":"$140K"},{"category":"Operations","product":"$70K","comp1":"$130K","comp2":"$120K"},{"category":"Training","product":"$50K","comp1":"$80K","comp2":"$80K"}]},"objectionHandling":[{"objection":"<objection>","response":"<response>"},{"objection":"<objection>","response":"<response>"},{"objection":"<objection>","response":"<response>"},{"objection":"<objection>","response":"<response>"},{"objection":"<objection>","response":"<response>"}],"winLoss":{"winRate":72,"totalDeals":50,"avgDealSize":"$180K","topWinReasons":["<r1>","<r2>","<r3>"],"topLossReasons":["<r1>","<r2>"],"competitorWinRates":[{"competitor":"${c1}","winRate":68},{"competitor":"${c2}","winRate":75}]},"aiCoach":{"productSummary":"<2 sentences>","keyDifferentiators":["<d1>","<d2>","<d3>"],"idealCustomerProfile":"<description>","salesPlaybook":["<play1>","<play2>","<play3>"]}}`;
}

function buildCompetitorPrompt(competitorName, productName, practice) {
  return `Generate a competitor profile for ${competitorName} vs ${productName} (${practice}). Return ONLY valid JSON, no markdown:
{"name":"${competitorName}","logo":"<emoji>","color":"<hex>","marketPosition":"<position>","overview":"<2-3 sentences>","strengths":["<s1>","<s2>","<s3>","<s4>"],"weaknesses":["<w1>","<w2>","<w3>"],"ourEdge":["<e1>","<e2>","<e3>","<e4>","<e5>"],"pricingSummary":"<pricing>"}`;
}

async function generateProductData(productName, practice, description, competitorNames, rawData, jobId) {
  const STAGES = [
    { percent: 10, stage: 'building_prompt',    message: 'Building AI prompt...' },
    { percent: 20, stage: 'calling_gemini',     message: 'Calling Gemini AI (parallel models)...' },
    { percent: 70, stage: 'parsing_response',   message: 'Parsing AI response...' },
    { percent: 90, stage: 'saving_to_database', message: 'Saving to database...' },
  ];

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[0] });
  const prompt = buildProductPrompt(productName, practice, description, competitorNames, rawData);
  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[1] });

  // Tick progress bar while AI is working
  let tickPercent = 20;
  let tickTimer = null;
  if (jobId) {
    tickTimer = setInterval(() => {
      if (tickPercent < 65) {
        tickPercent += 3;
        sse.broadcast('ai_progress', { jobId, percent: tickPercent, stage: 'calling_gemini', message: 'AI is generating your product data...' });
      }
    }, 2000);
  }

  let text;
  try {
    text = await generateWithFallback(prompt);
  } finally {
    if (tickTimer) clearInterval(tickTimer);
  }

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[2] });
  const parsed = parseAiJSON(text);
  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[3] });
  return parsed;
}

async function generateCompetitorProfile(competitorName, productName, practice) {
  const prompt = buildCompetitorPrompt(competitorName, productName, practice);
  const text = await generateWithFallback(prompt);
  return parseAiJSON(text);
}

async function generateAccurate(prompt) {
  return generateWithFallback(prompt, MODELS_ACCURATE);
}

module.exports = { generateProductData, generateCompetitorProfile, generateWithFallback, generateAccurate };
