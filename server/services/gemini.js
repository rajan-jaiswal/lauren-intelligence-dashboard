/**
 * AI service — uses xAI Grok (OpenAI-compatible API).
 * Keeps the same exported interface as the old Gemini service so all
 * callers in routes/products.js work unchanged:
 *   generateProductData(...)
 *   generateCompetitorProfile(...)
 *   generateWithFallback(prompt)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');
const sse   = require('../utils/sseEmitter');

// Read API key lazily so dotenv has fully populated process.env by the time it's used.
const API_HOST = 'api.x.ai';
const API_PATH = '/v1/chat/completions';
function getApiKey() {
  const key = process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('XAI_API_KEY is not set. Add it in server/.env and in the Render Environment tab.');
  return key;
}

// Model priority list — tried in order on rate-limit / overload errors
const MODEL_PRIORITY = [
  'grok-3-fast',
  'grok-3',
  'grok-2-1212',
  'grok-beta',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Raw HTTPS call to xAI ─────────────────────────────────────────────────
function callXai(model, prompt, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 8192,
    });

    const req = https.request(
      {
        hostname: API_HOST,
        path:     API_PATH,
        method:   'POST',
        headers:  {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${getApiKey()}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`xAI ${res.statusCode}: ${raw.slice(0, 300)}`));
          }
          try {
            const json = JSON.parse(raw);
            const text = json.choices?.[0]?.message?.content;
            if (!text) return reject(new Error('Empty xAI response: ' + raw.slice(0, 200)));
            resolve(text);
          } catch (e) {
            reject(new Error('xAI JSON parse error: ' + raw.slice(0, 200)));
          }
        });
      }
    );

    req.on('error', reject);

    const timer = setTimeout(() => {
      req.destroy(new Error(`xAI timeout after ${timeoutMs / 1000}s (${model})`));
    }, timeoutMs);

    res => { clearTimeout(timer); };
    req.on('close', () => clearTimeout(timer));

    req.write(body);
    req.end();
  });
}

// ─── Retry across models on 429 / 503 / timeout ───────────────────────────
async function generateWithFallback(prompt) {
  let lastErr;
  for (const model of MODEL_PRIORITY) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await callXai(model, prompt);
      } catch (err) {
        const msg = err.message || '';
        const isTransient =
          msg.includes('429') || msg.includes('503') ||
          msg.includes('timeout') || msg.includes('UNAVAILABLE') ||
          msg.includes('overloaded');
        const isNotFound =
          msg.includes('404') || msg.includes('not found') ||
          msg.includes('model_not_found') || msg.includes('does not exist');

        lastErr = err;

        if (isNotFound) break;                         // try next model
        if (isTransient && attempt === 1) { await sleep(1500); continue; }
        if (isTransient) break;                        // try next model
        throw err;                                     // hard error — surface it
      }
    }
  }
  throw lastErr || new Error('All xAI models failed');
}

// ─── Parse JSON from AI response (strips markdown fences if present) ──────
function parseAiJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/i, '').trim();
  }
  return JSON.parse(cleaned);
}

// ─── Prompt builders (unchanged logic from previous Gemini version) ────────
function buildProductPrompt(productName, practice, description, competitorNames, rawData) {
  const competitorList = competitorNames.length > 0 ? competitorNames.join(', ') : 'Not specified';

  let rawSection = '';
  if (rawData) {
    const content = rawData.text || rawData.combined || (typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2));
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

// ─── Main product generation (broadcasts SSE progress) ─────────────────────
async function generateProductData(productName, practice, description, competitorNames, rawData, jobId) {
  const STAGES = [
    { percent: 10, stage: 'building_prompt',    message: 'Building AI prompt...' },
    { percent: 20, stage: 'calling_grok',        message: 'Calling Grok AI...' },
    { percent: 70, stage: 'parsing_response',    message: 'Parsing AI response...' },
    { percent: 90, stage: 'saving_to_database',  message: 'Saving to database...' },
  ];

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[0] });

  const prompt = buildProductPrompt(productName, practice, description, competitorNames, rawData);

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[1] });

  // Emit incremental ticks while Grok is working so the bar visibly moves
  let tickPercent = 20;
  let tickTimer   = null;
  if (jobId) {
    tickTimer = setInterval(() => {
      if (tickPercent < 65) {
        tickPercent += 5;
        sse.broadcast('ai_progress', { jobId, percent: tickPercent, stage: 'calling_grok', message: 'Grok is generating your product data...' });
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

// ─── Competitor profile ────────────────────────────────────────────────────
async function generateCompetitorProfile(competitorName, productName, practice) {
  const prompt = buildCompetitorPrompt(competitorName, productName, practice);
  const text   = await generateWithFallback(prompt);
  return parseAiJSON(text);
}

module.exports = { generateProductData, generateCompetitorProfile, generateWithFallback };
