/**
 * AI service — Google Gemini REST API (direct HTTPS, no SDK dependency).
 * Exported interface is unchanged:
 *   generateProductData(productName, practice, description, competitorNames, rawData, jobId)
 *   generateCompetitorProfile(competitorName, productName, practice)
 *   generateWithFallback(prompt)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');
const sse   = require('../utils/sseEmitter');

// ── Key read lazily so dotenv is fully loaded before first request ────────────
function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set. Add it in server/.env and in the Render Environment tab.');
  return key;
}

// ── Model priority — fastest/cheapest first, fallback on quota / 503 ─────────
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Single Gemini REST call ──────────────────────────────────────────────────
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}
function callGemini(model, prompt, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    });

    const path = `/v1beta/models/${model}:generateContent?key=${getApiKey()}`;

    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path,
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`Gemini ${res.statusCode} (${model}): ${raw.slice(0, 400)}`));
          }
          try {
            const json = JSON.parse(raw);
            // Handle safety / finish-reason blocks
            const candidate = json.candidates?.[0];
            if (!candidate) {
              return reject(new Error('Gemini: no candidates returned. ' + raw.slice(0, 200)));
            }
            const text = candidate.content?.parts?.[0]?.text;
            if (!text) return reject(new Error('Gemini: empty text in response. ' + raw.slice(0, 200)));
            resolve(text);
          } catch (e) {
            reject(new Error('Gemini JSON parse error: ' + raw.slice(0, 200)));
          }
        });
      }
    );

    req.on('error', reject);

    // Hard timeout — Gemini can hang on Render's free tier
    const timer = setTimeout(() => {
      req.destroy(new Error(`Gemini timeout after ${timeoutMs / 1000}s (${model})`));
    }, timeoutMs);
    req.on('close', () => clearTimeout(timer));

    req.write(body);
    req.end();
  });
}

// ─── Retry across models on quota / transient errors ─────────────────────────
async function generateWithFallback(prompt) {
  let lastErr;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await callGemini(model, prompt);
      } catch (err) {
        const msg = err.message || '';
        const isTransient =
          msg.includes('429') || msg.includes('503') ||
          msg.includes('timeout') || msg.includes('UNAVAILABLE') ||
          msg.includes('overloaded') || msg.includes('RESOURCE_EXHAUSTED');
        const isNotFound =
          msg.includes('404') || msg.includes('not found') ||
          msg.includes('MODEL_NOT_FOUND') || msg.includes('is not supported');

        lastErr = err;
        if (isNotFound) break;                          // try next model
        if (isTransient && attempt === 1) { await sleep(2000); continue; }
        if (isTransient) break;                         // try next model
        throw err;                                      // hard error — surface it
      }
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

// ─── Parse AI JSON response (strips markdown fences if present) ──────────────
function parseAiJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/i, '').trim();
  }
  return JSON.parse(cleaned);
}

// ─── Prompt builders ──────────────────────────────────────────────────────────
function buildProductPrompt(productName, practice, description, competitorNames, rawData) {
  const competitorList = competitorNames.length > 0 ? competitorNames.join(', ') : 'Not specified';

  let rawSection = '';
  if (rawData) {
    const content = rawData.text || rawData.combined ||
      (typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2));
    const truncated = content.length > 12000 ? content.slice(0, 12000) + '\n...[truncated]' : content;
    const fileInfo  = rawData.fileCount
      ? `${rawData.fileCount} file(s): ${rawData.fileNames.join(', ')}`
      : (rawData.filename || 'uploaded file');
    rawSection = `\n\nADDITIONAL CONTEXT FROM UPLOADED FILES (${fileInfo}) — use this to enrich your response:\n${truncated}`;
  }

  return `You are a senior product intelligence analyst. Generate a comprehensive product intelligence document for a sales dashboard.

PRODUCT: ${productName}
PRACTICE/COMPANY: ${practice}
DESCRIPTION: ${description || 'Not provided — infer from product name and industry knowledge'}
COMPETITORS: ${competitorList}
${rawSection}

Return ONLY a valid JSON object (no markdown, no explanation, just raw JSON) with EXACTLY this structure:

{
  "overview": {
    "logo": "<single emoji representing the product>",
    "name": "${productName.toUpperCase()}",
    "category": "<product category e.g. Cloud Security / APM / Messaging>",
    "deployment": "<e.g. SaaS / On-Prem / Hybrid>",
    "targetUsers": "<e.g. DevOps, Security Teams, IT Ops>",
    "productLaunch": "<year>",
    "marketPosition": "<e.g. Leader (Gartner Magic Quadrant)>",
    "description": "<2-3 sentence product description>"
  },
  "keyFeatures": [
    { "icon": "<emoji>", "name": "<feature name>", "description": "<one line>" }
  ],
  "discoveryQuestions": ["<question 1>", "<question 2>", "<question 3>", "<question 4>", "<question 5>"],
  "recommendedResponses": ["<response 1>", "<response 2>", "<response 3>", "<response 4>", "<response 5>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>", "<strength 5>", "<strength 6>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>", "<weakness 4>"],
  "caseStudies": [
    { "icon": "<emoji>", "customer": "<Customer Type>", "type": "<Industry>", "challenge": "<challenge>", "result": "<quantified result>" },
    { "icon": "<emoji>", "customer": "<Customer Type>", "type": "<Industry>", "challenge": "<challenge>", "result": "<quantified result>" },
    { "icon": "<emoji>", "customer": "<Customer Type>", "type": "<Industry>", "challenge": "<challenge>", "result": "<quantified result>" }
  ],
  "keyCustomers": [
    { "logo": "<emoji>", "name": "<company name>", "industry": "<industry>", "color": "<hex color>" },
    { "logo": "<emoji>", "name": "<company name>", "industry": "<industry>", "color": "<hex color>" },
    { "logo": "<emoji>", "name": "<company name>", "industry": "<industry>", "color": "<hex color>" },
    { "logo": "<emoji>", "name": "<company name>", "industry": "<industry>", "color": "<hex color>" },
    { "logo": "<emoji>", "name": "<company name>", "industry": "<industry>", "color": "<hex color>" }
  ],
  "competitorSummary": [
    {
      "name": "${competitorNames[0] || 'Competitor 1'}",
      "logo": "<emoji>",
      "color": "<hex>",
      "marketPosition": "<Leader/Challenger/Niche>",
      "overview": "<2 sentence overview>",
      "strengths": ["<s1>", "<s2>", "<s3>"],
      "weaknesses": ["<w1>", "<w2>", "<w3>"],
      "pricingSummary": "<pricing overview>"
    }
  ],
  "featureMatrix": {
    "labels": { "product": "${productName}", "comp1": "${competitorNames[0] || 'Competitor 1'}", "comp2": "${competitorNames[1] || 'Competitor 2'}" },
    "rows": [
      { "feature": "<feature name>", "product": "green", "comp1": "yellow", "comp2": "red" }
    ]
  },
  "tcoData": {
    "labels": { "product": "${productName}", "comp1": "${competitorNames[0] || 'Competitor 1'}", "comp2": "${competitorNames[1] || 'Competitor 2'}" },
    "maxValue": 800,
    "totals": { "product": "$XXXk", "comp1": "$XXXk", "comp2": "$XXXk" },
    "rows": [
      { "component": "Licensing",      "product": "$XXXk", "comp1": "$XXXk", "comp2": "$XXXk" },
      { "component": "Implementation", "product": "$XXXk", "comp1": "$XXXk", "comp2": "$XXXk" },
      { "component": "Support",        "product": "$XXXk", "comp1": "$XXXk", "comp2": "$XXXk" },
      { "component": "Training",       "product": "$XXXk", "comp1": "$XXXk", "comp2": "$XXXk" },
      { "component": "Infrastructure", "product": "$XXXk", "comp1": "$XXXk", "comp2": "$XXXk" }
    ]
  },
  "objectionHandling": [
    { "objection": "\\"<competitor> is better because....\\"", "response": "<response>" },
    { "objection": "\\"<objection>...\\"", "response": "<response>" },
    { "objection": "\\"<objection>...\\"", "response": "<response>" },
    { "objection": "\\"<objection>...\\"", "response": "<response>" }
  ],
  "winLoss": {
    "total": 40,
    "won": 25,
    "lost": 15,
    "winRate": 63,
    "competitors": [
      { "label": "${competitorNames[0] || 'Competitor 1'}", "wins": 15, "pct": 60, "color": "#a855f7" },
      { "label": "${competitorNames[1] || 'Competitor 2'}", "wins": 7,  "pct": 28, "color": "#3b82d4" },
      { "label": "Others", "wins": 3, "pct": 12, "color": "#5a6478" }
    ],
    "topMessages": ["<message 1>", "<message 2>", "<message 3>", "<message 4>"]
  },
  "aiCoach": {
    "customerSays": "\\"<typical customer objection>\\"",
    "suggestedResponse": "<detailed suggested sales response>",
    "recommendedCaseStudy": "<Customer Type> – <result>",
    "winProbability": "HIGH",
    "kvps": ["<kvp1>", "<kvp2>", "<kvp3>", "<kvp4>"]
  },
  "pricingTiers": [
    { "tier": "Starter",      "monthlyPrice": "$X/unit/mo",  "annualPrice": "$XK/yr",    "features": ["<f1>", "<f2>"] },
    { "tier": "Professional", "monthlyPrice": "$X/unit/mo",  "annualPrice": "$XK/yr",    "features": ["<f1>", "<f2>", "<f3>"] },
    { "tier": "Enterprise",   "monthlyPrice": "Custom",       "annualPrice": "$XXK+/yr",  "features": ["<f1>", "<f2>", "<f3>", "<f4>"] }
  ]
}

Rules:
- Include at least 8 keyFeatures items
- Include at least 8 featureMatrix rows
- Include all ${competitorNames.length > 1 ? competitorNames.length : 2} competitors in competitorSummary
- Use realistic, accurate data based on your knowledge of ${productName}
- featureMatrix values must be exactly "green", "yellow", or "red"
- All monetary values in tcoData represent 3-year totals
- Return ONLY the JSON, no backticks, no markdown`;
}

function buildCompetitorPrompt(competitorName, productName, practice) {
  return `You are a competitive intelligence analyst. Generate a detailed competitor profile.

COMPETITOR: ${competitorName}
BEING COMPARED TO: ${productName} (${practice} product)

Return ONLY a valid JSON object (no markdown, no backticks):

{
  "name": "${competitorName}",
  "logo": "<single emoji>",
  "color": "<hex color that matches their brand>",
  "marketPosition": "<Leader/Challenger/Niche/Visionary>",
  "overview": "<2-3 sentence company and product overview>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "pricingSummary": "<indicative pricing e.g. $X/unit/mo, enterprise starting $XXK/yr>"
}`;
}

// ─── Main product generation (broadcasts SSE progress) ───────────────────────
async function generateProductData(productName, practice, description, competitorNames, rawData, jobId) {
  const STAGES = [
    { percent: 10, stage: 'building_prompt',   message: 'Building AI prompt...' },
    { percent: 20, stage: 'calling_gemini',    message: 'Calling Gemini AI...' },
    { percent: 70, stage: 'parsing_response',  message: 'Parsing AI response...' },
    { percent: 90, stage: 'saving_to_database',message: 'Saving to database...' },
  ];

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[0] });

  const prompt = buildProductPrompt(productName, practice, description, competitorNames, rawData);

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[1] });

  // Emit incremental ticks while Gemini is thinking so the progress bar moves
  let tickPercent = 20;
  let tickTimer   = null;
  if (jobId) {
    tickTimer = setInterval(() => {
      if (tickPercent < 65) {
        tickPercent += 5;
        sse.broadcast('ai_progress', {
          jobId, percent: tickPercent,
          stage: 'calling_gemini',
          message: 'Gemini is generating your product data...',
        });
      }
    }, 3000);
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

// ─── Competitor profile ───────────────────────────────────────────────────────
async function generateCompetitorProfile(competitorName, productName, practice) {
  const prompt = buildCompetitorPrompt(competitorName, productName, practice);
  const text   = await generateWithFallback(prompt);
  return parseAiJSON(text);
}

module.exports = { generateProductData, generateCompetitorProfile, generateWithFallback };
