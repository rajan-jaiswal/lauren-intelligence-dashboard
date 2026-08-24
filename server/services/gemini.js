require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sse = require('../utils/sseEmitter');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildProductPrompt(productName, practice, description, competitorNames, rawData) {
  const competitorList = competitorNames.length > 0 ? competitorNames.join(', ') : 'Not specified';

  // Extract readable text from rawData — prefer .text / .combined; fall back to JSON
  let rawSection = '';
  if (rawData) {
    const content = rawData.text || rawData.combined || (typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2));
    // Truncate to ~12 000 chars to stay within Gemini context limits
    const truncated = content.length > 12000 ? content.slice(0, 12000) + '\n...[truncated]' : content;
    const fileInfo = rawData.fileCount
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

// ─── Competitor profile prompt ────────────────────────────────────────────────
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

// ─── Parse Gemini JSON response safely ───────────────────────────────────────
function parseGeminiJSON(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/i, '').trim();
  }
  return JSON.parse(cleaned);
}

// ─── Fallback model list — tried in order on 429 / 503 ──────────────────────
const MODEL_PRIORITY = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Hard timeout wrapper — Gemini can hang; this prevents silent freezes ────
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms / 1000}s waiting for ${label}`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function generateWithFallback(prompt) {
  let lastErr;
  for (const modelName of MODEL_PRIORITY) {
    // Attempt each model up to 2 times with a short backoff on transient 503s
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // 90-second hard timeout per attempt — prevents silent hangs on Render
        const result = await withTimeout(
          model.generateContent(prompt),
          90000,
          modelName
        );
        return result.response.text();
      } catch (err) {
        const isTransient = err.message && (
          err.message.includes('503') ||
          err.message.includes('429') ||
          err.message.includes('UNAVAILABLE') ||
          err.message.includes('Timeout')
        );
        const isNotFound = err.message && (
          err.message.includes('404') ||
          err.message.includes('not found') ||
          err.message.includes('not supported')
        );

        if (isNotFound) {
          lastErr = err;
          break;
        }

        if (isTransient && attempt === 1) {
          await sleep(2000);
          lastErr = err;
          continue;
        }

        if (isTransient) {
          lastErr = err;
          break;
        }

        throw err;
      }
    }
  }
  throw lastErr;
}

// ─── Main product generation ─────────────────────────────────────────────────
async function generateProductData(productName, practice, description, competitorNames, rawData, jobId) {

  const STAGES = [
    { percent: 10, stage: 'building_prompt',   message: 'Building AI prompt...' },
    { percent: 25, stage: 'calling_gemini',    message: 'Calling Gemini AI...' },
    { percent: 70, stage: 'parsing_response',  message: 'Parsing AI response...' },
    { percent: 90, stage: 'saving_to_database',message: 'Saving to database...' },
  ];

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[0] });

  const prompt = buildProductPrompt(productName, practice, description, competitorNames, rawData);

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[1] });

  // Emit incremental ticks while Gemini is thinking so the bar visibly moves
  let tickPercent = 25;
  let tickTimer = null;
  if (jobId) {
    tickTimer = setInterval(() => {
      if (tickPercent < 65) {
        tickPercent += 5;
        sse.broadcast('ai_progress', { jobId, percent: tickPercent, stage: 'calling_gemini', message: 'Gemini is generating your product data...' });
      }
    }, 4000); // nudge +5% every 4 s while waiting
  }

  let text;
  try {
    text = await generateWithFallback(prompt);
  } finally {
    if (tickTimer) clearInterval(tickTimer);
  }

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[2] });

  const parsed = parseGeminiJSON(text);

  if (jobId) sse.broadcast('ai_progress', { jobId, ...STAGES[3] });

  return parsed;
}

// ─── Competitor profile generation ──────────────────────────────────────────
async function generateCompetitorProfile(competitorName, productName, practice) {
  const prompt = buildCompetitorPrompt(competitorName, productName, practice);
  const text = await generateWithFallback(prompt);
  return parseGeminiJSON(text);
}

module.exports = { generateProductData, generateCompetitorProfile, generateWithFallback };
