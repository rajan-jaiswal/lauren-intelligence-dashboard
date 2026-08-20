import { useState, useEffect, useCallback, Component, useRef } from 'react';
import { PRACTICES, PRODUCTS_BY_PRACTICE } from './dashboardData.js';
import { DataProvider, useData } from './context/DataContext.jsx';
import { useSSE } from './hooks/useSSE.js';

// ── Error Boundary — catches render crashes and shows a recovery UI ───────────
class PageErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Page render error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, padding: 40 }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Something went wrong loading this page</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 420, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700 }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import AddProductPage from './pages/sections/AddProductPage.jsx';
import ManagePracticePage from './pages/sections/ManagePracticePage.jsx';
import ProductFormPage from './pages/sections/ProductFormPage.jsx';
import { verifyPin } from './api/products.js';
import OverviewPage from './pages/sections/OverviewPage.jsx';
import ProductDetailsPage from './pages/sections/ProductDetailsPage.jsx';
import CompetitiveAnalysisPage from './pages/sections/CompetitiveAnalysisPage.jsx';
import TcoComparisonPage from './pages/sections/TcoComparisonPage.jsx';
import CaseStudiesPage from './pages/sections/CaseStudiesPage.jsx';
import CustomersPage from './pages/sections/CustomersPage.jsx';
import ObjectionHandlingPage from './pages/sections/ObjectionHandlingPage.jsx';
import WinLossPage from './pages/sections/WinLossPage.jsx';
import AiSalesCoachPage from './pages/sections/AiSalesCoachPage.jsx';
import AwsDashboardPage from './pages/sections/AwsDashboardPage.jsx';

// ── Inline SVG icon components ────────────────────────────────────────────
const IC = {
  Overview:     <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"/></svg>,
  Product:      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 01.894.553l7 14A1 1 0 0117 18H3a1 1 0 01-.894-1.447l7-14A1 1 0 0110 2zm0 3.236L4.618 16h10.764L10 5.236z"/></svg>,
  Competitive:  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 1116 0A8 8 0 012 10zm8-6a1 1 0 100 2 1 1 0 000-2zm-1 4a1 1 0 012 0v4a1 1 0 01-2 0v-4zm1 8a1 1 0 100-2 1 1 0 000 2z"/></svg>,
  TCO:          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>,
  Cases:        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>,
  Customers:    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>,
  Objections:   <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  WinLoss:      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>,
  Coach:        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>,
  Sun:          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>,
  Moon:         <svg viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>,
  Refresh:      <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>,
  Calendar:     <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>,
};

const AddIcon    = <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>;
const ManageIcon = <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>;
const LockIcon   = <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>;
const UnlockIcon = <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg>;

const NAV_ITEMS_IBM = [
  { id: 'overview',    icon: IC.Overview,    label: 'Overview' },
  { id: 'product',     icon: IC.Product,     label: 'Product Details' },
  { id: 'competitive', icon: IC.Competitive, label: 'Competitive Analysis' },
  { id: 'tco',         icon: IC.TCO,         label: 'TCO Comparison' },
  { id: 'cases',       icon: IC.Cases,       label: 'Case Studies' },
  { id: 'customers',   icon: IC.Customers,   label: 'Customers' },
  { id: 'objections',  icon: IC.Objections,  label: 'Objection Handling' },
  { id: 'winloss',     icon: IC.WinLoss,     label: 'Win / Loss' },
  { id: 'coach',       icon: IC.Coach,       label: 'AI Sales Coach', ai: true },
  { id: 'admin',       icon: null,           label: 'Admin', adminGate: true },
];

const NAV_ITEMS_AWS = [
  { id: 'aws-dashboard', icon: IC.Overview,    label: 'AWS Portfolio' },
  { id: 'competitive',   icon: IC.Competitive, label: 'Competitive Analysis' },
  { id: 'objections',    icon: IC.Objections,  label: 'Discovery Framework' },
  { id: 'customers',     icon: IC.Customers,   label: 'Customer Success' },
  { id: 'tco',           icon: IC.TCO,         label: 'TCO & Business Value' },
  { id: 'objections2',   icon: IC.Objections,  label: 'Objection Handling' },
  { id: 'coach',         icon: IC.Coach,       label: 'AI Sales Coach', ai: true },
  { id: 'winloss',       icon: IC.WinLoss,     label: 'Win/Loss Intelligence' },
  { id: 'aws-exec',      icon: IC.Product,     label: 'Executive Messaging' },
  { id: 'admin',         icon: null,           label: 'Admin', adminGate: true },
];

// ── Inline Admin PIN Gate (shown in main area when 'admin' nav is active) ────
function AdminGatePage({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pin.trim()) return;
    setChecking(true);
    setError('');
    try {
      await verifyPin(pin.trim());
      onUnlock(pin.trim());
    } catch {
      setError('Incorrect password. Please try again.');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 20 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--card-bg2)', border: '1.5px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 26, height: 26, color: 'var(--blue)' }}>
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Admin Access</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340 }}>
          Enter the admin password to unlock <strong>Add Product</strong> and <strong>Manage Practices</strong>.
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
        <input
          ref={inputRef}
          type="password"
          maxLength={32}
          placeholder="Enter admin password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          disabled={checking}
          style={{
            padding: '11px 16px', borderRadius: 8, fontSize: 15, letterSpacing: 4,
            border: `1.5px solid ${error ? '#ff5a5a' : 'var(--card-border)'}`,
            background: 'var(--card-bg2)', color: 'var(--text)', textAlign: 'center',
            outline: 'none', transition: 'border-color .15s',
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: '#ff5a5a', textAlign: 'center', marginTop: -4 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={checking || !pin.trim()}
          style={{
            padding: '11px', borderRadius: 8, border: 'none',
            cursor: (checking || !pin.trim()) ? 'not-allowed' : 'pointer',
            background: 'var(--blue)', color: '#fff', fontSize: 14, fontWeight: 700,
            opacity: (checking || !pin.trim()) ? 0.65 : 1, transition: 'opacity .15s',
          }}
        >
          {checking ? 'Verifying…' : 'Unlock Admin →'}
        </button>
      </form>
    </div>
  );
}

// Sparkline (SVG, no emoji)
function Sparkline() {
  const pts = [18,12,22,8,24,10,20,14,26,6,22,16,28,10,24];
  const w = 130, h = 36;
  const max = Math.max(...pts), min = Math.min(...pts);
  const sx = (i) => (i / (pts.length - 1)) * w;
  const sy = (v) => h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const area = d + ` L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sparkline">
      <path d={area} fill="rgba(74,158,255,.12)" />
      <path d={d} fill="none" stroke="#4a9eff" strokeWidth="1.8" />
    </svg>
  );
}

// ── Welcome / Selection Screen ────────────────────────────────────────────
function WelcomeScreen({ theme, setTheme, practice, product, products, onPracticeChange, onProductChange, onLaunch, _loading, practicesList }) {
  const isAws = practice === 'AWS';
  const displayPractices = practicesList && practicesList.length ? practicesList : ['IBM', 'AWS'];

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font)',
    }}>

      {/* Theme toggle — top right */}
      <button
        className="theme-btn"
        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        style={{ position: 'fixed', top: 16, right: 20 }}
      >
        <span style={{ width: 13, height: 13, display: 'flex' }}>
          {theme === 'dark' ? IC.Sun : IC.Moon}
        </span>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

      {/* Card */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 14, padding: '44px 52px', width: '100%', maxWidth: 520,
        boxShadow: '0 8px 40px rgba(0,0,0,.35)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--text)', letterSpacing: 4, lineHeight: 1 }}>
            LAUREN
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 4, textAlign: 'center', textTransform: 'uppercase', marginTop: 3 }}>
            Intelligence Dashboard
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 48, height: 3, background: isAws ? '#ff9900' : 'var(--blue)', borderRadius: 2, margin: '18px 0 28px' }}/>

        {/* Headline */}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6, textAlign: 'center' }}>
          Select your Practice &amp; Product
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28, textAlign: 'center', lineHeight: 1.6 }}>
          Choose the practice and product you want to explore,<br/>then launch the dashboard.
        </div>

        {/* Selectors */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Practice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .8 }}>
              Practice
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {displayPractices.map((p) => (
                <button
                  key={p}
                  onClick={() => onPracticeChange(p)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontWeight: 800, letterSpacing: .5,
                    border: practice === p
                      ? `2px solid ${p === 'AWS' ? '#ff9900' : 'var(--blue)'}`
                      : '2px solid var(--card-border)',
                    background: practice === p
                      ? (p === 'AWS' ? 'rgba(255,153,0,.12)' : 'var(--blue-lt)')
                      : 'var(--card-bg2)',
                    color: practice === p
                      ? (p === 'AWS' ? '#ff9900' : 'var(--blue)')
                      : 'var(--text-muted)',
                    transition: 'all .15s',
                  }}
                >
                  {p === 'AWS' ? '☁' : '🔷'} {p}
                </button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .8 }}>
              Product
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {products.map((p) => {
                const accent = isAws ? '#ff9900' : 'var(--blue)';
                const accentLt = isAws ? 'rgba(255,153,0,.12)' : 'var(--blue-lt)';
                return (
                  <button
                    key={p}
                    onClick={() => onProductChange(p)}
                    style={{
                      padding: '8px 16px', borderRadius: 7, cursor: 'pointer',
                      fontSize: 12, fontWeight: 700,
                      border: product === p ? `2px solid ${accent}` : '2px solid var(--card-border)',
                      background: product === p ? accentLt : 'var(--card-bg2)',
                      color: product === p ? accent : 'var(--text-muted)',
                      transition: 'all .15s',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={onLaunch}
          style={{
            marginTop: 32, width: '100%', padding: '13px 0',
            borderRadius: 9, border: 'none', cursor: 'pointer',
            background: isAws ? '#ff9900' : 'var(--blue)',
            color: '#fff', fontSize: 14, fontWeight: 900, letterSpacing: .8,
            transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.target.style.opacity = '.88'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Launch Dashboard →
        </button>

        {/* Footer note */}
        <div style={{ marginTop: 20, fontSize: 10.5, color: 'var(--text-dim)', textAlign: 'center' }}>
          For internal use only · © 2025 Lauren Group
        </div>
      </div>

    </div>
  );
}

// ── Inner app — has access to DataContext ──────────────────────────────────
function AppInner() {
  const [activeNav, setActiveNav]   = useState('overview');
  const [theme, setTheme]           = useState('light');
  const [practice, setPractice]     = useState('IBM');
  const [product, setProduct]       = useState('Instana');
  const [launched, setLaunched]     = useState(false);
  const [data, setData]             = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [adminPin, setAdminPin]     = useState(null);   // unlocked once, reused
  const [formArgs, setFormArgs]     = useState({});     // { editDoc } for product-form

  const { practices, loading, getProductData, invalidateProduct, addProductToList, addPracticeToList, removeProductFromList } = useData();

  // SSE — listen for real-time product additions
  useSSE({
    product_added: ({ practice: p, product: prod }) => {
      addProductToList(p, prod);
      invalidateProduct(p, prod);
    },
  });

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
  }, [theme]);

  // Load product data whenever practice/product changes.
  // NOTE: getProductData is intentionally excluded from deps — it is a stable
  // async helper; including it causes re-fetch loops when productCache updates.
  useEffect(() => {
    if (!practice) return;
    let cancelled = false;
    // Clear data immediately so the loading state shows instead of stale data
    // from a different practice/product rendering inside page components.
    setData(null);
    setDataLoading(true);
    getProductData(practice, product || '').then((d) => {
      if (!cancelled) {
        setData(d || {
          practice, product,
          overview: { name: product || practice, description: 'No data found.' },
          keyFeatures: [], discoveryQuestions: [], recommendedResponses: [],
          strengths: [], weaknesses: [], caseStudies: [], keyCustomers: [],
          competitorSummary: [], objectionHandling: [], featureMatrix: { labels: {}, rows: [] },
          tcoData: { labels: {}, rows: [], totals: {} },
          winLoss: { total: 0, won: 0, lost: 0, winRate: 0, competitors: [] },
          aiCoach: {}, pricingTiers: [],
        });
        setDataLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setData({
          practice, product,
          overview: { name: product || practice, description: 'Could not load data.' },
          keyFeatures: [], discoveryQuestions: [], recommendedResponses: [],
          strengths: [], weaknesses: [], caseStudies: [], keyCustomers: [],
          competitorSummary: [], objectionHandling: [], featureMatrix: { labels: {}, rows: [] },
          tcoData: { labels: {}, rows: [], totals: {} },
          winLoss: { total: 0, won: 0, lost: 0, winRate: 0, competitors: [] },
          aiCoach: {}, pricingTiers: [],
        });
        setDataLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [practice, product]); // eslint-disable-line react-hooks/exhaustive-deps

  const products = (practices[practice] || PRODUCTS_BY_PRACTICE[practice] || []);

  const handlePracticeChange = useCallback((p) => {
    setPractice(p);
    const list = practices[p] || PRODUCTS_BY_PRACTICE[p] || [];
    setProduct(list[0] || '');
    setActiveNav('overview');
  }, [practices]);

  const handleProductChange = useCallback((p) => {
    setProduct(p);
    setActiveNav('overview');
  }, []);

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const practicesList = Object.keys(practices).length ? Object.keys(practices) : PRACTICES;

  const isAws = practice === 'AWS';
  const NAV_ITEMS = isAws ? NAV_ITEMS_AWS : NAV_ITEMS_IBM;

  // ── Welcome / Selection screen ────────────────────────────────────────
  if (!launched) {
    return (
      <WelcomeScreen
        theme={theme}
        setTheme={setTheme}
        practice={practice}
        product={product}
        products={products}
        onPracticeChange={handlePracticeChange}
        onProductChange={handleProductChange}
        onLaunch={() => setLaunched(true)}
        loading={loading}
        practicesList={practicesList}
      />
    );
  }

  // Show loading skeleton only on very first load (no data at all yet)
  if (!data) {
    return (
      <div className="dashboard-layout">
        <aside className="sidebar" style={{ background: '#0d1526' }}>
          <div className="sidebar-logo"><div className="brand-name">LAUREN</div></div>
        </aside>
        <div className="main-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--card-border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
            <span>Loading product data…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  // Navigate to product-form with optional editDoc, optionally propagating a freshly-entered PIN
  function navToForm(targetPractice, editDoc, resolvedPin) {
    if (resolvedPin) setAdminPin(resolvedPin);
    setFormArgs({ editDoc, defaultPractice: targetPractice || practice });
    setActiveNav('product-form');
  }

  function renderPage() {
    const ADMIN_PAGES = ['admin', 'add-product', 'manage-practice', 'product-form'];
    const isAdminPage = ADMIN_PAGES.includes(activeNav);

    // Admin gate — show PIN form if not yet unlocked, otherwise show welcome panel
    if (activeNav === 'admin') {
      if (!adminPin) {
        return <AdminGatePage onUnlock={(p) => { setAdminPin(p); }} />;
      }
      // Already unlocked: show a simple landing with links to sub-pages
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--card-bg2)', border: '1.5px solid #2dca6e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 26, height: 26, color: '#2dca6e' }}>
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Admin Unlocked</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select an option from the sidebar to continue.</div>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={() => setActiveNav('add-product')} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--blue)', color: '#fff', fontSize: 14, fontWeight: 700 }}>
              ➕ Add Product
            </button>
            <button onClick={() => setActiveNav('manage-practice')} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#b47fff', color: '#fff', fontSize: 14, fontWeight: 700 }}>
              ⚙ Manage Practices
            </button>
          </div>
          <button
            onClick={() => { setAdminPin(null); setActiveNav('overview'); }}
            style={{ marginTop: 4, padding: '9px 22px', borderRadius: 8, border: '1px solid var(--card-border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}
          >
            🔒 Logout Admin
          </button>
        </div>
      );
    }

    if (activeNav === 'add-product') {
      return (
        <AddProductPage
          practice={practice}
          pin={adminPin}
          onPinSet={setAdminPin}
          onProductAdded={(p, prod) => { addProductToList(p, prod); setProduct(prod); setPractice(p); setActiveNav('overview'); }}
        />
      );
    }

    if (activeNav === 'manage-practice') {
      return (
        <ManagePracticePage
          pin={adminPin || null}
          onPinSet={setAdminPin}
          onAddProduct={(targetPractice, resolvedPin) => navToForm(targetPractice, null, resolvedPin)}
          onNavigate={(page, args) => { setFormArgs(args || {}); setActiveNav(page); }}
        />
      );
    }

    if (activeNav === 'product-form') {
      return (
        <ProductFormPage
          pin={adminPin || null}
          onPinSet={setAdminPin}
          editDoc={formArgs?.editDoc || null}
          defaultPractice={formArgs?.defaultPractice || practice}
          practices={practices}
          onSaved={(p, prod) => {
            if (p && prod) { addProductToList(p, prod); }
            setActiveNav('manage-practice');
          }}
        />
      );
    }

    // AWS: always show the full dashboard
    if (isAws && !isAdminPage) {
      return <AwsDashboardPage data={data} />;
    }
    switch (activeNav) {
      case 'overview':    return <OverviewPage data={data} />;
      case 'product':     return <ProductDetailsPage data={data} />;
      case 'competitive': return <CompetitiveAnalysisPage data={data} />;
      case 'tco':         return <TcoComparisonPage data={data} />;
      case 'cases':       return <CaseStudiesPage data={data} />;
      case 'customers':   return <CustomersPage data={data} />;
      case 'objections':  return <ObjectionHandlingPage data={data} />;
      case 'winloss':     return <WinLossPage data={data} />;
      case 'coach':       return <AiSalesCoachPage data={data} onNavigate={setActiveNav} />;
      default:            return <OverviewPage data={data} />;
    }
  }

  return (
    <div className="dashboard-layout">

      {/* ── Sidebar ── */}
    <aside className="sidebar">
      <div className="sidebar-logo">
        {isAws ? (
          <>
            <div className="brand-name">LAUREN</div>
            <div className="brand-sub" style={{ color: '#ff9900', letterSpacing: 2 }}>AWS PRACTICE</div>
          </>
        ) : (
          <>
            <div className="brand-name">LAUREN</div>
            <div className="brand-sub">GROUP</div>
          </>
        )}
      </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            // ── Admin gate item ─────────────────────────────────────────────
            if (item.adminGate) {
              return (
                <div key="admin-group">
                  {/* Admin header row */}
                  <div
                    className={`nav-item${activeNav === 'admin' ? ' active' : ''}`}
                    onClick={() => setActiveNav('admin')}
                    style={{ borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 4, paddingTop: 4 }}
                  >
                    <span className="nav-icon">
                      {adminPin ? UnlockIcon : LockIcon}
                    </span>
                    <span className="nav-label">Admin</span>
                    {adminPin
                      ? <span className="ai-badge" style={{ background: '#2dca6e', color: '#fff', fontSize: 9 }}>ON</span>
                      : <span className="ai-badge" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.6)', fontSize: 9 }}>🔒</span>
                    }
                  </div>
                  {/* Sub-items — only visible when admin is unlocked */}
                  {adminPin && (
                    <>
                      <div
                        className={`nav-item${activeNav === 'add-product' ? ' active' : ''}`}
                        onClick={() => setActiveNav('add-product')}
                        style={{ paddingLeft: 28 }}
                      >
                        <span className="nav-icon">{AddIcon}</span>
                        <span className="nav-label">Add Product</span>
                        <span className="ai-badge" style={{ background: '#2dca6e', color: '#fff' }}>NEW</span>
                      </div>
                      <div
                        className={`nav-item${activeNav === 'manage-practice' ? ' active' : ''}`}
                        onClick={() => setActiveNav('manage-practice')}
                        style={{ paddingLeft: 28 }}
                      >
                        <span className="nav-icon">{ManageIcon}</span>
                        <span className="nav-label">Manage Practices</span>
                        <span className="ai-badge" style={{ background: '#b47fff', color: '#fff' }}>⚙</span>
                      </div>
                      <div
                        className="nav-item"
                        onClick={() => { setAdminPin(null); setActiveNav('overview'); }}
                        style={{ paddingLeft: 28, color: '#ff7a7a' }}
                      >
                        <span className="nav-icon">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h6a1 1 0 100-2H4V5h5a1 1 0 100-2H3zm10.293 4.293a1 1 0 011.414 0L17 9.586V9a1 1 0 112 0v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        </span>
                        <span className="nav-label">Logout</span>
                      </div>
                    </>
                  )}
                </div>
              );
            }
            // ── Regular nav item ────────────────────────────────────────────
            return (
              <div
                key={item.id}
                className={`nav-item${activeNav === item.id ? ' active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.ai && <span className="ai-badge">AI</span>}
              </div>
            );
          })}
        </nav>

        {/* AI Insights panel */}
        <div className="ai-insights-box">
          <div className="ai-title">
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
            </svg>
            AI Insights
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginBottom: 5 }}>This week</div>
          <Sparkline />
          <div className="data-health" style={{ marginTop: 9 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginBottom: 3 }}>Data Health</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 8 8" style={{ width: 8, height: 8, flexShrink: 0 }}>
                <circle cx="4" cy="4" r="4" fill="#2dca6e"/>
              </svg>
              <span className="health-val">Excellent</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginLeft: 2 }}>98%</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="main-area">

        {/* Header */}
        <header className="top-header">
          <div className="header-title">
            {isAws
              ? <><span style={{ color: '#ff9900', fontWeight: 900 }}>AWS</span> SALES INTELLIGENCE &amp; COMPETITIVE DASHBOARD</>
              : 'PRODUCT INTELLIGENCE & COMPETITIVE DASHBOARD'
            }
          </div>
          <div className="header-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 14, height: 14, display: 'flex' }}>{IC.Calendar}</span>
              Data as of:
            </span>
            <span className="header-date">{data.dataAsOf || dateStr}</span>
            <button
              className="theme-btn"
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            >
              <span style={{ width: 13, height: 13, display: 'flex' }}>
                {theme === 'dark' ? IC.Sun : IC.Moon}
              </span>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="refresh-btn">
              <span style={{ width: 13, height: 13, display: 'flex' }}>{IC.Refresh}</span>
              Refresh
            </button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">Practice</span>
            <select className="filter-select" value={practice} onChange={(e) => handlePracticeChange(e.target.value)}>
                {practicesList.map((p) => <option key={p}>{p}</option>)}
              </select>
          </div>
          <div className="filter-divider" />
          <div className="filter-group">
            <span className="filter-label">Product</span>
            <select className="filter-select" value={product} onChange={(e) => handleProductChange(e.target.value)}>
              {products.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="filter-divider" />
          <div className="filter-group">
            <span className="filter-label">vs. Competitors</span>
            <div className="competitors-display">{data.competitors}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              className="refresh-btn"
              onClick={() => setLaunched(false)}
              style={{ gap: 5 }}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                <path fillRule="evenodd" d="M15 8a.5.5 0 00-.5-.5H2.707l3.147-3.146a.5.5 0 10-.708-.708l-4 4a.5.5 0 000 .708l4 4a.5.5 0 00.708-.708L2.707 8.5H14.5A.5.5 0 0015 8z"/>
              </svg>
              Change Selection
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-content" style={{ position: 'relative' }}>
          {/* Loading overlay — shown while switching practice/product, keeps layout intact */}
          {dataLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 50,
              background: 'var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 12,
            }}>
              <div style={{ width: 38, height: 38, border: '3px solid var(--card-border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                Loading {product || practice}…
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <PageErrorBoundary key={`${practice}/${product}`}>
            {renderPage()}
          </PageErrorBoundary>
          <div style={{ marginTop: 22, paddingTop: 12, borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
            <span>All data is indicative and for internal use only. Source: Internal CRM, Market Intelligence, Gartner, Public Sources.</span>
            <span style={{ whiteSpace: 'nowrap', marginLeft: 24 }}>© 2025 Lauren Group. All rights reserved.</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  );
}
