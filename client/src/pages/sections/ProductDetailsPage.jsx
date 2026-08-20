import React from 'react';

// ── Reusable check/x SVG icons ─────────────────────────────────────────────
function CheckIcon({ size = 13 }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor"
      style={{ width: size, height: size, color: 'var(--green)', flexShrink: 0, marginTop: 1 }}>
      <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
    </svg>
  );
}
function XIcon({ size = 13 }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor"
      style={{ width: size, height: size, color: 'var(--red)', flexShrink: 0, marginTop: 1 }}>
      <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
    </svg>
  );
}

// ── Feature icon lookup (shared subset) ──────────────────────────────────
const FeatureIcons = {
  'Automatic Discovery':          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 1011 5z" clipRule="evenodd"/></svg>,
  'AI Root Cause Analysis':        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>,
  'Trace Analytics':               <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  'Kubernetes Visibility':         <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  'Real-time Monitoring':          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  'Smart Alert Engine':            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>,
  'Hybrid Monitoring':             <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>,
  'OpenShift Support':             <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
};

function getFeatureIcon(name) {
  return FeatureIcons[name] || (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
    </svg>
  );
}

export default function ProductDetailsPage({ data }) {
  if (!data) return null;
  const { keyFeatures, discoveryQuestions, recommendedResponses, strengths, weaknesses } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Product Details</div>

      {/* Key Features */}
      <div className="card">
        <div className="card-title">KEY FEATURES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {(keyFeatures || []).map((f, i) => (
            <div key={i} className="icon-box">
              <div style={{ color: 'var(--blue)' }}>{getFeatureIcon(f.name)}</div>
              <span>{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Discovery + Responses */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">DISCOVERY QUESTIONS</div>
          {(discoveryQuestions || []).map((q, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start', padding: '8px 10px', background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 6 }}>
              <span style={{ background: 'var(--blue-lt)', color: 'var(--blue)', border: '1px solid var(--blue)', borderRadius: '50%', width: 20, height: 20, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>{q}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title green">RECOMMENDED RESPONSES</div>
          {(recommendedResponses || []).map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start', padding: '8px 10px', background: 'var(--green-lt)', border: '1px solid rgba(45,202,110,.25)', borderRadius: 6 }}>
              <CheckIcon size={14} />
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid-2">
        <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
          <div className="card-title green">STRENGTHS</div>
          {(strengths || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start', padding: '7px 10px', background: 'var(--green-lt)', borderRadius: 6 }}>
              <CheckIcon size={13} />
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>{s}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--red)' }}>
          <div className="card-title red">WEAKNESSES</div>
          {(weaknesses || []).map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start', padding: '7px 10px', background: 'var(--red-lt)', borderRadius: 6 }}>
              <XIcon size={13} />
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
