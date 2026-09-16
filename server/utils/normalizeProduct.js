/**
 * Normalize AI-generated product data before saving to MongoDB.
 * Gemini occasionally returns objects instead of plain strings for
 * discoveryQuestions and recommendedResponses. This flattens them.
 */

function extractString(item, ...keys) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    for (const k of keys) {
      if (typeof item[k] === 'string' && item[k]) return item[k];
    }
    return JSON.stringify(item);
  }
  return String(item ?? '');
}

function normalizeProduct(data) {
  if (!data) return data;
  const out = { ...data };

  // competitors must always be a plain string (comma-separated)
  if (Array.isArray(out.competitors)) {
    out.competitors = out.competitors.join(', ');
  } else if (out.competitors != null && typeof out.competitors !== 'string') {
    out.competitors = String(out.competitors);
  }

  if (Array.isArray(out.discoveryQuestions)) {
    out.discoveryQuestions = out.discoveryQuestions.map(q =>
      extractString(q, 'question', 'text', 'q')
    );
  }

  if (Array.isArray(out.recommendedResponses)) {
    out.recommendedResponses = out.recommendedResponses.map(r =>
      extractString(r, 'answer', 'response', 'text', 'r')
    );
  }

  if (Array.isArray(out.strengths)) {
    out.strengths = out.strengths.map(s => extractString(s, 'text', 'strength'));
  }

  if (Array.isArray(out.weaknesses)) {
    out.weaknesses = out.weaknesses.map(w => extractString(w, 'text', 'weakness'));
  }

  // winLoss.competitors must be [{label, wins, pct, color}] objects, not strings
  if (out.winLoss && Array.isArray(out.winLoss.competitors)) {
    out.winLoss = {
      ...out.winLoss,
      competitors: out.winLoss.competitors
        .filter(c => c != null)
        .map(c => {
          if (typeof c === 'string') {
            return { label: c, wins: 0, pct: 0, color: '#5a6478' };
          }
          return c;
        }),
    };
  }

  return out;
}

module.exports = normalizeProduct;
