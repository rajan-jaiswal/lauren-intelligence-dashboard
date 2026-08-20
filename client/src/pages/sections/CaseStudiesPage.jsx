import React from 'react';

const TYPE_COLORS = {
  'Global Bank': 'var(--blue)', 'Banking': 'var(--blue)',
  'Global Telecom': 'var(--purple)', 'Telecom': 'var(--purple)',
  'Energy Provider': 'var(--orange)', 'Utilities': 'var(--orange)',
  'Healthcare': 'var(--green)', 'Retail': 'var(--orange)',
};

// ── Case study icon by industry type ─────────────────────────────────────
function CaseIcon({ type }) {
  const t = (type || '').toLowerCase();
  if (t.includes('bank') || t.includes('financ')) {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 26, height: 26 }}>
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 5H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM6 13a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd"/>
      </svg>
    );
  }
  if (t.includes('telecom') || t.includes('telco')) {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 26, height: 26 }}>
        <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd"/>
      </svg>
    );
  }
  if (t.includes('energy') || t.includes('util')) {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 26, height: 26 }}>
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
      </svg>
    );
  }
  if (t.includes('health')) {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 26, height: 26 }}>
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
      </svg>
    );
  }
  // default: building / enterprise
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 26, height: 26 }}>
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
    </svg>
  );
}

// ── Customer initials badge ───────────────────────────────────────────────
function CustomerBadge({ name, color }) {
  const words = (name || '').split(' ').filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (name || '--').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 900, color,
    }}>
      {initials}
    </div>
  );
}

export default function CaseStudiesPage({ data }) {
  if (!data) return null;
  const { caseStudies, keyCustomers } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Case Studies</div>

      <div className="grid-3">
        {(caseStudies || []).map((c, i) => {
          const typeLabel = c.type || c.category || 'Customer';
          const color = TYPE_COLORS[typeLabel] || 'var(--blue)';
          return (
            <div key={i} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ color }}><CaseIcon type={typeLabel} /></div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginBottom: 4 }}>
                    {typeLabel}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{c.customer}</div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 5 }}>Challenge</div>
                <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-muted)' }}>{c.challenge}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 5 }}>Result</div>
                <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: 'var(--text)' }}>{c.result}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-title">KEY CUSTOMERS</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(keyCustomers || []).map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', background: 'var(--card-bg2)',
              border: '1px solid var(--card-border)', borderRadius: 20,
              fontSize: 12, fontWeight: 600,
            }}>
              <CustomerBadge name={c.name} color={c.color || 'var(--blue)'} />
              <span style={{ color: 'var(--text)' }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
