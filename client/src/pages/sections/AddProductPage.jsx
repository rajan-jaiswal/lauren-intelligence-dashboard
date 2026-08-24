import { useState, useRef, useEffect } from 'react';
import { useSSE } from '../../hooks/useSSE.js';
import { uploadProduct, generateCompetitor, verifyPin, fetchProduct } from '../../api/products.js';
import { useData } from '../../context/DataContext.jsx';

// ─── PIN Gate ─────────────────────────────────────────────────────────────────
function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pin.trim()) return;
    setChecking(true);
    setError('');
    try {
      await verifyPin(pin.trim());
      onUnlock(pin.trim());
    } catch {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>🔒 Team Access Required</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, textAlign: 'center' }}>
        Enter your admin PIN to access the Product Data Engine.
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 220 }}>
        <input
          type="password"
          maxLength={20}
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 16, letterSpacing: 6,
            border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
            color: 'var(--text)', textAlign: 'center', outline: 'none',
          }}
          autoFocus
          disabled={checking}
        />
        {error && <div style={{ fontSize: 11, color: '#ff5a5a', textAlign: 'center' }}>{error}</div>}
        <button type="submit" disabled={checking} style={{
          padding: '10px', borderRadius: 8, border: 'none', cursor: checking ? 'not-allowed' : 'pointer',
          background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700, opacity: checking ? 0.7 : 1,
        }}>
          {checking ? 'Verifying…' : 'Unlock →'}
        </button>
      </form>
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('');

  function commit() {
    const val = input.trim().replace(/,$/, '');
    if (val && !tags.includes(val)) onAdd(val);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      padding: '8px 10px', border: '1px solid var(--card-border)', borderRadius: 8,
      background: 'var(--card-bg2)', minHeight: 42,
    }}>
      {tags.map((t) => (
        <span key={t} className="tag-chip">
          {t}
          <button
            type="button"
            onClick={() => onRemove(t)}
            style={{ marginLeft: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 12, lineHeight: 1 }}
          >×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? placeholder : 'Add another...'}
        style={{
          flex: 1, minWidth: 120, border: 'none', outline: 'none',
          background: 'transparent', color: 'var(--text)', fontSize: 13,
        }}
      />
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ percent, stage, message }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{message || 'Processing...'}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{percent}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: .5 }}>
        {stage}
      </div>
    </div>
  );
}

// ─── Competitor Card (live generated) ────────────────────────────────────────
function CompetitorCard({ name, status, profile, jobId, progress }) {
  const isGenerating = status === 'generating';
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <div style={{
      border: `1px solid ${isDone ? '#2dca6e33' : isError ? '#ff5a5a33' : 'var(--card-border)'}`,
      borderRadius: 10, padding: '14px 16px', background: 'var(--card-bg2)',
      transition: 'border-color .3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
          {profile?.logo || '🏢'} {name}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: isDone ? '#2dca6e22' : isError ? '#ff5a5a22' : '#3b82d422',
          color: isDone ? '#2dca6e' : isError ? '#ff5a5a' : '#3b82d4',
        }}>
          {isDone ? '✓ Generated' : isError ? 'Error' : isGenerating ? 'Generating...' : 'Pending'}
        </div>
      </div>

      {isGenerating && progress && (
        <ProgressBar percent={progress.percent || 20} stage={progress.stage} message={progress.message} />
      )}

      {isDone && profile && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Position:</span> {profile.marketPosition}
          </div>
          <div style={{ marginBottom: 4 }}>{profile.overview}</div>
          {profile.pricingSummary && (
            <div style={{ fontSize: 11, color: 'var(--blue)' }}>💰 {profile.pricingSummary}</div>
          )}
        </div>
      )}

      {isError && (
        <div style={{ fontSize: 12, color: '#ff5a5a' }}>Failed to generate profile. Will retry on save.</div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddProductPage({ practice: defaultPractice, pin: externalPin, onPinSet, onProductAdded }) {
  // Use externally cached PIN if already unlocked (shared across admin pages)
  const [pin, setPin] = useState(externalPin || null);
  const { practices } = useData();
  const practiceOptions = Object.keys(practices).length ? Object.keys(practices) : ['IBM', 'AWS'];
  const [pinError, setPinError] = useState('');

  // Form fields
  const [productName, setProductName] = useState('');
  const [practice, setPractice] = useState(defaultPractice || 'IBM');
  const [description, setDescription] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [files, setFiles] = useState([]);   // multiple files
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Generation state
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [progress, setProgress]             = useState(null);
  const [competitorStates, setCompetitorStates] = useState({});
  const [success, setSuccess]               = useState(null);
  const [formError, setFormError]           = useState('');
  const submittedRef    = useRef(null);   // { practice, product } set on submit
  const sseReceivedRef  = useRef(false);  // flips true when first SSE event arrives
  const tickTimerRef    = useRef(null);   // client-side fake progress ticker
  const pollTimerRef    = useRef(null);   // DB-poll fallback timer

  // ── Client-side fake progress animation ──────────────────────────────────
  // Smoothly nudges the bar forward so it never looks frozen, even before
  // the first SSE event arrives from Render.
  function startFakeTicks(startPercent) {
    clearInterval(tickTimerRef.current);
    let pct = startPercent;
    tickTimerRef.current = setInterval(() => {
      pct = Math.min(pct + 2, 68); // never exceed 68 — real events take it to 70+
      setProgress(prev => {
        // Only update if real SSE hasn't overtaken our fake value
        if (!prev || prev.percent < pct) {
          return { percent: pct, stage: prev?.stage || 'calling_gemini', message: prev?.message || 'AI is generating your product data...' };
        }
        return prev;
      });
    }, 3000); // +2% every 3 s
  }

  function stopFakeTicks() {
    clearInterval(tickTimerRef.current);
    tickTimerRef.current = null;
  }

  // ── DB poll fallback — if SSE never fires (network issue), check DB directly ─
  // After 3 minutes we assume SSE silently dropped and check if the product
  // was actually saved to the DB. If yes, treat it as success.
  function startPollFallback() {
    clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(async () => {
      if (!submittedRef.current || success) return;
      try {
        const doc = await fetchProduct(submittedRef.current.practice, submittedRef.current.product);
        if (doc) {
          stopFakeTicks();
          setProgress({ percent: 100, stage: 'complete', message: 'Product saved! (SSE fallback)' });
          setIsSubmitting(false);
          setSuccess({ practice: doc.practice, product: doc.product });
        } else {
          setFormError('Generation is taking longer than expected. Please check Manage Practices in a minute.');
          setIsSubmitting(false);
          stopFakeTicks();
        }
      } catch (_) {
        setFormError('Could not verify generation status. Check Manage Practices page.');
        setIsSubmitting(false);
        stopFakeTicks();
      }
    }, 3 * 60 * 1000); // 3 minutes
  }

  // Cleanup timers on unmount
  useEffect(() => () => { stopFakeTicks(); clearTimeout(pollTimerRef.current); }, []);

  // SSE event handlers
  useSSE({
    ai_progress: (data) => {
      sseReceivedRef.current = true;
      stopFakeTicks(); // real event arrived — stop fake ticks
      setProgress(data);
    },
    product_added: (data) => {
      sseReceivedRef.current = true;
      stopFakeTicks();
      clearTimeout(pollTimerRef.current);
      setIsSubmitting(false);
      setSuccess({ practice: data.practice, product: data.product });
    },
    competitor_added: (data) => {
      const { competitorName, profile } = data;
      setCompetitorStates((prev) => ({
        ...prev,
        [competitorName]: { status: 'done', profile },
      }));
    },
  });

  // ── Competitor tag added → immediately trigger AI generation ──────────────
  async function handleAddCompetitor(name) {
    if (!pin) return;
    setCompetitors((prev) => [...prev, name]);
    setCompetitorStates((prev) => ({
      ...prev,
      [name]: { status: 'generating', profile: null },
    }));

    try {
      const { jobId } = await generateCompetitor(name, productName || 'New Product', practice, pin);
      setCompetitorStates((prev) => ({
        ...prev,
        [name]: { ...prev[name], jobId },
      }));
    } catch (err) {
      setCompetitorStates((prev) => ({
        ...prev,
        [name]: { status: 'error', profile: null },
      }));
    }
  }

  function handleRemoveCompetitor(name) {
    setCompetitors((prev) => prev.filter((c) => c !== name));
    setCompetitorStates((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  // ── File drop zone — multiple files ──────────────────────────────────────
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => mergeFiles(prev, dropped));
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files);
    if (selected.length) setFiles((prev) => mergeFiles(prev, selected));
    // reset input so the same file can be re-added after removal
    e.target.value = '';
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  // merge without duplicates (by name)
  function mergeFiles(existing, incoming) {
    const names = new Set(existing.map((f) => f.name));
    return [...existing, ...incoming.filter((f) => !names.has(f.name))];
  }

  // ── Form submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!productName.trim()) { setFormError('Product name is required.'); return; }
    setFormError('');
    sseReceivedRef.current = false;
    submittedRef.current = { practice, product: productName.trim() };
    setIsSubmitting(true);
    setProgress({ percent: 0, stage: 'preparing', message: 'Preparing submission...' });

    const formData = new FormData();
    formData.append('pin', pin);
    formData.append('productName', productName.trim());
    formData.append('practice', practice);
    formData.append('description', description);
    formData.append('competitors', competitors.join(','));
    files.forEach((f) => formData.append('files', f));

    try {
      await uploadProduct(formData);
      // Job accepted (202) — start fake progress ticks and DB-poll safety net
      startFakeTicks(5);
      startPollFallback();
      // Real completion arrives via SSE product_added event
    } catch (err) {
      stopFakeTicks();
      clearTimeout(pollTimerRef.current);
      if (err?.response?.status === 401) {
        setPinError('Incorrect PIN. Please try again.');
        setPin(null);
      } else {
        setFormError(err.message || 'Submission failed. Check server connection.');
      }
      setIsSubmitting(false);
      setProgress(null);
    }
  }

  // ── PIN unlock handler ─────────────────────────────────────────────────────
  function handleUnlock(enteredPin) {
    setPinError('');
    setPin(enteredPin);
    if (onPinSet) onPinSet(enteredPin);   // share with parent so other admin pages don't re-ask
  }

  // ─── PIN gate ──────────────────────────────────────────────────────────────
  if (!pin) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>➕ Product Data Engine</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Add new products, upload data files, and let AI generate complete product intelligence.
          </div>
        </div>
        <PinGate onUnlock={handleUnlock} />
        {pinError && (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#ff5a5a' }}>{pinError}</div>
        )}
      </div>
    );
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{
          background: '#2dca6e18', border: '1px solid #2dca6e44', borderRadius: 12,
          padding: '32px 40px', textAlign: 'center', maxWidth: 520, margin: '60px auto',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#2dca6e', marginBottom: 8 }}>
            {success.product} Added Successfully!
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            AI has generated complete product intelligence and saved it to the database.
            All team members will see this product immediately.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => onProductAdded(success.practice, success.product)}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700,
              }}
            >
              View in Dashboard →
            </button>
            <button
              onClick={() => {
                setSuccess(null); setProductName(''); setDescription('');
                setCompetitors([]); setCompetitorStates({}); setFiles([]); setProgress(null);
              }}
              style={{
                padding: '10px 24px', borderRadius: 8, border: '1px solid var(--card-border)',
                cursor: 'pointer', background: 'var(--card-bg2)', color: 'var(--text)', fontSize: 13,
              }}
            >
              Add Another Product
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 32, maxWidth: 820, margin: '0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>➕ Product Data Engine</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Add a product name and competitors — AI will generate complete intelligence. Upload a file for richer context.
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* ── Section A — Product Info ──────────────────────────────── */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <div className="card-title" style={{ marginBottom: 20 }}>
                🔷 Section A — Product Information
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Product Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .6 }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. IBM Security Verify"
                    required
                    style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 13,
                      border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
                      color: 'var(--text)', outline: 'none',
                    }}
                  />
                </div>

                {/* Practice */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .6 }}>
                    Practice
                  </label>
                  <select
                    value={practice}
                    onChange={(e) => setPractice(e.target.value)}
                    style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 13,
                      border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
                      color: 'var(--text)', outline: 'none',
                    }}
                  >
                    {practiceOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .6 }}>
                    Product Description <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — AI fills in if blank)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe what this product does, who it's for, and key differentiators..."
                    rows={3}
                    style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 13,
                      border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
                      color: 'var(--text)', outline: 'none', resize: 'vertical',
                      fontFamily: 'var(--font)',
                    }}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* ── Section B — Competitors ───────────────────────────────── */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <div className="card-title" style={{ marginBottom: 6 }}>
                ⚔️ Section B — Competitor Names
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                Type a competitor name and press <kbd style={{ padding: '1px 5px', borderRadius: 4, border: '1px solid var(--card-border)', fontSize: 11 }}>Enter</kbd> — AI generates their profile instantly.
              </div>

              <TagInput
                tags={competitors}
                onAdd={handleAddCompetitor}
                onRemove={handleRemoveCompetitor}
                placeholder="Type competitor name and press Enter..."
              />

              {/* Live competitor cards */}
              {competitors.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
                  {competitors.map((name) => (
                    <CompetitorCard
                      key={name}
                      name={name}
                      {...(competitorStates[name] || { status: 'pending' })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Section C — File Upload ───────────────────────────────── */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <div className="card-title" style={{ marginBottom: 6 }}>
                📎 Section C — Upload Product Data <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-dim)' }}>Optional</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                 Upload one or more files — <strong style={{ color: 'var(--text)' }}>PDF, CSV, JSON, Excel, or plain text</strong>. AI reads all files together and uses them as additional context for generation.
               </div>

              {/* Hidden file input — multiple */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".csv,.json,.xlsx,.xls,.txt,.pdf"
                multiple
                onChange={handleFileChange}
              />

              {/* Drop zone */}
              <div
                className={`file-drop-zone${dragOver ? ' drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
                    PDF · CSV · JSON · XLSX · TXT &nbsp;·&nbsp; Multiple files &nbsp;·&nbsp; Max 10 MB each
                  </div>
                </div>
              </div>

              {/* File list — shown below the drop zone */}
              {files.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {files.map((f) => {
                    const ext = f.name.split('.').pop().toLowerCase();
                    const icon = ext === 'pdf' ? '📕' : ext === 'xlsx' || ext === 'xls' ? '📊' : ext === 'csv' ? '📋' : ext === 'json' ? '📦' : '📄';
                    return (
                      <div key={f.name} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 7,
                        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                      }}>
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: '2px 4px',
                          }}
                          title="Remove file"
                        >×</button>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', paddingLeft: 2 }}>
                    {files.length} file{files.length > 1 ? 's' : ''} attached — all will be parsed and sent to AI
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Progress ──────────────────────────────────────────────────── */}
        {isSubmitting && progress && (
          <div className="card" style={{ padding: '20px 28px', marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>🤖 AI Generation in Progress</div>
            <ProgressBar percent={progress.percent || 0} stage={progress.stage} message={progress.message} />
          </div>
        )}

        {/* Error */}
        {formError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#ff5a5a18', border: '1px solid #ff5a5a44', color: '#ff5a5a', fontSize: 13, marginBottom: 16 }}>
            {formError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            background: isSubmitting ? 'var(--card-border)' : 'var(--blue)',
            color: isSubmitting ? 'var(--text-muted)' : '#fff',
            fontSize: 14, fontWeight: 800, letterSpacing: .5,
            transition: 'all .15s',
          }}
        >
          {isSubmitting ? '⏳ Generating with AI...' : '🚀 Generate with AI & Save to Database'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-dim)' }}>
          Powered by Google Gemini 1.5 Flash · Data saved to MongoDB · All team members see updates instantly
        </div>
      </form>
    </div>
  );
}
