import React from 'react';

const DOT = { green: '#2dca6e', yellow: '#f5c518', red: '#ff5a5a' };
function RatingDot({ rating }) {
  return <svg viewBox="0 0 10 10" style={{ width: 10, height: 10 }}><circle cx="5" cy="5" r="5" fill={DOT[rating] || DOT.yellow}/></svg>;
}
function CheckIcon({ color = '#2dca6e', size = 11 }) {
  return <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: size, height: size, color, flexShrink: 0, marginTop: 1 }}><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>;
}
function XIcon({ color = '#ff5a5a', size = 11 }) {
  return <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: size, height: size, color, flexShrink: 0, marginTop: 1 }}><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>;
}

const CAP_ICONS = {
  cloud:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"/></svg>,
  ai:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  chart:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  rocket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>,
  devops: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477"/></svg>,
  globe:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};
const IND_ICONS = {
  factory: <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" clipRule="evenodd"/></svg>,
  bank:    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 5H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM6 13a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd"/></svg>,
  health:  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>,
  retail:  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/></svg>,
  telecom: <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>,
  govt:    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>,
};
const BV_ICONS = {
  cost:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 24, height: 24 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  speed:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 24, height: 24 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 24, height: 24 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  rocket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 24, height: 24 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>,
  ops:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 24, height: 24 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
};

function WinPie({ competitors }) {
  const r = 32, cx = 42, cy = 42, sw = 12;
  const total = (competitors || []).reduce((s, c) => s + c.wins, 0) || 1;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const segs = (competitors || []).map((c) => {
    const seg = { ...c, dashLen: (c.wins / total) * circ, dashOff: off };
    off += (c.wins / total) * circ;
    return seg;
  });
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--card-border)" strokeWidth={sw}/>
      {segs.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw}
          strokeDasharray={`${s.dashLen} ${circ}`}
          strokeDashoffset={-s.dashOff + circ * 0.25}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

// Section heading
function SH({ num, title, color = '#e8520a' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
      <div style={{ background: color, color: '#fff', borderRadius: 4, fontSize: 9.5, fontWeight: 900, padding: '2px 6px', whiteSpace: 'nowrap' }}>{num}</div>
      <span style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: .6 }}>{title}</span>
    </div>
  );
}

function LogoTile({ name, logo, color }) {
  return (
    <div style={{ background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 5, padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 38 }}>
      {logo ? <img src={logo} alt={name} style={{ maxHeight: 24, maxWidth: 80, objectFit: 'contain' }}/> : <span style={{ fontSize: 11, fontWeight: 900, color }}>{name}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function AwsDashboardPage({ data }) {
  if (!data) return null;
  const {
    overview, coreCapabilities, discoveryQuestions, recommendedResponses,
    laurenValueProposition, strengths, weaknesses,
    competitorSummary, featureMatrix,
    industrySolutions: industrySolutionsField, industryUseCases,
    keyCustomers, businessValue, objectionHandling, aiCoach,
    winLoss, executiveMessaging, tcoData,
  } = data;

  // Support both field names (static data uses industrySolutions, DB uses industryUseCases)
  const industrySolutions = industrySolutionsField || industryUseCases || [];

  // Support both topWinReasons/topLossReasons (static) and topMessages (DB)
  const topWinReasons  = winLoss?.topWinReasons  || winLoss?.topMessages || [];
  const topLossReasons = winLoss?.topLossReasons || [];

  const fmRows = featureMatrix?.rows || [];
  const O = '#ff9900'; // AWS orange
  const SEC = '#e8520a';

  // Pair responses with triggers
  const respGroups = [
    { trigger: '"We want to reduce cloud costs."',          color: '#4a9eff', items: (recommendedResponses || []).slice(0, 3) },
    { trigger: '"We are exploring AI."',                    color: '#b47fff', items: (recommendedResponses || []).slice(3, 6) },
    { trigger: '"We need better security."',                color: '#ff5a5a', items: (recommendedResponses || []).slice(6, 9) },
    { trigger: '"We want to migrate from on-prem."',        color: '#2dca6e', items: (recommendedResponses || []).slice(9, 12) },
    { trigger: '"Need better application performance."',    color: '#ff8c42', items: (recommendedResponses || []).slice(12) },
  ];

  // shared styles
  const card = { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '11px 13px' };
  const TH = { padding: '4px 6px', color: 'var(--text-muted)', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: .4, textAlign: 'left', borderBottom: '2px solid var(--card-border)', whiteSpace: 'nowrap' };
  const TD = { padding: '5px 6px', fontSize: 11.5, color: 'var(--text)', verticalAlign: 'top' };
  const TDM = { padding: '5px 6px', fontSize: 11.5, color: 'var(--text-muted)', verticalAlign: 'top' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>

      {/* ── BANNER ── */}
      <div style={{ background: 'linear-gradient(135deg,#0d1526 0%,#1a2744 100%)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/icons/aws.svg" alt="AWS" style={{ height: 30 }}/>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: O, letterSpacing: .4, lineHeight: 1.1 }}>AWS SALES INTELLIGENCE &amp; COMPETITIVE DASHBOARD</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Your Trusted Cloud Partner to Build, Modernise and Innovate with AWS</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 10.5, color: 'rgba(255,255,255,.7)', flexWrap: 'wrap' }}>
          {['AWS Advanced Tier Services Partner','100+ AWS Certified Professionals','Proven Frameworks & Accelerators','24x7 Managed Services & Support','32+ Years | 1000+ Customers'].map((t) => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg viewBox="0 0 6 6" style={{ width: 6, height: 6 }}><circle cx="3" cy="3" r="3" fill={O}/></svg>{t}
            </span>
          ))}
        </div>
      </div>

      {/* ══ ROW A: Overview(fixed) + Capabilities(fixed) + Discovery Q&A + Responses ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 220px 1fr 1fr', gap: 9 }}>

        {/* 1. AWS Overview */}
        <div style={{ ...card, borderTop: `3px solid ${O}` }}>
          <SH num="1." title="AWS Overview" color={SEC}/>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, padding: '5px', background: 'var(--card-bg2)', borderRadius: 6, border: '1px solid var(--card-border)' }}>
            <img src="/icons/aws.svg" alt="AWS" style={{ height: 36, objectFit: 'contain' }}/>
          </div>
          {[
            { label: 'Category',         val: overview?.category },
            { label: 'Position',         val: overview?.position },
            { label: 'Services',         val: overview?.services },
            { label: 'Regions',          val: overview?.regions },
            { label: 'Target Customers', val: overview?.targetCustomers },
            { label: 'Core Focus Areas', val: overview?.coreFocusAreas },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', gap: 6, fontSize: 11, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--card-border)', alignItems: 'flex-start', lineHeight: 1.35 }}>
              <svg viewBox="0 0 8 8" fill={O} style={{ width: 7, height: 7, flexShrink: 0, marginTop: 3 }}><circle cx="4" cy="4" r="3"/></svg>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{r.label}: </span><span style={{ color: 'var(--text)' }}>{r.val}</span></div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 6, fontStyle: 'italic' }}>{overview?.description}</p>
        </div>

        {/* 2. Core Capabilities — 4×2 grid */}
        <div style={card}>
          <SH num="2." title="AWS Core Capabilities" color={SEC}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {(coreCapabilities || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ color: O }}>{CAP_ICONS[c.icon] || CAP_ICONS.cloud}</div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Discovery Questions WITH Answers */}
        <div style={card}>
          <SH num="3." title="Discovery Questions &amp; Answers" color={SEC}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(discoveryQuestions || []).map((item, i) => {
              const q = typeof item === 'string' ? item : item.question;
              const a = typeof item === 'string' ? null : item.answer;
              return (
                <div key={i} style={{ background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 5, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: a ? 4 : 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: 'rgba(74,158,255,.15)', border: '1px solid rgba(74,158,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, color: '#4a9eff' }}>{i + 1}</div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{q}</span>
                  </div>
                  {a && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', paddingLeft: 24 }}>
                      <svg viewBox="0 0 10 10" style={{ width: 8, height: 8, flexShrink: 0, marginTop: 3, color: O }} fill="currentColor"><path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>{a}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Recommended Responses */}
        <div style={card}>
          <SH num="4." title="Recommended Responses" color={SEC}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 5 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Customer Says</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>AWS Value / How We Help</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {respGroups.map((g, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '6px 7px', background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 5 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: g.color, flexShrink: 0, marginTop: 4 }}/>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>{g.trigger}</span>
                </div>
                <div>
                  {g.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', gap: 4, alignItems: 'flex-start', marginBottom: 3 }}>
                      <CheckIcon color={g.color} size={10}/>
                      <span style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.35 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ROW B: Lauren VP + Strengths/Weaknesses + Competitive Snapshot ═ */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 220px 1fr', gap: 9 }}>

        {/* 5. Lauren Value Proposition */}
        <div style={card}>
          <SH num="5." title="Lauren Value Proposition" color={SEC}/>
          <div style={{ textAlign: 'center', marginBottom: 7 }}>
            <img src="/icons/aws.svg" alt="AWS" style={{ height: 26, marginBottom: 3 }}/>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Advanced Tier Services Partner</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {(laurenValueProposition || []).map((col) => (
              <div key={col.col}>
                {col.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 5 }}>
                    <CheckIcon color={O} size={10}/>
                    <span style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {data.footer && <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--card-border)', textAlign: 'center', fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>{data.footer}</div>}
        </div>

        {/* 6. Strengths & Weaknesses */}
        <div style={card}>
          <SH num="6." title="Strengths &amp; Weaknesses" color={SEC}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#2dca6e', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 5, textAlign: 'center', padding: '2px 4px', background: 'rgba(45,202,110,.12)', borderRadius: 4 }}>Strengths</div>
              {(strengths || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 4 }}>
                  <CheckIcon color="#2dca6e" size={10}/>
                  <span style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.4 }}>{s}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#ff5a5a', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 5, textAlign: 'center', padding: '2px 4px', background: 'rgba(255,90,90,.12)', borderRadius: 4 }}>Weaknesses</div>
              {(weaknesses || []).map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 4 }}>
                  <XIcon color="#ff5a5a" size={10}/>
                  <span style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.4 }}>{w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Competitive Snapshot */}
        <div style={card}>
          <SH num="7." title="Competitive Snapshot" color={SEC}/>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Competitor','Overview','Strengths','Weaknesses','Best Fit'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {(competitorSummary || []).map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ ...TD, whiteSpace: 'nowrap' }}><img src={c.logo} alt={c.name} style={{ height: 17, maxWidth: 60, objectFit: 'contain', display: 'block' }}/></td>
                  <td style={TDM}>{c.overview}</td>
                  <td style={TD}>{c.strengths.map((s, j) => <div key={j} style={{ marginBottom: 2, display: 'flex', gap: 3 }}><span style={{ color: '#2dca6e', fontWeight: 800 }}>+</span>{s}</div>)}</td>
                  <td style={TD}>{c.weaknesses.map((w, j) => <div key={j} style={{ marginBottom: 2, display: 'flex', gap: 3 }}><span style={{ color: '#ff5a5a', fontWeight: 800 }}>−</span>{w}</div>)}</td>
                  <td style={TDM}>{c.bestFit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ ROW C: Feature Matrix + Industry Solutions ════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 9 }}>

        {/* 8. Feature Matrix */}
        <div style={card}>
          <SH num="8." title="Feature Comparison Matrix" color={SEC}/>
          <div style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
            {[['#2dca6e','Better'],['#f5c518','Similar'],['#ff5a5a','Weaker']].map(([c, lbl]) => (
              <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4, color: c, fontSize: 10.5, fontWeight: 700 }}>
                <svg viewBox="0 0 8 8" style={{ width: 8, height: 8 }}><circle cx="4" cy="4" r="4" fill={c}/></svg>{lbl}
              </span>
            ))}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left' }}>Capability</th>
                <th style={{ ...TH, textAlign: 'center', color: O }}>AWS</th>
                <th style={{ ...TH, textAlign: 'center', color: '#0078d4' }}>Azure</th>
                <th style={{ ...TH, textAlign: 'center', color: '#4285f4' }}>GCloud</th>
              </tr>
            </thead>
            <tbody>
              {fmRows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '4px 5px', fontSize: 11.5, color: 'var(--text)' }}>{r.feature}</td>
                  {['product','comp1','comp2'].map((k) => <td key={k} style={{ textAlign: 'center', padding: '4px 3px' }}><RatingDot rating={r[k]}/></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 9. Industry Solutions */}
        <div style={card}>
          <SH num="9." title="Industry Solutions &amp; Customer Outcomes" color={SEC}/>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Industry','Challenge','AWS Solution','Lauren Services','Business Outcome'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {(industrySolutions || []).map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '5px 6px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ color: O }}>{IND_ICONS[s.icon] || IND_ICONS.factory}</div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{s.industry}</span>
                    </div>
                  </td>
                  <td style={TDM}>{s.challenge}</td>
                  <td style={{ ...TD, color: 'var(--blue)' }}>{s.awsSolution}</td>
                  <td style={TD}>{s.laurenServices}</td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'top' }}><span style={{ fontSize: 11.5, fontWeight: 700, color: '#2dca6e' }}>{s.outcome}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ ROW D: Customers + Business Value ════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>

        {/* 10. Trusted Customers */}
        <div style={card}>
          <SH num="10." title="Trusted By Thousands of Customers" color={SEC}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
            {(keyCustomers || []).map((c, i) => <LogoTile key={i} name={c.name} logo={c.logo} color={c.color}/>)}
          </div>
        </div>

        {/* 11. Business Value */}
        <div style={card}>
          <SH num="11." title="Business Value Delivered" color={SEC}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
            {(businessValue || []).map((bv, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 6 }}>
                <div style={{ color: bv.color, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{BV_ICONS[bv.icon] || BV_ICONS.cost}</div>
                <div style={{ fontSize: 19, fontWeight: 900, color: bv.color, lineHeight: 1 }}>{bv.metric}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.3 }}>{bv.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ROW E: Objection + AI Coach + Win/Loss + Exec Messaging ══════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 9 }}>

        {/* 12. Objection Handling */}
        <div style={card}>
          <SH num="12." title="Objection Handling" color={SEC}/>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ ...TH, width: '36%' }}>Objection</th><th style={TH}>Our Response</th></tr></thead>
            <tbody>
              {(objectionHandling || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '5px', verticalAlign: 'top', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.45 }}>{item.objection}</td>
                  <td style={{ padding: '5px', verticalAlign: 'top', fontSize: 11, color: 'var(--text)', lineHeight: 1.45 }}>{item.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 13. AI Sales Coach */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
            <span style={{ background: 'var(--blue)', color: '#fff', padding: '2px 5px', borderRadius: 3, fontSize: 8.5, fontWeight: 800 }}>AI</span>
            <span style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: .6 }}>13. AI Sales Coach</span>
          </div>
          <div style={{ background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 5, padding: '6px 8px', marginBottom: 7 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, marginBottom: 3 }}>Customer Profile</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{aiCoach?.customerProfile}</div>
          </div>
          {[
            { label: 'Likely Pain Points',        items: aiCoach?.painPoints,           color: 'var(--orange)' },
            { label: 'Recommended AWS Services',  items: aiCoach?.recommendedServices,  color: 'var(--blue)'   },
            { label: 'Lauren Services',           items: aiCoach?.laurenServices,        color: O               },
            { label: 'Key Value Points',          items: aiCoach?.kvps,                  color: '#2dca6e'       },
          ].map((section) => section.items && (
            <div key={section.label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, marginBottom: 4 }}>{section.label}</div>
              {section.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: 4, marginBottom: 3, fontSize: 11.5, color: 'var(--text)', alignItems: 'flex-start' }}>
                  <CheckIcon color={section.color} size={10}/>{item}
                </div>
              ))}
            </div>
          ))}
          {aiCoach?.customerSays && (
            <div style={{ background: 'rgba(74,158,255,.08)', border: '1px solid rgba(74,158,255,.25)', borderRadius: 5, padding: '6px 8px', marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, marginBottom: 3 }}>Customer Says</div>
              <div style={{ fontSize: 11.5, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.45 }}>{aiCoach.customerSays}</div>
            </div>
          )}
          {aiCoach?.suggestedResponse && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, marginBottom: 3 }}>Suggested Response</div>
              <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.45 }}>{aiCoach.suggestedResponse}</div>
            </div>
          )}
          {aiCoach?.recommendedCaseStudy && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, marginBottom: 3 }}>Recommended Case Study</div>
              <div style={{ fontSize: 11.5, color: '#2dca6e', fontWeight: 700, lineHeight: 1.45 }}>{aiCoach.recommendedCaseStudy}</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingTop: 6, borderTop: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Win Probability:</span>
            <span style={{ background: '#2dca6e', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 800 }}>{aiCoach?.winProbability || 'High'}</span>
          </div>
        </div>

        {/* 14. Win / Loss */}
        <div style={card}>
          <SH num="14." title="Win / Loss Intelligence" color={SEC}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 9 }}>
            {[
              { label: 'Total Opps', val: winLoss?.total,         color: 'var(--text)' },
              { label: 'Won',        val: `${winLoss?.won}`,      pct: `${winLoss?.winRate}%`,          color: '#2dca6e' },
              { label: 'Lost',       val: `${winLoss?.lost}`,     pct: `${100-(winLoss?.winRate||0)}%`, color: '#ff5a5a' },
              { label: 'Win Rate',   val: `${winLoss?.winRate}%`, color: 'var(--blue)' },
            ].map((k, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '6px 3px', background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 5 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
                {k.pct && <div style={{ fontSize: 9.5, color: k.color, fontWeight: 700 }}>{k.pct}</div>}
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>By Competitor</div>
              <WinPie competitors={winLoss?.competitors || []}/>
              <div style={{ marginTop: 4 }}>
                {(winLoss?.competitors || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, marginBottom: 2 }}>
                    <svg viewBox="0 0 7 7" style={{ width: 7, height: 7, flexShrink: 0 }}><circle cx="3.5" cy="3.5" r="3.5" fill={c.color}/></svg>
                    <span style={{ color: 'var(--text)' }}>{c.label}</span>
                    <span style={{ fontWeight: 700, color: c.color }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9.5, color: '#2dca6e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Top Reasons Won</div>
                {topWinReasons.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 4, fontSize: 11, marginBottom: 3, alignItems: 'flex-start', color: 'var(--text)' }}>
                    <CheckIcon color="#2dca6e" size={10}/>{r}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: '#ff5a5a', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Top Reasons Lost</div>
                {topLossReasons.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 4, fontSize: 11, marginBottom: 3, alignItems: 'flex-start', color: 'var(--text)' }}>
                    <XIcon color="#ff5a5a" size={10}/>{r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 15. Executive Messaging */}
        <div style={card}>
          <SH num="15." title="Executive Messaging" color={SEC}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(executiveMessaging || []).map((em, i) => (
              <div key={i} style={{ padding: '6px 8px', background: 'var(--card-bg2)', border: `1px solid ${em.color}44`, borderLeft: `3px solid ${em.color}`, borderRadius: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: em.color, marginBottom: 3, letterSpacing: .3 }}>{em.role}</div>
                {em.points.map((p, j) => (
                  <div key={j} style={{ display: 'flex', gap: 4, fontSize: 11.5, color: 'var(--text)', marginBottom: 3, alignItems: 'flex-start' }}>
                    <CheckIcon color={em.color} size={10}/>{p}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ROW F: TCO Comparison ═════════════════════════════════════════ */}
      {tcoData && (
        <div style={card}>
          <SH num="16." title="TCO Comparison (3-Year Total Cost of Ownership)" color={SEC}/>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, textAlign: 'left' }}>Component</th>
                  <th style={{ ...TH, textAlign: 'right', color: O }}>{tcoData.labels?.product || 'AWS'}</th>
                  <th style={{ ...TH, textAlign: 'right', color: '#0078d4' }}>{tcoData.labels?.comp1 || 'Azure'}</th>
                  <th style={{ ...TH, textAlign: 'right', color: '#4285f4' }}>{tcoData.labels?.comp2 || 'Google Cloud'}</th>
                </tr>
              </thead>
              <tbody>
                {(tcoData.rows || []).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '5px 6px', fontSize: 11.5, color: 'var(--text)', fontWeight: 600 }}>{row.component}</td>
                    <td style={{ padding: '5px 6px', fontSize: 11.5, color: O, fontWeight: 700, textAlign: 'right' }}>{row.product}</td>
                    <td style={{ padding: '5px 6px', fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right' }}>{row.comp1}</td>
                    <td style={{ padding: '5px 6px', fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right' }}>{row.comp2}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--card-border)', background: 'var(--card-bg2)' }}>
                  <td style={{ padding: '6px', fontSize: 12, fontWeight: 900, color: 'var(--text)' }}>Total (3 yr)</td>
                  <td style={{ padding: '6px', fontSize: 13, fontWeight: 900, color: O, textAlign: 'right' }}>{tcoData.totals?.product}</td>
                  <td style={{ padding: '6px', fontSize: 13, fontWeight: 900, color: 'var(--text-muted)', textAlign: 'right' }}>{tcoData.totals?.comp1}</td>
                  <td style={{ padding: '6px', fontSize: 13, fontWeight: 900, color: 'var(--text-muted)', textAlign: 'right' }}>{tcoData.totals?.comp2}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,.1)', borderRadius: 7, padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,.95)' }}>Why Lauren Group for AWS?</span>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'rgba(255,255,255,.75)', flexWrap: 'wrap', alignItems: 'center' }}>
          {['AWS Advanced Tier Services Partner','100+ AWS Certified Professionals','Proven Frameworks & Accelerators','24x7 Managed Services & Support','32+ Years | 1000+ Customers'].map((t) => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg viewBox="0 0 6 6" style={{ width: 5, height: 5 }}><circle cx="3" cy="3" r="3" fill={O}/></svg>{t}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
