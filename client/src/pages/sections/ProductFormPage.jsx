import { useState, useRef, useEffect, useCallback } from 'react';
import { saveManualProduct, aiFillProduct, aiGeneratePreview, uploadProduct, generateCompetitor, verifyPin, extractFromFile, checkDuplicate } from '../../api/products.js';
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
  { id: 'aicoach',     label: '6 · AI Sales Coach' },
  { id: 'upload',      label: '📎 File Upload' },
];

// ─── AI Generate-Preview confirmation modal ───────────────────────────────────
function AiFillConfirmModal({ productName, practice, competitors, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--modal-overlay)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 14, padding: '28px 32px', maxWidth: 460, width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      }}>
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--purple-lt)', border: '1.5px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            ✨
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
              Generate Product Data with AI?
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              AI will fill the form fields. You review, edit, then click Save.
            </div>
          </div>
        </div>

        {/* Product summary */}
        <div style={{ background: 'var(--card-bg2)', border: '1px solid var(--card-border)', borderRadius: 9, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, minWidth: 72 }}>Practice</span>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>{practice}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: competitors ? 6 : 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, minWidth: 72 }}>Product</span>
            <span style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 800 }}>{productName}</span>
          </div>
          {competitors && (
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, minWidth: 72 }}>vs.</span>
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{competitors}</span>
            </div>
          )}
        </div>

        {/* What happens next */}
        <div style={{ fontSize: 12, color: 'var(--text)', background: 'var(--green-lt)', border: '1px solid var(--green)', borderRadius: 7, padding: '10px 13px', marginBottom: 20, lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--green)' }}>How it works:</strong><br />
          1. AI generates all product fields (no data is saved yet)<br />
          2. The form is pre-filled — you can review and edit any field<br />
          3. Click <strong>"Save Product"</strong> when you're happy to save to the database
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--purple)', color: '#fff', fontSize: 13, fontWeight: 800 }}
          >
            ✨ Generate & Preview
          </button>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '11px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: '1px solid var(--card-border)', background: 'var(--card-bg2)', color: 'var(--text)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [competitorSummary, setCompetitorSummary] = useState(editDoc?.competitorSummary || []);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState(null);
  const [showAiConfirm, setShowAiConfirm] = useState(false);
  const [aiPreviewDone, setAiPreviewDone] = useState(false);
  const [isAiFilling, setIsAiFilling] = useState(false);
  // Duplicate name check state
  const [dupWarning, setDupWarning] = useState('');
  const dupCheckTimer = useRef(null);
  // True while AI preview is pending — suppresses product_added auto-navigation
  const previewModeRef = useRef(false);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [practice, setPractice]   = useState(editDoc?.practice || defaultPractice || '');
  const [productName, setProduct] = useState(editDoc?.product  || '');
  const [competitors, setComp]    = useState(
    Array.isArray(editDoc?.competitors)
      ? editDoc.competitors.join(', ')
      : (editDoc?.competitors || '')
  );

  // ── Duplicate name check (debounced) ─────────────────────────────────────────
  const checkDup = useCallback((prac, name) => {
    setDupWarning('');
    if (!prac || !name.trim() || editDoc?._id) return; // skip for edits
    clearTimeout(dupCheckTimer.current);
    dupCheckTimer.current = setTimeout(async () => {
      try {
        const { exists } = await checkDuplicate(prac, name.trim());
        if (exists) setDupWarning(`"${name.trim()}" already exists in ${prac}. Saving will overwrite it.`);
      } catch (_) { /* non-critical */ }
    }, 600);
  }, [editDoc]);

  function handleProductNameChange(v) {
    setProduct(v);
    checkDup(practice, v);
  }
  function handlePracticeChange(v) {
    setPractice(v);
    checkDup(v, productName);
  }

  // Overview fields
  const [overview, setOverview] = useState({
    logo: '', name: '', category: '', deployment: '', targetUsers: '',
    productLaunch: '', marketPosition: '', gartnerMQ: '', description: '',
    ...(editDoc?.overview || {}),
  });

  // AI Sales Coach fields
  const [aiCoach, setAiCoach] = useState({
    customerSays: '',
    suggestedResponse: '',
    recommendedCaseStudy: '',
    winProbability: '',
    kvps: [],
    ...(editDoc?.aiCoach || {}),
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

  // SSE for competitor_added / ai_progress / ai_preview / product_added
  useSSE({
    competitor_added: ({ competitorName, profile }) => {
      setCompetitorSummary(prev => {
        const exists = prev.find(c => c.name?.toLowerCase() === competitorName.toLowerCase());
        if (exists) return prev.map(c => c.name?.toLowerCase() === competitorName.toLowerCase() ? profile : c);
        return [...prev, profile];
      });
    },
    ai_progress: (data) => { setProgress(data); },

    // ── AI preview: populate form fields, do NOT save or navigate ────────────
    ai_preview: ({ data: d }) => {
      if (!d) return;
      previewModeRef.current = false;
      setFilling(false);
      setProgress(null);
      setAiPreviewDone(true);
      // Populate overview fields
      if (d.overview) setOverview(o => ({ ...o, ...d.overview }));
      // Populate product name if blank
      if (d.overview?.name && !productName) setProduct(d.overview.name);
      // Array fields — only fill if currently empty
      if (Array.isArray(d.keyFeatures)          && d.keyFeatures.length)          setKeyFeatures(d.keyFeatures);
      if (Array.isArray(d.discoveryQuestions)    && d.discoveryQuestions.length)   setDiscoveryQ(d.discoveryQuestions);
      if (Array.isArray(d.recommendedResponses)  && d.recommendedResponses.length) setRecommendedR(d.recommendedResponses);
      if (Array.isArray(d.strengths)             && d.strengths.length)            setStrengths(d.strengths);
      if (Array.isArray(d.weaknesses)            && d.weaknesses.length)           setWeaknesses(d.weaknesses);
      if (Array.isArray(d.objectionHandling)     && d.objectionHandling.length)    setObjections(d.objectionHandling);
      if (Array.isArray(d.caseStudies)           && d.caseStudies.length)          setCaseStudies(d.caseStudies);
      if (Array.isArray(d.keyCustomers)          && d.keyCustomers.length)         setKeyCustomers(d.keyCustomers);
      if (Array.isArray(d.competitorSummary)     && d.competitorSummary.length)    setCompetitorSummary(d.competitorSummary);
      if (d.featureMatrix?.rows?.length)   setFeatureMatrix(d.featureMatrix);
      if (d.tcoData?.rows?.length)         setTcoData(d.tcoData);
      if (d.winLoss) {
        // Ensure winLoss.competitors are objects {label,wins,pct,color}, not strings
        const wlCompetitors = Array.isArray(d.winLoss.competitors)
          ? d.winLoss.competitors.map(c =>
              typeof c === 'string' ? { label: c, wins: 0, pct: 0, color: '#5a6478' } : c
            )
          : [];
        setWinLoss(wl => ({ ...wl, ...d.winLoss, competitors: wlCompetitors }));
      }
      if (d.aiCoach)                       setAiCoach(ac => ({ ...ac, ...d.aiCoach }));
      // Switch to Basic Info tab so user sees the filled data
      setActiveTab('basic');
    },

    // ── product_added: navigate unless we're in ai-generate-preview mode ──────
    product_added: (data) => {
      if (previewModeRef.current) return; // ai-generate-preview in flight — ignore
      if (data.percent === 100) {
        setSaving(false); setFilling(false); setIsAiFilling(false); setProgress(null);
        if (onSaved) onSaved(data.practice, data.product);
      }
    },
  });

  // ── File helpers ─────────────────────────────────────────────────────────────
  function mergeFiles(existing, incoming) {
    const names = new Set(existing.map(f => f.name));
    return [...existing, ...incoming.filter(f => !names.has(f.name))];
  }
  function handleFileChange(e) {
    if (!e.target.files || e.target.files.length === 0) return;
    setFiles(prev => mergeFiles(prev, Array.from(e.target.files)));
    // Reset so the same file can be re-selected if removed and re-added
    e.target.value = '';
  }

  // ── Extract from file — reads first file, pre-fills ALL form fields ──────────
  async function handleExtractFromFile() {
    if (!files.length) { setError('Please upload a file first.'); return; }
    if (!pin) { setError('PIN required — please re-enter your admin PIN.'); return; }
    const file = files[0];
    setIsExtracting(true);
    setExtractedFields(null);
    setError('');
    try {
      const result = await extractFromFile(file, pin);
      const d = result.data || {};

      // ── Overview / basic fields — only fill if currently blank ────────────────
      if (d.productName    && !productName)             { setProduct(d.productName); checkDup(practice, d.productName); }
      if (d.description    && !overview.description)    setOverview(o => ({ ...o, description: d.description }));
      if (d.category       && !overview.category)       setOverview(o => ({ ...o, category: d.category }));
      if (d.deployment     && !overview.deployment)     setOverview(o => ({ ...o, deployment: d.deployment }));
      if (d.targetUsers    && !overview.targetUsers)    setOverview(o => ({ ...o, targetUsers: d.targetUsers }));
      if (d.productLaunch  && !overview.productLaunch)  setOverview(o => ({ ...o, productLaunch: d.productLaunch }));
      if (d.marketPosition && !overview.marketPosition) setOverview(o => ({ ...o, marketPosition: d.marketPosition }));
      if (d.gartnerMQ      && !overview.gartnerMQ)      setOverview(o => ({ ...o, gartnerMQ: d.gartnerMQ }));

      // ── Array fields — only fill if currently empty ───────────────────────────
      if (Array.isArray(d.keyFeatures) && d.keyFeatures.length && !keyFeatures.length) {
        setKeyFeatures(d.keyFeatures.map(f => typeof f === 'string' ? { icon: '⚡', name: f } : { icon: f.icon || '⚡', name: f.name || String(f) }));
      }
      if (Array.isArray(d.strengths)            && d.strengths.length            && !strengths.length)            setStrengths(d.strengths);
      if (Array.isArray(d.weaknesses)           && d.weaknesses.length           && !weaknesses.length)           setWeaknesses(d.weaknesses);
      if (Array.isArray(d.discoveryQuestions)   && d.discoveryQuestions.length   && !discoveryQuestions.length)   setDiscoveryQ(d.discoveryQuestions);
      if (Array.isArray(d.recommendedResponses) && d.recommendedResponses.length && !recommendedResponses.length) setRecommendedR(d.recommendedResponses);
      if (Array.isArray(d.objectionHandling)    && d.objectionHandling.length    && !objectionHandling.length)    setObjections(d.objectionHandling);
      if (Array.isArray(d.caseStudies)          && d.caseStudies.length          && !caseStudies.length)          setCaseStudies(d.caseStudies);
      if (Array.isArray(d.keyCustomers)         && d.keyCustomers.length         && !keyCustomers.length)         setKeyCustomers(d.keyCustomers);
      if (Array.isArray(d.competitors)          && d.competitors.length          && !competitors)                 setComp(d.competitors.join(', '));

      // ── Structured fields ─────────────────────────────────────────────────────
      if (d.featureMatrix?.rows?.length && !featureMatrix?.rows?.length) setFeatureMatrix(d.featureMatrix);
      if (d.tcoData?.rows?.length       && !tcoData?.rows?.length)       setTcoData(d.tcoData);
      if (d.winLoss) setWinLoss(wl => ({
        ...wl,
        ...(d.winLoss.total    ? { total:   d.winLoss.total }   : {}),
        ...(d.winLoss.won      ? { won:     d.winLoss.won }     : {}),
        ...(d.winLoss.lost     ? { lost:    d.winLoss.lost }    : {}),
        ...(d.winLoss.winRate  ? { winRate: d.winLoss.winRate } : {}),
        ...(Array.isArray(d.winLoss.topMessages) && d.winLoss.topMessages.length ? { topMessages: d.winLoss.topMessages } : {}),
        ...(Array.isArray(d.winLoss.competitors) && d.winLoss.competitors.length
          ? {
              competitors: d.winLoss.competitors.map(c =>
                typeof c === 'string' ? { label: c, wins: 0, pct: 0, color: '#5a6478' } : c
              ),
            }
          : {}),
      }));
      if (d.aiCoach) setAiCoach(ac => ({ ...ac, ...d.aiCoach }));

      setExtractedFields(d);
      // Switch to Basic Info so user immediately sees the filled data
      setActiveTab('basic');
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'PDF extraction failed');
    } finally {
      setIsExtracting(false);
    }
  }

  // ── AI Fill Missing Details — saves to DB then navigates to the product
  // NOTE: previewModeRef must NOT be set here — aiFillProduct saves to DB
  // and fires product_added at percent:100, which the handler uses to navigate.
  async function handleAiFillMissing() {
    if (!productName.trim() || !practice) { setError('Enter Product Name and Practice first (go to Basic Info tab).'); return; }
    setError('');
    setIsAiFilling(true);
    // previewModeRef stays false so product_added SSE will trigger navigation
    setProgress({ percent: 10, stage: 'starting', message: 'AI is analysing and filling missing details...' });
    try {
      await aiFillProduct({
        practice,
        product: productName.trim(),
        competitors,
      }, pin);
      // SSE ai_progress + product_added will fire as server completes
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
      setIsAiFilling(false);
      setProgress(null);
    }
  }

  // ── Build product document from form state ─────────────────────────────────
  function buildDoc() {
    return {
      // Include _id when editing so saveManualProduct uses PUT instead of POST
      ...(editDoc?._id ? { _id: editDoc._id } : {}),
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
      aiCoach,
    };
  }

  // ── Save manually ───────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!practice || !productName.trim()) { setError('Practice and Product Name are required.'); return; }
    setError('');
    setDupWarning('');

    // Block save if duplicate product exists and this is a new product (not editing)
    if (!editDoc?._id) {
      try {
        const { exists } = await checkDuplicate(practice, productName.trim());
        if (exists) {
          setError(`"${productName.trim()}" already exists in ${practice}. Use the Edit button from Manage Practices to update it.`);
          return;
        }
      } catch (_) { /* non-critical — proceed */ }
    }

    setSaving(true);

    // Pure manual save (no auto-AI when files attached — use Extract + AI Fill buttons for that)
    try {
      const doc = await saveManualProduct(buildDoc(), pin);
      setSaving(false);
      if (onSaved) onSaved(doc.practice, doc.product);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
      setSaving(false);
    }
  }

  // ── AI generate preview ──────────────────────────────────────────────────────
  // Step 1: validate → show confirm modal
  function handleAiFill() {
    if (!productName.trim() || !practice) { setError('Enter Product Name and Practice first.'); return; }
    setError('');
    setShowAiConfirm(true);
  }

  // Step 2: user confirmed → call preview endpoint (no DB save)
  // When the SSE ai_preview event arrives, form fields are populated and
  // the user can edit them before clicking "Save Product" to persist.
  async function doAiFill() {
    setShowAiConfirm(false);
    previewModeRef.current = true;
    setFilling(true);
    setProgress({ percent: 0, stage: 'starting', message: 'AI is generating product data...' });
    try {
      await aiGeneratePreview({
        practice,
        product: productName.trim(),
        competitors,
      }, pin);
      // SSE ai_preview fires when done → populates form fields
    } catch (err) {
      previewModeRef.current = false;
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

  const isEditing = !!editDoc?._id;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 920, margin: '0 auto' }}>

      {/* ── AI Generate-Preview confirmation modal ── */}
      {showAiConfirm && (
        <AiFillConfirmModal
          productName={productName}
          practice={practice}
          competitors={competitors}
          onConfirm={doAiFill}
          onCancel={() => setShowAiConfirm(false)}
        />
      )}


      {/* ── Fixed save bar — position:fixed so it never scrolls away inside overflow:auto container ── */}
      <div className="pf-save-bar" style={{
        position: 'fixed',
        top: 0,
        left: 185,       /* sidebar width — overridden to 0 on mobile via CSS */
        right: 0,
        zIndex: 200,
        background: 'var(--card-bg)',
        borderBottom: '2px solid var(--card-border)',
        padding: '10px 28px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
      }}>
        {/* Product identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEditing ? (
              <>
                <span style={{ background: 'var(--orange-lt)', color: 'var(--orange)', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: .6, flexShrink: 0 }}>Editing</span>
                {overview.logo || editDoc?.overview?.logo || '📦'} {productName || editDoc.product}
              </>
            ) : (
              <>✏️ New Product</>
            )}
          </div>
          {isEditing && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Changes will overwrite the existing product · {practice}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {onSaved && (
            <button type="button" onClick={() => onSaved(null, null)} style={{
              padding: '8px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-muted)',
            }}>← Back</button>
          )}
          <button type="button" onClick={handleAiFill} disabled={saving || filling} style={{
            padding: '8px 16px', borderRadius: 7, border: 'none', cursor: saving || filling ? 'not-allowed' : 'pointer',
            background: filling ? 'var(--card-border)' : 'var(--purple)',
            color: filling ? 'var(--text-muted)' : '#fff', fontSize: 12, fontWeight: 700, opacity: filling ? 0.7 : 1,
          }}>{filling ? '⏳ Generating...' : '✨ AI Generate'}</button>

          <button type="button" onClick={handleSave} disabled={saving || filling} style={{
            padding: '8px 22px', borderRadius: 7, border: 'none', cursor: saving || filling ? 'not-allowed' : 'pointer',
            background: saving ? 'var(--card-border)' : isEditing ? 'var(--green)' : 'var(--blue)',
            color: saving ? 'var(--text-muted)' : '#fff', fontSize: 13, fontWeight: 800, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? '⏳ Saving...' : isEditing ? '💾 Save Changes' : '💾 Save Product'}
          </button>
        </div>
      </div>

      {/* Spacer — pushes content below the fixed bar (bar height ≈ 50px) */}
      <div style={{ height: 54, flexShrink: 0 }} />

      {/* Progress */}
      {(saving || filling) && progress && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <ProgressBar percent={progress.percent || 0} message={progress.message} />
        </div>
      )}

      {/* AI preview ready banner */}
      {aiPreviewDone && !filling && !saving && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 9, marginBottom: 16,
          background: 'var(--green-lt)', border: '1.5px solid var(--green)',
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>AI data generated — form is pre-filled</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Review each tab, edit any fields you want, then click <strong>Save Product</strong> to save to the database.</div>
          </div>
          <button
            type="button"
            onClick={() => setAiPreviewDone(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 4 }}
          >×</button>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#ff5a5a18', border: '1px solid #ff5a5a44', color: '#ff5a5a', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="pf-tabs" style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className="pf-tab"
            style={{
              padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              whiteSpace: 'nowrap',
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
                <select value={practice} onChange={e => handlePracticeChange(e.target.value)} style={{ ...INPUT_STYLE }}>
                  <option value="">Select practice...</option>
                  {practiceOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <input value={practice} onChange={e => handlePracticeChange(e.target.value)} placeholder="e.g. IBM" style={INPUT_STYLE} />
              )}
            </Field>

            <Field label="Product Name *">
              <input
                value={productName}
                onChange={e => handleProductNameChange(e.target.value)}
                placeholder="e.g. IBM Security Verify"
                style={{ ...INPUT_STYLE, borderColor: dupWarning ? '#f5c518' : undefined }}
                required
              />
              {dupWarning && (
                <div style={{ fontSize: 11, color: '#f5c518', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  ⚠️ {dupWarning}
                </div>
              )}
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

            <Field label="Gartner MQ">
              <input value={overview.gartnerMQ || ''} onChange={e => setOverview(o => ({ ...o, gartnerMQ: e.target.value }))} placeholder="e.g. Leader, Visionary, Challenger, Niche Player" style={INPUT_STYLE} />
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

      {/* ── TAB: AI SALES COACH ── */}
      {activeTab === 'aicoach' && (
        <div className="card" style={{ padding: '22px 24px' }}>
          <SectionTitle icon="🤖" title="AI Sales Coach" sub="Fill in customer scenario and coaching data. This will appear on the product overview page." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Field label="Customer Says">
              <textarea
                value={aiCoach.customerSays || ''}
                onChange={e => setAiCoach(ac => ({ ...ac, customerSays: e.target.value }))}
                placeholder="e.g. We are worried about integration complexity with our existing systems..."
                rows={3}
                style={TEXTAREA_STYLE}
              />
            </Field>

            <Field label="Suggested Response">
              <textarea
                value={aiCoach.suggestedResponse || ''}
                onChange={e => setAiCoach(ac => ({ ...ac, suggestedResponse: e.target.value }))}
                placeholder="e.g. Our product offers native connectors for all major identity providers and supports..."
                rows={4}
                style={TEXTAREA_STYLE}
              />
            </Field>

            <Field label="Recommended Case Study">
              <input
                value={aiCoach.recommendedCaseStudy || ''}
                onChange={e => setAiCoach(ac => ({ ...ac, recommendedCaseStudy: e.target.value }))}
                placeholder="e.g. Global Bank reduced onboarding time by 60% using IBM Security Verify"
                style={INPUT_STYLE}
              />
            </Field>

            <Field label="Win Probability">
              <select
                value={aiCoach.winProbability || ''}
                onChange={e => setAiCoach(ac => ({ ...ac, winProbability: e.target.value }))}
                style={INPUT_STYLE}
              >
                <option value="">Select...</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </Field>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Key Value Points</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(aiCoach.kvps || []).map((kv, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 32px', gap: 6 }}>
                    <input
                      value={kv}
                      onChange={e => {
                        const a = [...(aiCoach.kvps || [])];
                        a[i] = e.target.value;
                        setAiCoach(ac => ({ ...ac, kvps: a }));
                      }}
                      placeholder="Key value point..."
                      style={INPUT_STYLE}
                    />
                    <button
                      type="button"
                      onClick={() => setAiCoach(ac => ({ ...ac, kvps: (ac.kvps || []).filter((_, idx) => idx !== i) }))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
                    >×</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setAiCoach(ac => ({ ...ac, kvps: [...(ac.kvps || []), ''] }))}
                  style={{ padding: '6px', borderRadius: 7, border: '1px dashed var(--card-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                >+ Add key value point</button>
              </div>
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
          <SectionTitle icon="📎" title="Upload Document" sub="Step 1: Upload your PDF/Word file and click Extract. Step 2: Click AI Fill to complete missing fields. Step 3: Save Product." />

          {/* HOW IT WORKS banner */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            {[
              { n: '1', label: 'Upload', desc: 'Drop or click to pick file', color: 'var(--blue)' },
              { n: '2', label: 'Extract', desc: 'Pull fields from document', color: 'var(--green)' },
              { n: '3', label: 'AI Fill', desc: 'Fill remaining gaps with AI', color: 'var(--purple)' },
              { n: '4', label: 'Save', desc: 'Click Save Product button', color: 'var(--orange)' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: '10px 12px', background: 'var(--card-bg2)', borderRight: i < 3 ? '1px solid var(--card-border)' : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: s.color, marginBottom: 2 }}>{s.n}. {s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Drop zone — input IS the clickable area via label wrapping */}
          <label
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: `2px dashed ${dragOver ? 'var(--blue)' : 'var(--card-border)'}`,
              borderRadius: 12, padding: '28px 20px', cursor: 'pointer',
              background: dragOver ? 'var(--blue-lt)' : 'var(--card-bg2)',
              transition: 'all .15s', userSelect: 'none',
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
            onDrop={e => {
              e.preventDefault(); e.stopPropagation(); setDragOver(false);
              const dropped = Array.from(e.dataTransfer.files);
              if (dropped.length) setFiles(prev => mergeFiles(prev, dropped));
            }}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.csv,.json,.xlsx,.xls,.txt"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={{ fontSize: 40, marginBottom: 10, lineHeight: 1 }}>
              {dragOver ? '📂' : '☁️'}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, marginBottom: 4 }}>
              {files.length > 0 ? '+ Add more files' : 'Click here or drag & drop files'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              PDF · DOC · DOCX · CSV · JSON · XLSX · TXT &nbsp;·&nbsp; max 10 MB each
            </div>
          </label>

          {/* Uploaded file list */}
          {files.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map(f => {
                const ext = f.name.split('.').pop().toLowerCase();
                const icon = ext === 'pdf' ? '📕' : ['xlsx','xls'].includes(ext) ? '📊' : ext === 'csv' ? '📋' : ext === 'json' ? '📦' : ['doc','docx'].includes(ext) ? '📝' : '📄';
                return (
                  <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{(f.size / 1024).toFixed(1)} KB · {ext.toUpperCase()}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFiles(prev => prev.filter(x => x.name !== f.name)); setExtractedFields(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: '2px 4px', borderRadius: 4, flexShrink: 0 }}
                    >×</button>
                  </div>
                );
              })}

              {/* ── STEP 1: Extract button ── */}
              <div style={{ marginTop: 6, padding: '14px 16px', borderRadius: 10, background: 'var(--card-bg2)', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                  📄 Step 1: Extract fields from document
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Reads your document and pulls out product name, description, features, strengths, competitors, and more.
                </div>
                <button
                  type="button"
                  disabled={isExtracting || isAiFilling}
                  onClick={handleExtractFromFile}
                  style={{
                    padding: '10px 24px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                    cursor: (isExtracting || isAiFilling) ? 'not-allowed' : 'pointer',
                    background: isExtracting ? 'var(--card-border)' : 'var(--blue)',
                    color: isExtracting ? 'var(--text-muted)' : '#fff',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {isExtracting
                    ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> Extracting from document...</>
                    : '📄 Extract from Document'}
                </button>
              </div>

              {/* Extraction result */}
              {extractedFields && (
                <div style={{ borderRadius: 10, border: '1.5px solid var(--green)', overflow: 'hidden' }}>
                  {/* Result header */}
                  <div style={{ padding: '10px 16px', background: 'var(--green-lt)', borderBottom: '1px solid var(--green)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>✅ Extraction complete — all fields pre-filled across tabs</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Review each tab to see the extracted data. Use AI Fill to complete any missing fields.</div>
                  </div>
                  {/* Extracted field badges */}
                  <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {extractedFields.productName    && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--green)', color: 'var(--text)', fontWeight: 600 }}>📛 {extractedFields.productName}</span>}
                    {extractedFields.category       && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--blue)', color: 'var(--text)', fontWeight: 600 }}>🗂 {extractedFields.category}</span>}
                    {extractedFields.deployment     && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--purple)', color: 'var(--text)', fontWeight: 600 }}>☁ {extractedFields.deployment}</span>}
                    {extractedFields.targetUsers    && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--blue)', color: 'var(--text)', fontWeight: 600 }}>👥 {extractedFields.targetUsers}</span>}
                    {extractedFields.gartnerMQ      && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--orange)', color: 'var(--text)', fontWeight: 600 }}>📊 Gartner: {extractedFields.gartnerMQ}</span>}
                    {extractedFields.description    && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {extractedFields.description}</span>}
                    {(extractedFields.keyFeatures        || []).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--blue-lt)',   border: '1px solid var(--blue)',   color: 'var(--blue)',   fontWeight: 700 }}>⚡ {extractedFields.keyFeatures.length} features</span>}
                    {(extractedFields.strengths          || []).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--green-lt)', border: '1px solid var(--green)', color: 'var(--green)', fontWeight: 700 }}>✅ {extractedFields.strengths.length} strengths</span>}
                    {(extractedFields.weaknesses         || []).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#ff5a5a11', border: '1px solid #ff5a5a44', color: '#ff5a5a', fontWeight: 700 }}>⚠ {extractedFields.weaknesses.length} weaknesses</span>}
                    {(extractedFields.competitors        || []).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--orange-lt)', border: '1px solid var(--orange)', color: 'var(--orange)', fontWeight: 700 }}>⚔ {extractedFields.competitors.length} competitors</span>}
                    {(extractedFields.discoveryQuestions || []).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--blue-lt)',   border: '1px solid var(--blue)',   color: 'var(--blue)',   fontWeight: 700 }}>❓ {extractedFields.discoveryQuestions.length} questions</span>}
                    {(extractedFields.objectionHandling  || []).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--orange-lt)', border: '1px solid var(--orange)', color: 'var(--orange)', fontWeight: 700 }}>🛡 {extractedFields.objectionHandling.length} objections</span>}
                    {(extractedFields.caseStudies        || []).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--purple-lt)', border: '1px solid var(--purple)', color: 'var(--purple)', fontWeight: 700 }}>📖 {extractedFields.caseStudies.length} case studies</span>}
                    {(extractedFields.keyCustomers       || []).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--green-lt)', border: '1px solid var(--green)', color: 'var(--green)', fontWeight: 700 }}>🏢 {extractedFields.keyCustomers.length} customers</span>}
                    {extractedFields.featureMatrix?.rows?.length > 0       && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--purple-lt)', border: '1px solid var(--purple)', color: 'var(--purple)', fontWeight: 700 }}>📊 {extractedFields.featureMatrix.rows.length} matrix rows</span>}
                    {extractedFields.winLoss?.topMessages?.length > 0      && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--blue-lt)',   border: '1px solid var(--blue)',   color: 'var(--blue)',   fontWeight: 700 }}>🏆 win/loss data</span>}
                    {extractedFields.aiCoach?.customerSays                  && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--card-bg2)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', fontWeight: 600 }}>🤖 AI coach</span>}
                  </div>

                  {/* ── STEP 2: AI Fill ── */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                      ✨ Step 2: AI fills any missing fields
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                      {(!productName.trim() || !practice)
                        ? '⚠️ Go to Basic Info tab first and set Product Name + Practice, then come back here.'
                        : `Will use AI to complete any fields not found in the document for "${productName}" in ${practice}.`}
                    </div>
                    <button
                      type="button"
                      disabled={isAiFilling || isExtracting || !productName.trim() || !practice}
                      onClick={handleAiFillMissing}
                      style={{
                        padding: '10px 24px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                        cursor: (isAiFilling || isExtracting || !productName.trim() || !practice) ? 'not-allowed' : 'pointer',
                        background: isAiFilling ? 'var(--card-border)' : (!productName.trim() || !practice) ? '#aaa' : 'var(--purple)',
                        color: (isAiFilling || !productName.trim() || !practice) ? 'var(--text-muted)' : '#fff',
                        display: 'flex', alignItems: 'center', gap: 8,
                        opacity: (!productName.trim() || !practice) ? 0.6 : 1,
                      }}
                    >
                      {isAiFilling
                        ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> AI is filling missing details...</>
                        : '✨ AI Fill Missing Details'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text-dim)', paddingLeft: 2, marginTop: 4 }}>
                After reviewing all filled fields → click <strong>💾 Save Product</strong> above
              </div>
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Bottom save button */}
      <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
        <button type="button" onClick={handleSave} disabled={saving || filling} style={{
          flex: 1, padding: '13px 0', borderRadius: 9, border: 'none', cursor: saving || filling ? 'not-allowed' : 'pointer',
          background: saving ? 'var(--card-border)' : isEditing ? 'var(--green)' : 'var(--blue)',
          color: saving ? 'var(--text-muted)' : '#fff', fontSize: 14, fontWeight: 800, opacity: saving ? 0.7 : 1,
        }}>{saving ? '⏳ Saving...' : isEditing ? '💾 Save Changes to Existing Product' : '💾 Save New Product'}</button>
        <button type="button" onClick={handleAiFill} disabled={saving || filling} style={{
          flex: 1, padding: '13px 0', borderRadius: 9, border: 'none', cursor: saving || filling ? 'not-allowed' : 'pointer',
          background: filling ? 'var(--card-border)' : 'var(--purple)',
          color: filling ? 'var(--text-muted)' : '#fff', fontSize: 14, fontWeight: 800, opacity: filling ? 0.7 : 1,
        }}>{filling ? '⏳ Generating...' : '✨ AI Generate & Preview'}</button>
      </div>
    </div>
  );
}
