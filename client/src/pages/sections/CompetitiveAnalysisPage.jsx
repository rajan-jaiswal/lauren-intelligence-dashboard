import React from 'react';

const DOT_COLOR = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };

// ── Competitor initials badge ─────────────────────────────────────────────
function CompetitorBadge({ name, color }) {
  const words = (name || '').split(' ').filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (name || '--').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: `${color}22`, border: `2px solid ${color}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 900, color, letterSpacing: .4,
    }}>
      {initials}
    </div>
  );
}

export default function CompetitiveAnalysisPage({ data }) {
  if (!data) return null;
  const { competitorSummary, featureMatrix } = data;
  const labels = featureMatrix?.labels || { product: 'Instana', comp1: 'Datadog', comp2: 'Dynatrace' };
  const rows   = featureMatrix?.rows || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Competitive Analysis</div>

      {/* Competitor Cards */}
      <div className="grid-2">
        {(competitorSummary || []).map((c, i) => (
          <div key={i} className="card" style={{ borderTop: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <CompetitorBadge name={c.name} color={c.color} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.name}</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-lt)', padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>
                  {c.marketPosition}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>{c.overview}</p>
            <div className="grid-2">
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6 }}>Strengths</div>
                {(c.strengths || []).map((s, j) => (
                  <div key={j} style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 5, alignItems: 'flex-start' }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12, color: 'var(--green)', flexShrink: 0, marginTop: 2 }}>
                      <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                    </svg>
                    <span style={{ color: 'var(--text)' }}>{s}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6 }}>Weaknesses</div>
                {(c.weaknesses || []).map((w, j) => (
                  <div key={j} style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 5, alignItems: 'flex-start' }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12, color: 'var(--red)', flexShrink: 0, marginTop: 2 }}>
                      <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
                    </svg>
                    <span style={{ color: 'var(--text)' }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Matrix */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>FEATURE COMPARISON MATRIX</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
            {[['var(--green)', 'Better'], ['var(--yellow)', 'Similar'], ['var(--red)', 'Weaker']].map(([col, lbl]) => (
              <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                <svg viewBox="0 0 8 8" style={{ width: 9, height: 9 }}><circle cx="4" cy="4" r="4" fill={col}/></svg>
                {lbl}
              </span>
            ))}
          </div>
        </div>
        <div className="table-scroll-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Feature</th>
              <th style={{ textAlign: 'center', color: 'var(--blue)' }}>{labels.product}</th>
              <th style={{ textAlign: 'center' }}>{labels.comp1}</th>
              <th style={{ textAlign: 'center' }}>{labels.comp2}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.feature}</td>
                {['product', 'comp1', 'comp2'].map((k) => (
                  <td key={k} style={{ textAlign: 'center' }}>
                    <svg viewBox="0 0 10 10" style={{ width: 11, height: 11 }}>
                      <circle cx="5" cy="5" r="5" fill={DOT_COLOR[r[k]]}/>
                    </svg>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
