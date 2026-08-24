import React from 'react';

// ── helpers ──────────────────────────────────────────────────────────────
function parseMoney(str) {
  return parseInt((str || '0').replace(/[^0-9]/g, ''), 10) || 0;
}

const DOT_COLOR = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };

// ── SVG mini icons for product meta ──────────────────────────────────────
const MetaIcons = {
  category:   <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/></svg>,
  deployment: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/></svg>,
  users:      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6zM5.216 14A2.238 2.238 0 015 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 005 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/><path d="M4.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>,
  launch:     <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/></svg>,
  position:   <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-3 6.5a3 3 0 116 0 3 3 0 01-6 0z"/></svg>,
};

// ── Feature SVG icons ─────────────────────────────────────────────────────
const FeatureIcons = {
  'Automatic Discovery':          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 1011 5z" clipRule="evenodd"/></svg>,
  'AI Root Cause Analysis':        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>,
  'Trace Analytics':               <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  'Kubernetes Visibility':         <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  'Real-time Monitoring':          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  'Smart Alert Engine':            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>,
  'Hybrid Monitoring':             <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>,
  'OpenShift Support':             <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
  // IBM MQ
  'Guaranteed Message Delivery':   <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>,
  'Multi-cloud Connectivity':      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/></svg>,
  'High Throughput':               <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/></svg>,
  'Enterprise Security':           <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  'Exactly-once Delivery':         <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>,
  'Kubernetes Native':             <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14A6 6 0 1110 4a6 6 0 010 12z"/></svg>,
  'Queue Management':              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"/></svg>,
  'Monitoring & Alerts':           <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>,
  // Sterling
  'B2B Partner Integration':       <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>,
  'Order Management':              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/><path d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>,
  'Supply Chain Visibility':       <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>,
  'EDI & API Connectivity':        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
  'AI-Driven Insights':            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd"/></svg>,
  'Inventory Optimization':        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  'Fulfillment Automation':        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3z"/></svg>,
  'Real-time Analytics':           <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  // Turbonomic
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

// ── Customer initials badge ───────────────────────────────────────────────
function CustomerBadge({ name, color }) {
  const words = (name || '').split(' ').filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (name || '--').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 8, flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 900, color, letterSpacing: .5,
    }}>
      {initials}
    </div>
  );
}

// ── Competitor brand badge ────────────────────────────────────────────────
function CompetitorBadge({ name, color }) {
  const words = (name || '').split(' ').filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (name || '--').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 7, flexShrink: 0,
      background: `${color}20`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 900, color, letterSpacing: .3,
    }}>
      {initials}
    </div>
  );
}

// ── TCO horizontal bar ────────────────────────────────────────────────────
function TcoBar({ label, value, max, color, amount }) {
  const pct = Math.min(100, (value / (max || 800)) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ width: 68, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 18, background: 'var(--tco-track)', borderRadius: 4, overflow: 'hidden', minWidth: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <div style={{ width: 48, fontSize: 11.5, fontWeight: 800, color, flexShrink: 0, textAlign: 'right' }}>{amount}</div>
    </div>
  );
}

// ── Win Rate Donut ────────────────────────────────────────────────────────
function WinDonut({ rate }) {
  const r = 28, cx = 34, cy = 34, sw = 7;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--card-border)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--blue)" strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{rate}%</span>
      </div>
    </div>
  );
}

// ── Win Pie (donut chart for competitors) ────────────────────────────────
function WinPie({ competitors }) {
  const r = 36, cx = 46, cy = 46, sw = 14;
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
    <svg width="92" height="92" viewBox="0 0 92 92" style={{ flexShrink: 0 }}>
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

// ── Product Icon SVG ──────────────────────────────────────────────────────
function ProductIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ color: 'var(--blue)', width: 28, height: 28 }}>
      <circle cx="14" cy="14" r="12" strokeDasharray="4 2"/>
      <circle cx="14" cy="14" r="5"/>
      <line x1="14" y1="2" x2="14" y2="8"/>
      <line x1="14" y1="20" x2="14" y2="26"/>
      <line x1="2" y1="14" x2="8" y2="14"/>
      <line x1="20" y1="14" x2="26" y2="14"/>
    </svg>
  );
}

// ── Case Study icon by type ───────────────────────────────────────────────
function CaseStudyIcon({ type }) {
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
  if (t.includes('health')) {
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 22, height: 22 }}><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>;
  }
  if (t.includes('retail') || t.includes('commerce')) {
    return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 22, height: 22 }}><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/><path d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>;
  }
  return <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 22, height: 22 }}><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>;
}

// ── Check icon SVG ────────────────────────────────────────────────────────
function CheckIcon({ color = 'var(--green)', size = 14 }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: size, height: size, color, flexShrink: 0 }}>
      <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
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

  // Case study type → colour
  function caseColor(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('bank') || t.includes('financ')) return 'var(--blue)';
    if (t.includes('telecom') || t.includes('telco')) return 'var(--purple)';
    if (t.includes('energy') || t.includes('util')) return 'var(--orange)';
    if (t.includes('health')) return 'var(--green)';
    return 'var(--blue)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── ROW 1: Product Overview | Key Features | Discovery + Responses ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 1fr', gap: 12, alignItems: 'start' }}>

        {/* Product Overview */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-title" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>PRODUCT OVERVIEW</div>

          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div className="product-icon-badge"><ProductIcon /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--blue)', letterSpacing: .6, lineHeight: 1.2 }}>
                {(overview?.name || data.product || '').toUpperCase()}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--card-border)' }}>
            {overview?.description}
          </p>

          {[
            { icon: MetaIcons.category,  label: 'Category',        val: overview?.category },
            { icon: MetaIcons.deployment,label: 'Deployment',      val: overview?.deployment },
            { icon: MetaIcons.users,     label: 'Target Users',    val: overview?.targetUsers },
            { icon: MetaIcons.launch,    label: 'Product Launch',  val: overview?.productLaunch },
            { icon: MetaIcons.position,  label: 'Market Position', val: overview?.marketPosition },
          ].map((r) => (
            <div key={r.label} className="meta-row">
              <span className="meta-icon" style={{ color: 'var(--blue)' }}>{r.icon}</span>
              <span className="meta-label">{r.label}</span>
              <span className="meta-value">{r.val}</span>
            </div>
          ))}
        </div>

        {/* Key Features — 2×4 grid */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-title" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>KEY FEATURES</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {(keyFeatures || []).map((f, i) => (
              <div key={i} className="icon-box">
                <div style={{ color: 'var(--blue)' }}>{getFeatureIcon(f.name)}</div>
                <span>{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Discovery Questions + Recommended Responses side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: '100%' }}>
          <div className="card">
            <div className="card-title" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>DISCOVERY QUESTIONS</div>
            {(discoveryQuestions || []).map((q, i) => {
              const text = typeof q === 'string' ? q : (q?.question || q?.text || JSON.stringify(q));
              return (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span className="num-circle">{i + 1}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{text}</span>
                </div>
              );
            })}
          </div>
          <div className="card">
            <div className="card-title green" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>RECOMMENDED RESPONSES</div>
            {(recommendedResponses || []).map((r, i) => {
              const text = typeof r === 'string' ? r : (r?.answer || r?.response || r?.text || JSON.stringify(r));
              return (
                <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 8, alignItems: 'flex-start' }}>
                  <CheckIcon color="var(--green)" size={13} />
                  <span style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Strengths+Weaknesses | Case Studies | Key Customers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 270px', gap: 12, alignItems: 'start' }}>

        {/* Strengths & Weaknesses */}
        <div className="card" style={{ height: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div className="card-title green" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>STRENGTHS</div>
              {(strengths || []).map((s, i) => (
                <div key={i} className="sw-item">
                  <CheckIcon color="var(--green)" size={13} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="card-title red" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>WEAKNESSES</div>
              {(weaknesses || []).map((w, i) => (
                <div key={i} className="sw-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"
                    style={{ width: 13, height: 13, color: 'var(--red)', flexShrink: 0, marginTop: 1 }}>
                    <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
                  </svg>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Relevant Case Studies */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-title" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>RELEVANT CASE STUDIES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {(caseStudies || []).map((c, i) => {
              const col = caseColor(c.type || c.category);
              return (
                <div key={i} style={{
                  background: 'var(--card-bg2)', border: '1px solid var(--card-border)',
                  borderTop: `3px solid ${col}`, borderRadius: 7, padding: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <div style={{ color: col }}><CaseStudyIcon type={c.type || c.category} /></div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: col, textTransform: 'uppercase', letterSpacing: .6 }}>
                        {c.customer}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600 }}>{c.type || c.category}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: .4 }}>Challenge:</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7, lineHeight: 1.45 }}>{c.challenge}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: col, marginBottom: 2, textTransform: 'uppercase', letterSpacing: .4 }}>Result:</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', lineHeight: 1.45 }}>{c.result}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Customers */}
        <div className="card" style={{ height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="card-title" style={{ marginBottom: 0, textTransform: 'uppercase', letterSpacing: 1 }}>KEY CUSTOMERS</div>
            <span style={{ fontSize: 11, color: 'var(--blue)', cursor: 'pointer', fontWeight: 600 }}>View all</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(keyCustomers || []).map((c, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '10px 8px', background: 'var(--card-bg2)', border: '1px solid var(--card-border)',
                borderRadius: 8, textAlign: 'center',
              }}>
                <CustomerBadge name={c.name} color={c.color || 'var(--blue)'} />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{c.name}</div>
                {c.industry && <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{c.industry}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: Competitor Summary | Feature Matrix | TCO ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 340px', gap: 12, alignItems: 'start' }}>

        {/* Competitor Summary */}
        <div className="card" style={{ height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="card-title" style={{ marginBottom: 0, textTransform: 'uppercase', letterSpacing: 1 }}>COMPETITOR SUMMARY</div>
            <span style={{ fontSize: 10, color: 'var(--blue)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>View full analysis</span>
          </div>
          {(competitorSummary || []).map((c, i) => (
            <div key={i} className="comp-summary-card" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="comp-header">
                <CompetitorBadge name={c.name} color={c.color} />
                <span className="comp-name" style={{ color: c.color }}>{c.name}</span>
                <span className="comp-pos">{c.marketPosition}</span>
              </div>
              <div className="comp-overview">{c.overview}</div>
              <div className="comp-cols">
                <div>
                  <div className="col-label" style={{ color: 'var(--green)' }}>Strengths</div>
                  {(c.strengths || []).map((s, j) => (
                    <div key={j} className="col-item">
                      <span style={{ color: 'var(--green)', flexShrink: 0, fontWeight: 700, fontSize: 10 }}>+</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="col-label" style={{ color: 'var(--red)' }}>Weaknesses</div>
                  {(c.weaknesses || []).map((w, j) => (
                    <div key={j} className="col-item">
                      <span style={{ color: 'var(--red)', flexShrink: 0, fontWeight: 700, fontSize: 10 }}>−</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="card" style={{ height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="card-title" style={{ marginBottom: 0, textTransform: 'uppercase', letterSpacing: 1 }}>FEATURE COMPARISON MATRIX</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              {[['var(--green)', 'Better'], ['var(--yellow)', 'Similar'], ['var(--red)', 'Weaker']].map(([col, lbl]) => (
                <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                  <svg viewBox="0 0 8 8" style={{ width: 8, height: 8 }}><circle cx="4" cy="4" r="4" fill={col}/></svg>
                  {lbl}
                </span>
              ))}
            </div>
          </div>
          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Feature</th>
                <th style={{ textAlign: 'center', color: 'var(--blue)' }}>{fmLabels.product}</th>
                <th style={{ textAlign: 'center', color: 'var(--text)' }}>{fmLabels.comp1}</th>
                <th style={{ textAlign: 'center', color: 'var(--text)' }}>{fmLabels.comp2}</th>
              </tr>
            </thead>
            <tbody>
              {fmRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r.feature}</td>
                  {['product', 'comp1', 'comp2'].map((k) => (
                    <td key={k} style={{ textAlign: 'center' }}>
                      <svg viewBox="0 0 10 10" style={{ width: 10, height: 10 }}>
                        <circle cx="5" cy="5" r="5" fill={DOT_COLOR[r[k]]}/>
                      </svg>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TCO Comparison */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-title" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>3-YEAR TOTAL COST OF OWNERSHIP (TCO) COMPARISON</div>

          {/* Bar chart section */}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 7 }}>Total TCO (3 Years)</div>
          {[
            { label: tcoLabels.comp1,   val: parseMoney(tcoData?.totals?.comp1),   amount: tcoData?.totals?.comp1,   color: 'var(--purple)' },
            { label: tcoLabels.comp2,   val: parseMoney(tcoData?.totals?.comp2),   amount: tcoData?.totals?.comp2,   color: 'var(--blue)' },
            { label: tcoLabels.product, val: parseMoney(tcoData?.totals?.product), amount: tcoData?.totals?.product, color: 'var(--green)' },
          ].map((b, i) => (
            <TcoBar key={i} label={b.label} value={b.val} max={tcoMax} color={b.color} amount={b.amount} />
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--text-muted)', marginTop: 3 }}>
            <span>$0</span><span>$200K</span><span>$400K</span><span>$600K</span><span>$800K</span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2, marginBottom: 12, fontStyle: 'italic' }}>Lower is Better</div>

          {/* Breakdown table */}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>TCO Breakdown (3 Years)</div>
          <table className="dash-table" style={{ fontSize: 11 }}>
            <thead>
              <tr>
                <th>Cost Component</th>
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
                <td style={{ fontWeight: 800, fontSize: 10.5, borderTop: '2px solid var(--card-border)', paddingTop: 6 }}>TOTAL TCO</td>
                <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 900, borderTop: '2px solid var(--card-border)', fontSize: 12 }}>{tcoData?.totals?.product}</td>
                <td style={{ textAlign: 'right', color: 'var(--purple)', fontWeight: 800, borderTop: '2px solid var(--card-border)', fontSize: 12 }}>{tcoData?.totals?.comp1}</td>
                <td style={{ textAlign: 'right', color: 'var(--blue)', fontWeight: 800, borderTop: '2px solid var(--card-border)', fontSize: 12 }}>{tcoData?.totals?.comp2}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── ROW 4: Objection Handling | AI Coach | Win/Loss ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'start' }}>

        {/* Objection Handling */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-title" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>OBJECTION HANDLING</div>
          <table className="dash-table" style={{ fontSize: 11.5 }}>
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Customer Objection</th>
                <th>Recommended Response</th>
              </tr>
            </thead>
            <tbody>
              {(objectionHandling || []).map((item, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 11.5, lineHeight: 1.5 }}>{item.objection}</div>
                  </td>
                  <td style={{ fontSize: 11.5, lineHeight: 1.55, color: 'var(--text)' }}>{item.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Sales Coach */}
        <div className="card" style={{ height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
            <span style={{ background: 'var(--blue)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800, letterSpacing: .5 }}>AI</span>
            <div className="card-title" style={{ marginBottom: 0, textTransform: 'uppercase', letterSpacing: 1 }}>AI SALES COACH (INSIGHTS)</div>
          </div>

          {/* Customer quote */}
          <div style={{ background: 'var(--card-bg2)', borderRadius: 7, padding: '9px 12px', marginBottom: 10, border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4, fontWeight: 700 }}>Customer says:</div>
            <div style={{ fontSize: 12.5, fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.5 }}>{aiCoach?.customerSays}</div>
          </div>

          {/* Suggested response */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 5, fontWeight: 700 }}>Suggested Response:</div>
            <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.6 }}>{aiCoach?.suggestedResponse}</div>
          </div>

          {/* Recommended case study */}
          {aiCoach?.recommendedCaseStudy && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9.5, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 5, fontWeight: 700 }}>Recommended Case Study:</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.5 }}>{aiCoach.recommendedCaseStudy}</div>
            </div>
          )}

          {/* Key value points */}
          {aiCoach?.kvps && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 7, fontWeight: 700 }}>Key Value Points to Emphasize</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {aiCoach.kvps.map((kv, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: 'var(--text)' }}>
                    <CheckIcon color="var(--green)" size={12} />
                    <span>{kv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Win probability */}
          {aiCoach?.winProbability && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--card-border)' }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Win Probability Impact:</span>
              <span style={{
                background: aiCoach.winProbability === 'HIGH' ? 'var(--green)' : aiCoach.winProbability === 'MEDIUM' ? 'var(--orange)' : 'var(--red)',
                color: '#fff', padding: '3px 10px', borderRadius: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: .4,
              }}>
                {aiCoach.winProbability}
              </span>
            </div>
          )}
        </div>

        {/* Win / Loss Intelligence */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-title" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>WIN / LOSS INTELLIGENCE (LAST 12 MONTHS)</div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Total Opportunities', num: winLoss?.total,       color: 'var(--text)' },
              { label: 'Won',                 num: winLoss?.won,         pct: winLoss?.winRate,                  color: 'var(--green)' },
              { label: 'Lost',                num: winLoss?.lost,        pct: winLoss ? 100 - winLoss.winRate : null, color: 'var(--red)' },
              { label: 'Win Rate',            num: `${winLoss?.winRate}%`, color: 'var(--blue)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.num}</div>
                {k.pct != null && <div style={{ fontSize: 10, color: k.color, fontWeight: 700 }}>({k.pct}%)</div>}
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Win donut + legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Wins Against Competitors</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WinPie competitors={winLoss?.competitors || []} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(winLoss?.competitors || []).map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                      <svg viewBox="0 0 8 8" style={{ width: 8, height: 8, flexShrink: 0 }}><circle cx="4" cy="4" r="4" fill={c.color}/></svg>
                      <span style={{ color: 'var(--text)' }}>{c.label}</span>
                      <span style={{ fontWeight: 700 }}>{c.wins}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({c.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Top Winning Messages</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(winLoss?.topMessages || []).map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: 'var(--text)' }}>
                    <CheckIcon color="var(--green)" size={12} />
                    <span>{m}</span>
                  </div>
                ))}
              </div>

              {/* Win rate donut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--card-border)' }}>
                <WinDonut rate={winLoss?.winRate || 0} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Win Rate</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--blue)' }}>{winLoss?.winRate}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
