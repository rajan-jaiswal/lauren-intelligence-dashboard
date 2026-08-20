import React from 'react';

// ── Customer initials badge ───────────────────────────────────────────────
function CustomerBadge({ name, color }) {
  const words = (name || '').split(' ').filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (name || '--').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 900, color,
    }}>
      {initials}
    </div>
  );
}

// ── Case icon by industry ─────────────────────────────────────────────────
function CaseIcon({ type }) {
  const t = (type || '').toLowerCase();
  if (t.includes('bank') || t.includes('financ')) {
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 22, height: 22 }}><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 5H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM6 13a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd"/></svg>;
  }
  if (t.includes('telecom') || t.includes('telco')) {
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 22, height: 22 }}><path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd"/></svg>;
  }
  if (t.includes('energy') || t.includes('util')) {
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 22, height: 22 }}><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>;
  }
  return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 22, height: 22 }}><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>;
}

export default function CustomersPage({ data }) {
  if (!data) return null;
  const { keyCustomers, caseStudies } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Key Customers</div>

      <div className="card">
        <div className="card-title">CUSTOMER SHOWCASE</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {(keyCustomers || []).map((c, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              background: 'var(--card-bg2)', border: '1px solid var(--card-border)',
              borderRadius: 10, padding: '18px 22px', textAlign: 'center', minWidth: 120,
            }}>
              <CustomerBadge name={c.name} color={c.color || 'var(--blue)'} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
              {c.industry && (
                <span style={{ fontSize: 10, background: 'var(--blue-lt)', color: 'var(--blue)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  {c.industry}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">CUSTOMER WIN HIGHLIGHTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(caseStudies || []).map((c, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '12px 14px',
              alignItems: 'flex-start', background: 'var(--card-bg2)',
              border: '1px solid var(--card-border)', borderRadius: 8,
            }}>
              <div style={{ color: 'var(--blue)', flexShrink: 0 }}>
                <CaseIcon type={c.type || c.category} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.customer}</span>
                  <span style={{ fontSize: 10, background: 'var(--blue-lt)', color: 'var(--blue)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    {c.type || c.category}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{c.challenge}</div>
              </div>
              <div style={{
                background: 'var(--green-lt)', border: '1px solid rgba(45,202,110,.3)',
                borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700,
                color: 'var(--green)', maxWidth: 260, flexShrink: 0,
                display: 'flex', alignItems: 'flex-start', gap: 6,
              }}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2 }}>
                  <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                </svg>
                {c.result}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
