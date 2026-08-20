import { useState, useRef, useEffect } from 'react';
import { saveManualProduct, aiFillProduct, uploadProduct, generateCompetitor, verifyPin } from '../../api/products.js';
import { useSSE } from '../../hooks/useSSE.js';
import { useData } from '../../context/DataContext.jsx';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 5 }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const INPUT_STYLE = {
  padding: '9px 11px', borderRadius: 7, fontSize: 13,
  border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
  color: 'var(--text)', outline: 'none', width: '100%',
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE, resize: 'vertical', fontFamily: 'var(--font)', lineHeight: 1.5,
};

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{icon} {title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── Dynamic list editor (for string arrays like strengths, weaknesses etc.) ──
function StringListEditor({ label, values, onChange, placeholder }) {
  function update(i, v) { const a = [...values]; a[i] = v; onChange(a); }
  function add()        { onChange([...values, '']); }
  function remove(i)    { onChange(values.filter((_, idx) => idx !== i)); }

  return (
    <Field label={label}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {values.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            <input
              value={v}
              onChange={e => update(i, e.target.value)}
              placeholder={placeholder || `Item ${i + 1}`}
              style={{ ...INPUT_STYLE, flex: 1 }}
            />
            <button type="button" onClick={() => remove(i)} style={{
              padding: '0 10px', borderRadius: 7, border: '1px solid var(--card-border)',
              background: 'var(--card-bg)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16,
            }}>×</button>
          </div>
        ))}
        <button type="button" onClick={add} style={{
          padding: '6px', borderRadius: 7, border: '1px dashed var(--card-border)',
          background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
        }}>+ Add item</button>
      </div>
    </Field>
  );
}

// ─── Q/A pair editor ──────────────────────────────────────────────────────────
function QAEditor({ questions, responses, onChangeQ, onChangeR }) {
  const len = Math.max(questions.length, responses.length, 1);
  function updateQ(i, v) { const a = [...questions]; a[i] = v; onChangeQ(a); }
  function updateR(i, v) { const a = [...responses]; a[i] = v; onChangeR(a); }
  function add()  { onChangeQ([...questions, '']); onChangeR([...responses, '']); }
  function remove(i) {
    onChangeQ(questions.filter((_, idx) => idx !== i));
    onChangeR(responses.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: len }).map((_, i) => (
        <div key={i} style={{
          padding: '12px 14px', borderRadius: 8,
          border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Question {i + 1}</div>
            <button type="button" onClick={() => remove(i)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
            }}>×</button>
          </div>
          <textarea
            value={questions[i] || ''}
            onChange={e => updateQ(i, e.target.value)}
            placeholder="Discovery question..."
            rows={2}
            style={{ ...TEXTAREA_STYLE, marginBottom: 8 }}
          />
          <Label>Recommended Response</Label>
          <textarea
            value={responses[i] || ''}
            onChange={e => updateR(i, e.target.value)}
            placeholder="Suggested response to this question..."
            rows={2}
            style={TEXTAREA_STYLE}
          />
        </div>
      ))}
      <button type="button" onClick={add} style={{
        padding: '7px', borderRadius: 7, border: '1px dashed var(--card-border)',
        background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
      }}>+ Add Q&amp;A pair</button>
    </div>
  );
}

// ─── Objection editor ─────────────────────────────────────────────────────────
function ObjectionEditor({ items, onChange }) {
  function update(i, field, v) {
    const a = [...items];
    a[i] = { ...a[i], [field]: v };
    onChange(a);
  }
  function add()     { onChange([...items, { objection: '', response: '' }]); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: '12px 14px', borderRadius: 8,
          border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Objection {i + 1}</div>
            <button type="button" onClick={() => remove(i)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
            }}>×</button>
          </div>
          <input
            value={item.objection}
            onChange={e => update(i, 'objection', e.target.value)}
            placeholder='"Competitor X is cheaper..."'
            style={{ ...INPUT_STYLE, marginBottom: 8 }}
          />
          <Label>Response</Label>
          <textarea
            value={item.response}
            onChange={e => update(i, 'response', e.target.value)}
            placeholder="How to handle this objection..."
            rows={2}
            style={TEXTAREA_STYLE}
          />
        </div>
      ))}
      <button type="button" onClick={add} style={{
        padding: '7px', borderRadius: 7, border: '1px dashed var(--card-border)',
        background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
      }}>+ Add objection</button>
    </div>
  );
}

// ─── Feature Matrix editor ────────────────────────────────────────────────────
const DOT_OPTIONS = ['green', 'yellow', 'red'];
const DOT_COLORS  = { green: '#2dca6e', yellow: '#f5c518', red: '#ff5a5a' };

function FeatureMatrixEditor({ matrix, onChange }) {
  const labels  = matrix?.labels  || { product: '', comp1: '', comp2: '' };
  const rows    = matrix?.rows    || [];

  function setLabel(k, v) { onChange({ ...matrix, labels: { ...labels, [k]: v } }); }
  function setRow(i, field, v) {
    const r = [...rows];
    r[i] = { ...r[i], [field]: v };
    onChange({ ...matrix, rows: r });
  }
  function addRow()     { onChange({ ...matrix, rows: [...rows, { feature: '', product: 'green', comp1: 'yellow', comp2: 'red' }] }); }
  function removeRow(i) { onChange({ ...matrix, rows: rows.filter((_, idx) => idx !== i) }); }

  return (
    <div>
      {/* Column label inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {['product', 'comp1', 'comp2'].map(k => (
          <Field key={k} label={k === 'product' ? 'Your Product Column' : `Competitor ${k.slice(-1)} Column`}>
            <input value={labels[k] || ''} onChange={e => setLabel(k, e.target.value)} style={INPUT_STYLE} placeholder={k} />
          </Field>
        ))}
      </div>

      {/* Row list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 32px',
            gap: 6, alignItems: 'center',
          }}>
            <input
              value={row.feature || ''} onChange={e => setRow(i, 'feature', e.target.value)}
              placeholder="Feature name" style={INPUT_STYLE}
            />
            {['product', 'comp1', 'comp2'].map(k => (
              <select key={k} value={row[k] || 'yellow'} onChange={e => setRow(i, k, e.target.value)}
                style={{ ...INPUT_STYLE, padding: '8px 6px' }}>
                {DOT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            <button type="button" onClick={() => removeRow(i)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
            }}>×</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} style={{
        marginTop: 8, padding: '6px 12px', borderRadius: 7, border: '1px dashed var(--card-border)',
        background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
      }}>+ Add feature row</button>
    </div>
  );
}

// ─── TCO editor ───────────────────────────────────────────────────────────────
function TcoEditor({ tco, onChange }) {
  const labels = tco?.labels  || { product: '', comp1: '', comp2: '' };
  const rows   = tco?.rows    || [];
  const totals = tco?.totals  || { product: '', comp1: '', comp2: '' };

  function setLabel(k, v) { onChange({ ...tco, labels: { ...labels, [k]: v } }); }
  function setTotal(k, v) { onChange({ ...tco, totals: { ...totals, [k]: v } }); }
  function setRow(i, field, v) {
    const r = [...rows]; r[i] = { ...r[i], [field]: v };
    onChange({ ...tco, rows: r });
  }
  function addRow()     { onChange({ ...tco, rows: [...rows, { component: '', product: '', comp1: '', comp2: '' }] }); }
  function removeRow(i) { onChange({ ...tco, rows: rows.filter((_, idx) => idx !== i) }); }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {['product', 'comp1', 'comp2'].map(k => (
          <Field key={k} label={`${k === 'product' ? 'Product' : `Competitor ${k.slice(-1)}`} Label`}>
            <input value={labels[k] || ''} onChange={e => setLabel(k, e.target.value)} style={INPUT_STYLE} />
          </Field>
        ))}
      </div>

      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 32px',
          gap: 6, alignItems: 'center', marginBottom: 6,
        }}>
          <input value={row.component || ''} onChange={e => setRow(i, 'component', e.target.value)} placeholder="Cost component" style={INPUT_STYLE} />
          {['product', 'comp1', 'comp2'].map(k => (
            <input key={k} value={row[k] || ''} onChange={e => setRow(i, k, e.target.value)} placeholder="$XXK" style={INPUT_STYLE} />
          ))}
          <button type="button" onClick={() => removeRow(i)} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16,
          }}>×</button>
        </div>
      ))}
      <button type="button" onClick={addRow} style={{
        padding: '6px 12px', borderRadius: 7, border: '1px dashed var(--card-border)',
        background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
      }}>+ Add cost row</button>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 32px', gap: 6, alignItems: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>3-Year Total</div>
        {['product', 'comp1', 'comp2'].map(k => (
          <input key={k} value={totals[k] || ''} onChange={e => setTotal(k, e.target.value)} placeholder="$XXXk" style={INPUT_STYLE} />
        ))}
        <div />
      </div>
    </div>
  );
}

// ─── Competitor display block (read-only, with AI generate button) ─────────────
function CompetitorsBlock({ competitors, competitorSummary, pin, practice, productName, onGenerated }) {
  const [generatingFor, setGeneratingFor] = useState(null);

  async function handleGenerate(name) {
    if (!pin || !productName) return;
    setGeneratingFor(name);
    try {
      await generateCompetitor(name, productName, practice, pin);
      // SSE will fire competitor_added; parent re-fetches
    } catch (err) {
      alert('Generation failed: ' + err.message);
    } finally {
      setGeneratingFor(null);
    }
  }

  const names = (competitors || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div>
      {names.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '8px 0' }}>
          No competitors entered. Add them in the "Competitors" field above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {names.map(name => {
            const profile = (competitorSummary || []).find(c => c.name?.toLowerCase() === name.toLowerCase());
            const isGen = generatingFor === name;
            return (
              <div key={name} style={{
                padding: '14px 16px', borderRadius: 10,
                border: `1px solid ${profile ? '#2dca6e33' : 'var(--card-border)'}`,
                background: 'var(--card-bg2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: profile ? 10 : 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                    {profile?.logo || '🏢'} {name}
                    {profile?.marketPosition && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                        background: 'var(--blue-lt)', color: 'var(--blue)',
                      }}>{profile.marketPosition}</span>
                    )}
                  </div>
                  {!profile && (
                    <button
                      type="button"
                      onClick={() => handleGenerate(name)}
                      disabled={isGen}
                      style={{
                        padding: '4px 12px', borderRadius: 6, border: 'none', cursor: isGen ? 'not-allowed' : 'pointer',
                        background: isGen ? 'var(--card-border)' : 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 700,
                      }}
                    >{isGen ? 'Generating...' : '✨ AI Generate Profile'}</button>
                  )}
                </div>
                {profile && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <p style={{ marginBottom: 6 }}>{profile.overview}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 3, fontSize: 11 }}>STRENGTHS</div>
                        {(profile.strengths || []).map((s, i) => <div key={i}>• {s}</div>)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 3, fontSize: 11 }}>WEAKNESSES</div>
                        {(profile.weaknesses || []).map((w, i) => <div key={i}>• {w}</div>)}
                      </div>
                    </div>
                    {profile.pricingSummary && (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--blue)' }}>💰 {profile.pricingSummary}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Progress Bar (same as AddProductPage) ────────────────────────────────────
function ProgressBar({ percent, message }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{message || 'Processing...'}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{percent}%</span>
      </div>
      <div className="progress-track"><div className="progress-bar" style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'basic',       label: '1 · Basic Info' },
  { id: 'details',     label: '2 · Details & Features' },
  { id: 'competitive', label: '3 · Competitive' },
  { id: 'customers',   label: '4 · Customers & Cases' },
  { id: 'sales',       label: '5 · Sales Tools' },
  { id: 'upload',      label: '📎 File Upload' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
// ─── PIN gate ────────────────────────────────────────────────────────────────
function PinGate({ onUnlock }) {
  const [v, setV] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!v.trim()) return;
    setChecking(true);
    setError('');
    try {
      await verifyPin(v.trim());
      onUnlock(v.trim());
    } catch {
      setError('Incorrect PIN. Please try again.');
      setV('');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>🔒 Admin Access</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, textAlign: 'center' }}>Enter admin PIN to save product data.</div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 200 }}>
        <input type="password" value={v} onChange={e => setV(e.target.value)} placeholder="PIN" autoFocus
          disabled={checking}
          style={{ padding: '10px 14px', borderRadius: 8, fontSize: 16, letterSpacing: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg2)', color: 'var(--text)', textAlign: 'center', outline: 'none' }} />
        {error && <div style={{ fontSize: 11, color: '#ff5a5a', textAlign: 'center' }}>{error}</div>}
        <button type="submit" disabled={checking} style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: checking ? 'not-allowed' : 'pointer', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700, opacity: checking ? 0.7 : 1 }}>
          {checking ? 'Verifying…' : 'Unlock →'}
        </button>
      </form>
    </div>
  );
}

export default function ProductFormPage({ pin: externalPin, onPinSet, editDoc, defaultPractice, practices: practicesProp, onSaved }) {
  const [pin, setPin] = useState(externalPin || null);
  const { practices: ctxPractices } = useData();
  // Use prop if provided (has full map), else fall back to context
  const practices = (practicesProp && Object.keys(practicesProp).length) ? practicesProp : ctxPractices;

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [competitorSummary, setCompetitorSummary] = useState(editDoc?.competitorSummary || []);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [practice, setPractice]   = useState(editDoc?.practice || defaultPractice || '');
  const [productName, setProduct] = useState(editDoc?.product  || '');
  const [competitors, setComp]    = useState(editDoc?.competitors || '');

  // Overview fields
  const [overview, setOverview] = useState({
    logo: '', name: '', category: '', deployment: '', targetUsers: '',
    productLaunch: '', marketPosition: '', description: '',
    ...(editDoc?.overview || {}),
  });

  // Array fields
  const [keyFeatures,          setKeyFeatures]          = useState(editDoc?.keyFeatures          || []);
  const [discoveryQuestions,   setDiscoveryQ]            = useState(editDoc?.discoveryQuestions   || []);
  const [recommendedResponses, setRecommendedR]          = useState(editDoc?.recommendedResponses || []);
  const [strengths,            setStrengths]             = useState(editDoc?.strengths            || []);
  const [weaknesses,           setWeaknesses]            = useState(editDoc?.weaknesses           || []);
  const [objectionHandling,    setObjections]            = useState(editDoc?.objectionHandling    || []);
  const [caseStudies,          setCaseStudies]           = useState(editDoc?.caseStudies          || []);
  const [keyCustomers,         setKeyCustomers]          = useState(editDoc?.keyCustomers         || []);
  const [featureMatrix,        setFeatureMatrix]         = useState(editDoc?.featureMatrix        || { labels: {}, rows: [] });
  const [tcoData,              setTcoData]               = useState(editDoc?.tcoData              || { labels: {}, rows: [], totals: {} });

  // Win/loss summary fields
  const [winLoss, setWinLoss] = useState(editDoc?.winLoss || { total: '', won: '', lost: '', winRate: '', competitors: [], topMessages: [] });

  // SSE for competitor_added
  useSSE({
    competitor_added: ({ competitorName, profile }) => {
      setCompetitorSummary(prev => {
        const exists = prev.find(c => c.name?.toLowerCase() === competitorName.toLowerCase());
        if (exists) return prev.map(c => c.name?.toLowerCase() === competitorName.toLowerCase() ? profile : c);
        return [...prev, profile];
      });
    },
    ai_progress: (data) => { setProgress(data); },
    product_added: (data) => {
      if (data.percent === 100) {
        setSaving(false); setFilling(false);
        if (onSaved) onSaved(data.practice, data.product);
      }
    },
  });

  // ── File helpers ─────────────────────────────────────────────────────────────
  function mergeFiles(existing, incoming) {
    const names = new Set(existing.map(f => f.name));
    return [...existing, ...incoming.filter(f => !names.has(f.name))];
  }
  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    setFiles(prev => mergeFiles(prev, Array.from(e.dataTransfer.files)));
  }
  function handleFileChange(e) {
    setFiles(prev => mergeFiles(prev, Array.from(e.target.files)));
    e.target.value = '';
  }

  // ── Build product document from form state ─────────────────────────────────
  function buildDoc() {
    return {
      practice,
      product: productName,
      competitors,
      overview: { ...overview, name: overview.name || productName.toUpperCase() },
      keyFeatures,
      discoveryQuestions,
      recommendedResponses,
      strengths,
      weaknesses,
      objectionHandling,
      caseStudies,
      keyCustomers,
      competitorSummary,
      featureMatrix,
      tcoData,
      winLoss,
    };
  }

  // ── Save manually ───────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!practice || !productName.trim()) { setError('Practice and Product Name are required.'); return; }
    setError(''); setSaving(true);

    // If files are attached, use the upload+AI route
    if (files.length > 0) {
      const formData = new FormData();
      formData.append('pin', pin);
      formData.append('productName', productName.trim());
      formData.append('practice', practice);
      formData.append('description', overview.description || '');
      formData.append('competitors', competitors);
      files.forEach(f => formData.append('files', f));
      setProgress({ percent: 0, stage: 'uploading', message: 'Uploading files...' });
      try {
        await uploadProduct(formData);
        // success via SSE product_added
      } catch (err) {
        if (err?.response?.status === 401) { setError('Invalid PIN.'); }
        else { setError(err.message || 'Upload failed.'); setSaving(false); }
      }
      return;
    }

    // Pure manual save
    try {
      const doc = await saveManualProduct(buildDoc(), pin);
      setSaving(false);
      if (onSaved) onSaved(doc.practice, doc.product);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
      setSaving(false);
    }
  }

  // ── AI fill missing ─────────────────────────────────────────────────────────
  async function handleAiFill() {
    if (!productName.trim() || !practice) { setError('Enter Product Name and Practice first.'); return; }
    setError(''); setFilling(true);
    setProgress({ percent: 0, stage: 'starting', message: 'Sending to AI...' });
    try {
      await aiFillProduct({
        productId: editDoc?._id,
        practice,
        product: productName.trim(),
        competitors,
      }, pin);
      // SSE product_added fires on completion
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
      setFilling(false);
    }
  }

  // ── PIN gate — show before the form if PIN not yet known ──────────────────
  if (!pin) {
    return <PinGate onUnlock={(p) => { setPin(p); if (onPinSet) onPinSet(p); }} />;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  const practiceOptions = Object.keys(practices).length ? Object.keys(practices) : ['IBM', 'AWS'];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 920, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>
          {editDoc ? `✏️ Edit: ${editDoc.product}` : '✏️ Manual Product Entry'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Fill in all fields manually, upload files, or let AI fill any missing data.
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <button type="button" onClick={handleSave} disabled={saving || filling} style={{
          padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: saving ? 'var(--card-border)' : 'var(--blue)',
          color: saving ? 'var(--text-muted)' : '#fff', fontSize: 13, fontWeight: 700,
        }}>{saving ? '⏳ Saving...' : '💾 Save Product'}</button>

        <button type="button" onClick={handleAiFill} disabled={saving || filling} style={{
          padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: filling ? 'var(--card-border)' : 'var(--purple)',
          color: filling ? 'var(--text-muted)' : '#fff', fontSize: 13, fontWeight: 700,
        }}>{filling ? '⏳ AI Filling...' : '✨ AI Fill Missing Fields'}</button>

        {onSaved && (
          <button type="button" onClick={() => onSaved(null, null)} style={{
            padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            border: '1px solid var(--card-border)', background: 'var(--card-bg2)', color: 'var(--text)',
          }}>← Back</button>
        )}
      </div>

      {/* Progress */}
      {(saving || filling) && progress && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <ProgressBar percent={progress.percent || 0} message={progress.message} />
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#ff5a5a18', border: '1px solid #ff5a5a44', color: '#ff5a5a', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: activeTab === t.id ? 'var(--blue)' : 'var(--card-bg2)',
              color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── TAB: BASIC INFO ── */}
      {activeTab === 'basic' && (
        <div className="card" style={{ padding: '22px 24px' }}>
          <SectionTitle icon="🔷" title="Basic Information" sub="Core identity of the product." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            <Field label="Practice *">
              {practiceOptions.length > 0 ? (
                <select value={practice} onChange={e => setPractice(e.target.value)} style={{ ...INPUT_STYLE }}>
                  <option value="">Select practice...</option>
                  {practiceOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <input value={practice} onChange={e => setPractice(e.target.value)} placeholder="e.g. IBM" style={INPUT_STYLE} />
              )}
            </Field>

            <Field label="Product Name *">
              <input value={productName} onChange={e => setProduct(e.target.value)} placeholder="e.g. IBM Security Verify" style={INPUT_STYLE} required />
            </Field>

            <Field label="Display Logo (emoji)">
              <input value={overview.logo} onChange={e => setOverview(o => ({ ...o, logo: e.target.value }))} placeholder="🔐" style={INPUT_STYLE} />
            </Field>

            <Field label="Category">
              <input value={overview.category} onChange={e => setOverview(o => ({ ...o, category: e.target.value }))} placeholder="e.g. Identity & Access Management" style={INPUT_STYLE} />
            </Field>

            <Field label="Deployment Model">
              <input value={overview.deployment} onChange={e => setOverview(o => ({ ...o, deployment: e.target.value }))} placeholder="SaaS / On-Prem / Hybrid" style={INPUT_STYLE} />
            </Field>

            <Field label="Target Users">
              <input value={overview.targetUsers} onChange={e => setOverview(o => ({ ...o, targetUsers: e.target.value }))} placeholder="e.g. Security Teams, IT Admins" style={INPUT_STYLE} />
            </Field>

            <Field label="Product Launch Year">
              <input value={overview.productLaunch} onChange={e => setOverview(o => ({ ...o, productLaunch: e.target.value }))} placeholder="e.g. 2015" style={INPUT_STYLE} />
            </Field>

            <Field label="Market Position">
              <input value={overview.marketPosition} onChange={e => setOverview(o => ({ ...o, marketPosition: e.target.value }))} placeholder="e.g. Leader (Gartner MQ)" style={INPUT_STYLE} />
            </Field>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Competitors (comma-separated)">
                <input value={competitors} onChange={e => setComp(e.target.value)} placeholder="e.g. Okta, Microsoft Azure AD, Ping Identity" style={INPUT_STYLE} />
              </Field>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Product Description">
                <textarea value={overview.description} onChange={e => setOverview(o => ({ ...o, description: e.target.value }))} placeholder="2-3 sentence description of the product..." rows={3} style={TEXTAREA_STYLE} />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DETAILS & FEATURES ── */}
      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="⭐" title="Key Features" sub="What makes this product stand out. Use emoji + name." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {keyFeatures.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 32px', gap: 6 }}>
                  <input value={f.icon || ''} onChange={e => { const a = [...keyFeatures]; a[i] = { ...a[i], icon: e.target.value }; setKeyFeatures(a); }} placeholder="🔐" style={INPUT_STYLE} />
                  <input value={f.name || ''} onChange={e => { const a = [...keyFeatures]; a[i] = { ...a[i], name: e.target.value }; setKeyFeatures(a); }} placeholder="Feature name" style={INPUT_STYLE} />
                  <button type="button" onClick={() => setKeyFeatures(kf => kf.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => setKeyFeatures(kf => [...kf, { icon: '', name: '' }])} style={{ padding: '6px', borderRadius: 7, border: '1px dashed var(--card-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>+ Add feature</button>
            </div>
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="✅" title="Strengths & Weaknesses" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <StringListEditor label="Strengths" values={strengths} onChange={setStrengths} placeholder="Strength..." />
              <StringListEditor label="Weaknesses" values={weaknesses} onChange={setWeaknesses} placeholder="Weakness..." />
            </div>
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="🔍" title="Discovery Q&A" sub="Questions to ask customers + recommended responses." />
            <QAEditor questions={discoveryQuestions} responses={recommendedResponses} onChangeQ={setDiscoveryQ} onChangeR={setRecommendedR} />
          </div>
        </div>
      )}

      {/* ── TAB: COMPETITIVE ── */}
      {activeTab === 'competitive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="⚔️" title="Competitor Profiles" sub="Based on the competitors entered in Basic Info. AI can generate missing profiles." />
            <CompetitorsBlock
              competitors={competitors}
              competitorSummary={competitorSummary}
              pin={pin}
              practice={practice}
              productName={productName}
              onGenerated={(profile) => setCompetitorSummary(prev => [...prev, profile])}
            />
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="📊" title="Feature Comparison Matrix" sub="green = strong, yellow = partial, red = weak/missing." />
            <FeatureMatrixEditor matrix={featureMatrix} onChange={setFeatureMatrix} />
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="💰" title="TCO Comparison (3-Year)" />
            <TcoEditor tco={tcoData} onChange={setTcoData} />
          </div>
        </div>
      )}

      {/* ── TAB: CUSTOMERS & CASES ── */}
      {activeTab === 'customers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="🏢" title="Key Customers" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {keyCustomers.map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 100px 32px', gap: 6 }}>
                  <input value={c.logo || ''} onChange={e => { const a = [...keyCustomers]; a[i] = { ...a[i], logo: e.target.value }; setKeyCustomers(a); }} placeholder="🏦" style={INPUT_STYLE} />
                  <input value={c.name || ''} onChange={e => { const a = [...keyCustomers]; a[i] = { ...a[i], name: e.target.value }; setKeyCustomers(a); }} placeholder="Company name" style={INPUT_STYLE} />
                  <input value={c.industry || ''} onChange={e => { const a = [...keyCustomers]; a[i] = { ...a[i], industry: e.target.value }; setKeyCustomers(a); }} placeholder="Industry" style={INPUT_STYLE} />
                  <input value={c.color || ''} onChange={e => { const a = [...keyCustomers]; a[i] = { ...a[i], color: e.target.value }; setKeyCustomers(a); }} placeholder="#hex" style={INPUT_STYLE} />
                  <button type="button" onClick={() => setKeyCustomers(kc => kc.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => setKeyCustomers(kc => [...kc, { logo: '', name: '', industry: '', color: '' }])} style={{ padding: '6px', borderRadius: 7, border: '1px dashed var(--card-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>+ Add customer</button>
            </div>
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="📖" title="Case Studies" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {caseStudies.map((cs, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--card-bg2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Case Study {i + 1}</div>
                    <button type="button" onClick={() => setCaseStudies(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input value={cs.icon || ''} onChange={e => { const a = [...caseStudies]; a[i] = { ...a[i], icon: e.target.value }; setCaseStudies(a); }} placeholder="🏦" style={INPUT_STYLE} />
                    <input value={cs.customer || ''} onChange={e => { const a = [...caseStudies]; a[i] = { ...a[i], customer: e.target.value }; setCaseStudies(a); }} placeholder="Customer name/type" style={INPUT_STYLE} />
                    <input value={cs.type || ''} onChange={e => { const a = [...caseStudies]; a[i] = { ...a[i], type: e.target.value }; setCaseStudies(a); }} placeholder="Industry" style={INPUT_STYLE} />
                  </div>
                  <textarea value={cs.challenge || ''} onChange={e => { const a = [...caseStudies]; a[i] = { ...a[i], challenge: e.target.value }; setCaseStudies(a); }} placeholder="Challenge faced..." rows={2} style={{ ...TEXTAREA_STYLE, marginBottom: 8 }} />
                  <textarea value={cs.result || ''} onChange={e => { const a = [...caseStudies]; a[i] = { ...a[i], result: e.target.value }; setCaseStudies(a); }} placeholder="Quantified result..." rows={2} style={TEXTAREA_STYLE} />
                </div>
              ))}
              <button type="button" onClick={() => setCaseStudies(prev => [...prev, { icon: '', customer: '', type: '', challenge: '', result: '' }])} style={{ padding: '6px', borderRadius: 7, border: '1px dashed var(--card-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>+ Add case study</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SALES TOOLS ── */}
      {activeTab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="🛡" title="Objection Handling" />
            <ObjectionEditor items={objectionHandling} onChange={setObjections} />
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <SectionTitle icon="📈" title="Win / Loss Summary" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
              {['total','won','lost','winRate'].map(k => (
                <Field key={k} label={k === 'winRate' ? 'Win Rate (%)' : k.charAt(0).toUpperCase() + k.slice(1)}>
                  <input type="number" value={winLoss[k] || ''} onChange={e => setWinLoss(w => ({ ...w, [k]: Number(e.target.value) }))} style={INPUT_STYLE} />
                </Field>
              ))}
            </div>
            <StringListEditor label="Top Winning Messages" values={winLoss.topMessages || []} onChange={v => setWinLoss(w => ({ ...w, topMessages: v }))} placeholder="Key win message..." />
          </div>
        </div>
      )}

      {/* ── TAB: FILE UPLOAD ── */}
      {activeTab === 'upload' && (
        <div className="card" style={{ padding: '22px 24px' }}>
          <SectionTitle icon="📎" title="Upload Data Files" sub="PDF, CSV, JSON, Excel or TXT. AI reads all files and fills missing fields on save." />
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf,.csv,.json,.xlsx,.xls,.txt" multiple onChange={handleFileChange} />
          <div
            className={`file-drop-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>☁</div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
                {files.length > 0 ? 'Drop more files or click to add' : 'Drop files here or click to browse'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                PDF · CSV · JSON · XLSX · TXT — max 10 MB each
              </div>
            </div>
          </div>
          {files.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map(f => {
                const ext = f.name.split('.').pop().toLowerCase();
                const icon = ext === 'pdf' ? '📕' : ext === 'xlsx' || ext === 'xls' ? '📊' : ext === 'csv' ? '📋' : ext === 'json' ? '📦' : '📄';
                return (
                  <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 7, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button type="button" onClick={() => setFiles(prev => prev.filter(x => x.name !== f.name))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>×</button>
                  </div>
                );
              })}
              <div style={{ fontSize: 11, color: 'var(--text-dim)', paddingLeft: 2 }}>
                {files.length} file{files.length > 1 ? 's' : ''} attached — click "Save Product" to upload and process
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom save button */}
      <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
        <button type="button" onClick={handleSave} disabled={saving || filling} style={{
          flex: 1, padding: '12px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: saving ? 'var(--card-border)' : 'var(--blue)',
          color: saving ? 'var(--text-muted)' : '#fff', fontSize: 14, fontWeight: 800,
        }}>{saving ? '⏳ Saving...' : '💾 Save Product'}</button>
        <button type="button" onClick={handleAiFill} disabled={saving || filling} style={{
          flex: 1, padding: '12px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: filling ? 'var(--card-border)' : 'var(--purple)',
          color: filling ? 'var(--text-muted)' : '#fff', fontSize: 14, fontWeight: 800,
        }}>{filling ? '⏳ AI Filling...' : '✨ AI Fill Missing & Save'}</button>
      </div>
    </div>
  );
}
