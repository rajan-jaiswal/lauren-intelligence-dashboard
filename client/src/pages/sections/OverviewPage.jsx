import React from 'react';

function parseMoney(str) {
  return parseInt((str || '0').replace(/[^0-9]/g, ''), 10) || 0;
}

const DOT_COLOR = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };

const MetaIcons = {
  category:   <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/></svg>,
  deployment: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/></svg>,
  users:      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6zM5.216 14A2.238 2.238 0 015 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 005 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/><path d="M4.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>,
  launch:     <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/></svg>,
  position:   <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-3 6.5a3 3 0 116 0 3 3 0 01-6 0z"/></svg>,
  gartner:    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 3.5a.5.5 0 010-1h11a.5.5 0 010 1h-11zm0 4a.5.5 0 010-1h11a.5.5 0 010 1h-11zm0 4a.5.5 0 010-1h11a.5.5 0 010 1h-11z"/></svg>,
};

const FeatureIcons = {
  'Automatic Discovery':          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 1011 5z" clipRule="evenodd"/></svg>,
  'AI Root Cause Analysis':        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>,
  'Trace Analytics':               <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  'Kubernetes Visibility':         <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  'Real-time Monitoring':          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  'Smart Alert Engine':            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>,
  'Hybrid Monitoring':             <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>,
  'OpenShift Support':             <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
  'Guaranteed Message Delivery':   <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>,
  'Multi-cloud Connectivity':      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/></svg>,
  'High Throughput':               <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/></svg>,
  'Enterprise Security':           <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  'Exactly-once Delivery':         <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>,
  'Kubernetes Native':             <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14A6 6 0 1110 4a6 6 0 010 12z"/></svg>,
  'Queue Management':              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"/></svg>,
  'Monitoring & Alerts':           <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>,
  'B2B Partner Integration':       <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>,
  'Order Management':              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/><path d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>,
  'Supply Chain Visibility':       <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>,
  'EDI & API Connectivity':        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
  'AI-Driven Insights':            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd"/></svg>,
  'Inventory Optimization':        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  'Fulfillment Automation':        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3z"/></svg>,
  'Real-time Analytics':           <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  'AI-driven Resource Automation': <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
  'Cloud Cost Optimisation':       <svg viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>,
  'Performance Assurance':         <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  'Multi-cloud Support':           <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/></svg>,
  'Kubernetes Rightsizing':        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14A6 6 0 1110 4a6 6 0 010 12z"/></svg>,
  'FinOps Analytics':              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  'Continuous Automation':         <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>,
  'Workload Placement':            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"/></svg>,
};

function getFeatureIcon(name) {
  return FeatureIcons[name] || (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
    </svg>
  );
}

function InitialsBadge({ name, color, size = 40, fontSize = 13, radius = 8 }) {
  const words = (name || '').split(' ').filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (name || '--').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 900, color, letterSpacing: 0.5,
    }}>
      {initials}
    </div>
  );
}

function TcoBar({ label, value, max, color, amount }) {
  const pct = Math.min(100, (value / (max || 800)) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{ width: 70, textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, lineHeight: 1.2 }}>{label}</div>
      <div style={{ flex: 1, height: 17, background: 'var(--tco-track)', borderRadius: 4, overflow: 'hidden', minWidth: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s ease' }} />
      </div>
      <div style={{ width: 54, fontSize: 12, fontWeight: 800, color, flexShrink: 0, textAlign: 'right' }}>{amount}</div>
    </div>
  );
}

function WinDonut({ rate }) {
  const r = 24, cx = 30, cy = 30, sw = 6;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--card-border)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--blue)" strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{rate}%</span>
      </div>
    </div>
  );
}

function WinPie({ competitors }) {
  const r = 30, cx = 38, cy = 38, sw = 12;
  const total = (competitors || []).reduce((s, c) => s + c.wins, 0) || 1;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = (competitors || []).map((c) => {
    const pct = c.wins / total;
    const seg = { ...c, dashLen: pct * circ, dashOffset: offset };
    offset += pct * circ;
    return seg;
  });
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--card-border)" strokeWidth={sw} />
      {segments.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth={sw}
          strokeDasharray={`${s.dashLen} ${circ}`}
          strokeDashoffset={-s.dashOffset + circ * 0.25}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ color: 'var(--blue)', width: 26, height: 26 }}>
      <circle cx="14" cy="14" r="12" strokeDasharray="4 2"/>
      <circle cx="14" cy="14" r="5"/>
      <line x1="14" y1="2" x2="14" y2="8"/>
      <line x1="14" y1="20" x2="14" y2="26"/>
      <line x1="2" y1="14" x2="8" y2="14"/>
      <line x1="20" y1="14" x2="26" y2="14"/>
    </svg>
  );
}

function CaseStudyIcon({ type }) {
  const t = (type || '').toLowerCase();
  if (t.includes('bank') || t.includes('financ'))
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 5H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM6 13a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd"/></svg>;
  if (t.includes('telecom') || t.includes('telco'))
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd"/></svg>;
  if (t.includes('energy') || t.includes('util'))
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>;
  if (t.includes('health'))
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>;
  return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>;
}

function CheckIcon({ color = 'var(--green)', size = 13 }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: size, height: size, color, flexShrink: 0, marginTop: 2 }}>
      <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
    </svg>
  );
}

function XIcon({ size = 12 }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: size, height: size, color: 'var(--red)', flexShrink: 0, marginTop: 2 }}>
      <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
    </svg>
  );
}

function SectionLabel({ children, color = 'var(--blue)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 11 }}>
      <div style={{ width: 3, height: 13, background: color, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9 }}>
        {children}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OverviewPage({ data }) {
  if (!data) return null;
  const {
    overview, keyFeatures, discoveryQuestions, recommendedResponses,
    strengths, weaknesses, caseStudies, keyCustomers,
    competitorSummary, featureMatrix, tcoData, winLoss, aiCoach, objectionHandling,
  } = data;

  const fmLabels  = featureMatrix?.labels  || { product: data.product, comp1: 'Comp 1', comp2: 'Comp 2' };
  const fmRows    = featureMatrix?.rows    || [];
  const tcoMax    = tcoData?.maxValue      || 800;
  const tcoLabels = tcoData?.labels        || fmLabels;

  function caseColor(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('bank') || t.includes('financ')) return 'var(--blue)';
    if (t.includes('telecom') || t.includes('telco')) return 'var(--purple)';
    if (t.includes('energy') || t.includes('util')) return 'var(--orange)';
    if (t.includes('health')) return 'var(--green)';
    return 'var(--blue)';
  }

  const winRate = winLoss?.winRate || 0;
  const tcoAdvantage = (() => {
    const prod = parseMoney(tcoData?.totals?.product);
    const c1   = parseMoney(tcoData?.totals?.comp1);
    const c2   = parseMoney(tcoData?.totals?.comp2);
    const maxComp = Math.max(c1, c2);
    if (!prod || !maxComp) return null;
    const saving = maxComp - prod;
    if (saving <= 0) return null;
    return saving >= 1000 ? `$${Math.round(saving / 1000)}K` : `$${saving}`;
  })();

  // card style shorthand
  const card = { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '14px 15px' };
  const subCard = { background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 7 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Hero bar ── */}
      <div style={{ ...card, padding: '13px 17px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: 11, flexShrink: 0, background: 'var(--blue-lt)', border: '2px solid var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ProductIcon />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: 0.4, lineHeight: 1.2, marginBottom: 5 }}>
              {(overview?.name || data.product || '').toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {overview?.category && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'var(--blue-lt)', color: 'var(--blue)', border: '1px solid var(--blue)' }}>{overview.category}</span>}
              {overview?.deployment && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'var(--purple-lt)', color: 'var(--purple)', border: '1px solid var(--purple)' }}>{overview.deployment}</span>}
              {overview?.marketPosition && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'var(--green-lt)', color: 'var(--green)', border: '1px solid var(--green)' }}>{overview.marketPosition}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9, flexShrink: 0, flexWrap: 'wrap' }}>
          {[
            { label: 'Win Rate',            val: winRate ? `${winRate}%` : '—',              color: 'var(--blue)',   bg: 'var(--blue-lt)' },
            { label: 'Customers',           val: (keyCustomers||[]).length || '—',            color: 'var(--green)',  bg: 'var(--green-lt)' },
            { label: 'TCO Advantage',       val: tcoAdvantage || '—',                         color: 'var(--orange)', bg: 'var(--orange-lt)' },
            { label: 'Competitors Tracked', val: (competitorSummary||[]).length || '—',       color: 'var(--purple)', bg: 'var(--purple-lt)' },
          ].map((k) => (
            <div key={k.label} style={{ textAlign: 'center', padding: '8px 15px', borderRadius: 8, background: k.bg, border: `1px solid ${k.color}33`, minWidth: 76 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 3 }}>{k.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main 2-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(auto, 340px) 1fr', gap: 10, alignItems: 'start' }}>

        {/* ════ LEFT COLUMN ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Product Overview */}
          <div style={card}>
            <SectionLabel>Product Overview</SectionLabel>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 11, paddingBottom: 11, borderBottom: '1px solid var(--card-border)' }}>
              {overview?.description}
            </p>
            {[
              { icon: MetaIcons.category,   label: 'Category',        val: overview?.category },
              { icon: MetaIcons.deployment, label: 'Deployment',      val: overview?.deployment },
              { icon: MetaIcons.users,      label: 'Target Users',    val: overview?.targetUsers },
              { icon: MetaIcons.launch,     label: 'Launched',        val: overview?.productLaunch },
              { icon: MetaIcons.position,   label: 'Market Position', val: overview?.marketPosition },
              { icon: MetaIcons.gartner,    label: 'Gartner MQ',      val: overview?.gartnerMQ },
            ].filter(r => r.val).map((r) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--blue)', marginTop: 1 }}>{r.icon}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, minWidth: 94, flexShrink: 0 }}>{r.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 700, flex: 1 }}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Strengths & Weaknesses */}
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <SectionLabel color="var(--green)">Strengths</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(strengths || []).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <CheckIcon color="var(--green)" size={13} />
                      <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel color="var(--red)">Weaknesses</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(weaknesses || []).map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <XIcon size={13} />
                      <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Customers */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
              <SectionLabel>Key Customers</SectionLabel>
              <span style={{ fontSize: 11, color: 'var(--blue)', cursor: 'pointer', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--blue-lt)', marginTop: -11 }}>View all</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((keyCustomers||[]).length, 3)}, 1fr)`, gap: 8 }}>
              {(keyCustomers || []).map((c, i) => (
                <div key={i} style={{ ...subCard, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 7px', textAlign: 'center' }}>
                  <InitialsBadge name={c.name} color={c.color || 'var(--blue)'} size={34} fontSize={12} radius={7} />
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>{c.name}</div>
                  {c.industry && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.2 }}>{c.industry}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Summary */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
              <SectionLabel color="var(--red)">Competitor Summary</SectionLabel>
              <span style={{ fontSize: 11, color: 'var(--blue)', cursor: 'pointer', fontWeight: 700, padding: '2px 8px', background: 'var(--blue-lt)', borderRadius: 4, whiteSpace: 'nowrap', marginTop: -11 }}>Full analysis</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {(competitorSummary || []).map((c, i) => (
                <div key={i} style={{ ...subCard, borderLeft: `3px solid ${c.color}`, padding: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <InitialsBadge name={c.name} color={c.color} size={30} fontSize={11} radius={6} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: c.color, lineHeight: 1.2 }}>{c.name}</div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 5, background: 'var(--blue-lt)', color: 'var(--blue)' }}>{c.marketPosition}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 8 }}>{c.overview}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Strengths</div>
                      {(c.strengths || []).map((s, j) => (
                        <div key={j} style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 3, display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--green)', fontWeight: 800, flexShrink: 0 }}>+</span><span>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Weaknesses</div>
                      {(c.weaknesses || []).map((w, j) => (
                        <div key={j} style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 3, display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--red)', fontWeight: 800, flexShrink: 0 }}>−</span><span>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Objection Handling */}
          <div style={card}>
            <SectionLabel color="var(--orange)">Objection Handling</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {(objectionHandling || []).map((item, i) => (
                <div key={i} style={{ ...subCard, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 11px', background: 'var(--orange-lt)', borderLeft: '3px solid var(--orange)' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Customer Objection</div>
                    <div style={{ fontSize: 12.5, fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.55 }}>{item.objection}</div>
                  </div>
                  <div style={{ padding: '8px 11px' }}>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <CheckIcon color="var(--green)" size={13} />
                      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{item.response}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        {/* ════ END LEFT COLUMN ════ */}

        {/* ════ RIGHT COLUMN ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Key Features — auto-fill so columns expand with content */}
          <div style={card}>
            <SectionLabel>Key Features</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {(keyFeatures || []).map((f, i) => (
                <div key={i} style={{
                  ...subCard,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '11px 9px', textAlign: 'center', cursor: 'default',
                  transition: 'border-color .15s, background .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-lt)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.background = 'var(--card-bg2)'; }}
                >
                  <div style={{ color: 'var(--blue)', width: 20, height: 20 }}>{getFeatureIcon(f.name)}</div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{f.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discovery Questions + Recommended Responses — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'start' }}>
            <div style={card}>
              <SectionLabel color="var(--blue)">Discovery Questions</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(discoveryQuestions || []).map((q, i) => {
                  const text = typeof q === 'string' ? q : (q?.question || q?.text || JSON.stringify(q));
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ width: 19, height: 19, borderRadius: '50%', flexShrink: 0, background: 'var(--blue-lt)', border: '1px solid var(--blue)', color: 'var(--blue)', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55 }}>{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={card}>
              <SectionLabel color="var(--green)">Recommended Responses</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(recommendedResponses || []).map((r, i) => {
                  const text = typeof r === 'string' ? r : (r?.answer || r?.response || r?.text || JSON.stringify(r));
                  return (
                    <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <CheckIcon color="var(--green)" size={13} />
                      <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55 }}>{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Case Studies — auto-fill columns based on count */}
          <div style={card}>
            <SectionLabel>Relevant Case Studies</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((caseStudies||[]).length, 3)}, 1fr)`, gap: 9 }}>
              {(caseStudies || []).map((c, i) => {
                const col = caseColor(c.type || c.category);
                return (
                  <div key={i} style={{ ...subCard, borderTop: `3px solid ${col}`, padding: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ color: col, flexShrink: 0 }}><CaseStudyIcon type={c.type || c.category} /></div>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: col, lineHeight: 1.2 }}>{c.customer}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{c.type || c.category}</div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Challenge</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.challenge}</div>
                    </div>
                    <div style={{ background: `${col}12`, borderRadius: 5, padding: '7px 9px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: col, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Result</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.45 }}>{c.result}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature Matrix + TCO side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 10, alignItems: 'start' }}>

            {/* Feature Matrix */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                <SectionLabel color="var(--purple)">Feature Comparison Matrix</SectionLabel>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, marginTop: -11 }}>
                  {[['var(--green)', 'Better'], ['var(--yellow)', 'Similar'], ['var(--red)', 'Weaker']].map(([col, lbl]) => (
                    <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontWeight: 600 }}>
                      <svg viewBox="0 0 8 8" style={{ width: 8, height: 8 }}><circle cx="4" cy="4" r="4" fill={col}/></svg>
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
              <div className="table-scroll-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th style={{ width: '44%' }}>Feature</th>
                      <th style={{ textAlign: 'center', color: 'var(--blue)', fontWeight: 800 }}>{fmLabels.product}</th>
                      <th style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{fmLabels.comp1}</th>
                      <th style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{fmLabels.comp2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fmRows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, fontSize: 12 }}>{r.feature}</td>
                        {['product', 'comp1', 'comp2'].map((k) => (
                          <td key={k} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <svg viewBox="0 0 12 12" style={{ width: 11, height: 11, display: 'inline-block' }}>
                              <circle cx="6" cy="6" r="6" fill={DOT_COLOR[r[k]] || 'var(--card-border)'}/>
                            </svg>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TCO */}
            <div style={card}>
              <SectionLabel color="var(--green)">3-Year TCO Comparison</SectionLabel>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Total TCO (3 Years)</div>
              {[
                { label: tcoLabels.comp1,   val: parseMoney(tcoData?.totals?.comp1),   amount: tcoData?.totals?.comp1,   color: 'var(--purple)' },
                { label: tcoLabels.comp2,   val: parseMoney(tcoData?.totals?.comp2),   amount: tcoData?.totals?.comp2,   color: 'var(--blue)' },
                { label: tcoLabels.product, val: parseMoney(tcoData?.totals?.product), amount: tcoData?.totals?.product, color: 'var(--green)' },
              ].map((b, i) => (
                <TcoBar key={i} label={b.label} value={b.val} max={tcoMax} color={b.color} amount={b.amount} />
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 3, marginBottom: 3 }}>
                <span>$0</span><span>$200K</span><span>$400K</span><span>$600K</span><span>$800K</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 11, fontStyle: 'italic' }}>↓ Lower is Better</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>TCO Breakdown (3 Years)</div>
              <div className="table-scroll-wrap">
                <table className="dash-table" style={{ fontSize: 11.5 }}>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th style={{ textAlign: 'right', color: 'var(--green)' }}>{tcoLabels.product}</th>
                      <th style={{ textAlign: 'right', color: 'var(--purple)' }}>{tcoLabels.comp1}</th>
                      <th style={{ textAlign: 'right', color: 'var(--blue)' }}>{tcoLabels.comp2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tcoData?.rows || []).map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.component}</td>
                        <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 700 }}>{r.product}</td>
                        <td style={{ textAlign: 'right', color: 'var(--purple)', fontWeight: 600 }}>{r.comp1}</td>
                        <td style={{ textAlign: 'right', color: 'var(--blue)', fontWeight: 600 }}>{r.comp2}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ fontWeight: 800, fontSize: 11.5, borderTop: '2px solid var(--card-border)', paddingTop: 7 }}>TOTAL TCO</td>
                      <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 900, borderTop: '2px solid var(--card-border)', fontSize: 12 }}>{tcoData?.totals?.product}</td>
                      <td style={{ textAlign: 'right', color: 'var(--purple)', fontWeight: 800, borderTop: '2px solid var(--card-border)', fontSize: 12 }}>{tcoData?.totals?.comp1}</td>
                      <td style={{ textAlign: 'right', color: 'var(--blue)', fontWeight: 800, borderTop: '2px solid var(--card-border)', fontSize: 12 }}>{tcoData?.totals?.comp2}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>

          {/* AI Sales Coach + Win/Loss side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'start' }}>

            {/* AI Sales Coach */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                <span style={{ background: 'var(--blue)', color: '#fff', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 900, letterSpacing: 0.5 }}>AI</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 3, height: 13, background: 'var(--blue)', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9 }}>AI Sales Coach</span>
                </div>
              </div>
              <div style={{ ...subCard, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid var(--blue)' }}>
                <div style={{ fontSize: 10, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4, fontWeight: 800 }}>Customer says:</div>
                <div style={{ fontSize: 12.5, fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.55 }}>{aiCoach?.customerSays}</div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5, fontWeight: 800 }}>Suggested Response</div>
                <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.65 }}>{aiCoach?.suggestedResponse}</div>
              </div>
              {aiCoach?.recommendedCaseStudy && (
                <div style={{ marginBottom: 10, padding: '8px 10px', background: 'var(--yellow-lt)', borderRadius: 6, border: '1px solid var(--yellow)' }}>
                  <div style={{ fontSize: 10, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4, fontWeight: 800 }}>Recommended Case Study</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.5 }}>{aiCoach.recommendedCaseStudy}</div>
                </div>
              )}
              {aiCoach?.kvps && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 7, fontWeight: 800 }}>Key Value Points</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {aiCoach.kvps.map((kv, i) => (
                      <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 12, color: 'var(--text)' }}>
                        <CheckIcon color="var(--green)" size={13} />
                        <span style={{ lineHeight: 1.5 }}>{kv}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {aiCoach?.winProbability && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>Win Probability:</span>
                  <span style={{ background: aiCoach.winProbability === 'HIGH' ? 'var(--green)' : aiCoach.winProbability === 'MEDIUM' ? 'var(--orange)' : 'var(--red)', color: '#fff', padding: '3px 11px', borderRadius: 5, fontSize: 11.5, fontWeight: 900, letterSpacing: 0.5 }}>
                    {aiCoach.winProbability}
                  </span>
                </div>
              )}
            </div>

            {/* Win / Loss */}
            <div style={card}>
              <SectionLabel color="var(--blue)">Win / Loss — Last 12 Months</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 13 }}>
                  {[
                    { label: 'Total Opps', num: winLoss?.total,             color: 'var(--text)',  bg: 'var(--card-bg2)' },
                    { label: 'Won',        num: winLoss?.won,               color: 'var(--green)', bg: 'var(--green-lt)' },
                    { label: 'Lost',       num: winLoss?.lost,              color: 'var(--red)',   bg: 'var(--red-lt)' },
                    { label: 'Win Rate',   num: `${winLoss?.winRate||0}%`,  color: 'var(--blue)',  bg: 'var(--blue-lt)' },
                  ].map((k, i) => (
                    <div key={i} style={{ background: k.bg, border: `1px solid ${k.color}33`, borderRadius: 7, padding: '9px 5px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.num}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 9 }}>Wins vs Competitors</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <WinPie competitors={winLoss?.competitors || []} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(winLoss?.competitors || []).map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}>
                            <svg viewBox="0 0 8 8" style={{ width: 8, height: 8, flexShrink: 0 }}><circle cx="4" cy="4" r="4" fill={c.color}/></svg>
                            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{c.label}</span>
                            <span style={{ fontWeight: 800, color: c.color }}>{c.wins}</span>
                            <span style={{ color: 'var(--text-muted)' }}>({c.pct}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 9 }}>Top Winning Messages</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(winLoss?.topMessages || []).map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, color: 'var(--text)' }}>
                          <CheckIcon color="var(--green)" size={13} />
                          <span style={{ lineHeight: 1.5 }}>{m}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--card-border)' }}>
                      <WinDonut rate={winLoss?.winRate || 0} />
                      <div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>Overall Win Rate</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--blue)', lineHeight: 1 }}>{winLoss?.winRate}%</div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

          </div>
          {/* ════ END RIGHT COLUMN ════ */}
        </div>

      </div>
    </div>
  );
}
