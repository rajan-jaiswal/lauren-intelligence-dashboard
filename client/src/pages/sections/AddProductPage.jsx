import { useState, useRef, useEffect } from 'react';
import { useSSE } from '../../hooks/useSSE.js';
import { uploadProduct, generateCompetitor, verifyPin, fetchProduct, extractFromFile } from '../../api/products.js';
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

// ─── AI Data Preview Card ─────────────────────────────────────────────────────
// Shows the AI-generated data and lets user confirm before saving to DB
function PreviewCard({ previewData, onSave, onDiscard, isSaving }) {
  const ov = previewData?.overview || {};
  const features = (previewData?.keyFeatures || []).slice(0, 6);
  const strengths = (previewData?.strengths || []).slice(0, 4);
  const weaknesses = (previewData?.weaknesses || []).slice(0, 3);

  return (
    <div style={{
      border: '2px solid var(--blue)',
      borderRadius: 12,
      background: 'var(--card-bg)',
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--blue)', padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{ov.logo || '📦'}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
              AI Generated Preview — {previewData?.product || ov.name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginTop: 1 }}>
              Review the data below, then click Save to Dashboard to publish
            </div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,.2)', padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5 }}>
          NOT SAVED YET
        </span>
      </div>

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Overview */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Product Overview</div>
          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, background: 'var(--card-bg2)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--card-border)' }}>
            {ov.description || 'No description generated.'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {ov.category && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: 'var(--blue-lt)', color: 'var(--blue)', border: '1px solid var(--blue)', fontWeight: 700 }}>{ov.category}</span>}
            {ov.deployment && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: 'var(--purple-lt)', color: 'var(--purple)', border: '1px solid var(--purple)', fontWeight: 700 }}>{ov.deployment}</span>}
            {ov.marketPosition && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: 'var(--green-lt)', color: 'var(--green)', border: '1px solid var(--green)', fontWeight: 700 }}>{ov.marketPosition}</span>}
          </div>
        </div>

        {/* Features + Strengths + Weaknesses side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {features.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Key Features ({(previewData?.keyFeatures || []).length} total)</div>
              {features.map((f, i) => (
                <div key={i} style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--blue)', fontWeight: 800, flexShrink: 0 }}>→</span>
                  <span>{f.name || f}</span>
                </div>
              ))}
              {(previewData?.keyFeatures || []).length > 6 && (
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 3 }}>+{(previewData.keyFeatures.length - 6)} more...</div>
              )}
            </div>
          )}
          {strengths.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Strengths</div>
              {strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 800, flexShrink: 0 }}>✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Weaknesses</div>
              {weaknesses.map((w, i) => (
                <div key={i} style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 800, flexShrink: 0 }}>×</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Win/Loss quick stats */}
        {previewData?.winLoss?.winRate > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Win Rate', val: `${previewData.winLoss.winRate}%`, color: 'var(--blue)' },
              { label: 'Won', val: previewData.winLoss.won, color: 'var(--green)' },
              { label: 'Lost', val: previewData.winLoss.lost, color: 'var(--red)' },
              { label: 'Total Opps', val: previewData.winLoss.total, color: 'var(--text-muted)' },
            ].map((k) => (
              <div key={k.label} style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, background: 'var(--card-bg2)', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 4, borderTop: '1px solid var(--card-border)' }}>
          <button
            type="button"
            disabled={isSaving}
            onClick={onSave}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 9, border: 'none',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              background: isSaving ? 'var(--card-border)' : '#2dca6e',
              color: isSaving ? 'var(--text-muted)' : '#fff',
              fontSize: 14, fontWeight: 800, letterSpacing: 0.3,
              transition: 'all .15s',
            }}
          >
            {isSaving ? '⏳ Saving to Dashboard...' : '💾 Save to Dashboard'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onDiscard}
            style={{
              padding: '13px 22px', borderRadius: 9,
              border: '1px solid var(--card-border)',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              background: 'var(--card-bg2)', color: 'var(--text-muted)',
              fontSize: 13, fontWeight: 600,
            }}
          >
            Discard & Edit
          </button>
        </div>
      </div>
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
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // PDF extraction state
  const [isExtracting, setIsExtracting]   = useState(false);
  const [extractError, setExtractError]   = useState('');
  const [extractedFields, setExtractedFields] = useState(null); // preview of what PDF gave us

  // AI fill state
  const [isAiFilling, setIsAiFilling]     = useState(false);
  const [aiFillJobId, setAiFillJobId]     = useState(null);
  const [aiFillDone, setAiFillDone]       = useState(false);

  // Generation / submission state
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [progress, setProgress]           = useState(null);
  const [competitorStates, setCompetitorStates] = useState({});
  const [formError, setFormError]         = useState('');

  // Preview state — AI generated data waiting for user confirmation to save
  const [previewData, setPreviewData]     = useState(null);  // holds the AI result
  const [isSavingPreview, setIsSavingPreview] = useState(false);

  // Success state
  const [success, setSuccess]             = useState(null);

  const submittedRef    = useRef(null);
  const sseReceivedRef  = useRef(false);
  const tickTimerRef    = useRef(null);
  const pollTimerRef    = useRef(null);

  // ── Client-side fake progress ticks ─────────────────────────────────────────
  function startFakeTicks(startPercent) {
    clearInterval(tickTimerRef.current);
    let pct = startPercent;
    tickTimerRef.current = setInterval(() => {
      pct = Math.min(pct + 2, 68);
      setProgress(prev => {
        if (!prev || prev.percent < pct) {
          return { percent: pct, stage: prev?.stage || 'calling_gemini', message: prev?.message || 'AI is generating your product data...' };
        }
        return prev;
      });
    }, 3000);
  }

  function stopFakeTicks() {
    clearInterval(tickTimerRef.current);
    tickTimerRef.current = null;
  }

  // ── DB poll fallback ─────────────────────────────────────────────────────────
  function startPollFallback() {
    clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(async () => {
      if (!submittedRef.current || previewData) return;
      try {
        const doc = await fetchProduct(submittedRef.current.practice, submittedRef.current.product);
        if (doc) {
          stopFakeTicks();
          setProgress({ percent: 100, stage: 'complete', message: 'AI generation complete! (SSE fallback)' });
          setIsSubmitting(false);
          setPreviewData(doc);
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
    }, 3 * 60 * 1000);
  }

  useEffect(() => () => { stopFakeTicks(); clearTimeout(pollTimerRef.current); }, []);

  // ── SSE event handlers ───────────────────────────────────────────────────────
  useSSE({
    ai_progress: (data) => {
      sseReceivedRef.current = true;
      stopFakeTicks();
      setProgress(data);

      // If this is an ai-fill progress event, track it
      if (aiFillJobId && data.jobId === aiFillJobId) {
        if (data.stage === 'complete') {
          setIsAiFilling(false);
          setAiFillDone(true);
          setAiFillJobId(null);
        } else if (data.stage === 'error') {
          setIsAiFilling(false);
          setAiFillJobId(null);
          setFormError('AI fill failed: ' + (data.message || 'Unknown error'));
        }
      }
    },
    product_added: (data) => {
      sseReceivedRef.current = true;
      stopFakeTicks();
      clearTimeout(pollTimerRef.current);

      if (isAiFilling || aiFillJobId) {
        // This is the ai-fill completing — reload form data
        setIsAiFilling(false);
        setAiFillJobId(null);
        setAiFillDone(true);
        return;
      }

      // Main product generation completed — show preview instead of navigating
      setIsSubmitting(false);
      setProgress({ percent: 100, stage: 'complete', message: 'AI generation complete! Review below.' });

      // Fetch the freshly saved doc to show in preview
      if (submittedRef.current) {
        fetchProduct(submittedRef.current.practice, submittedRef.current.product)
          .then(doc => {
            if (doc) setPreviewData(doc);
          })
          .catch(() => {
            // Fallback: just use the SSE data to show a minimal success
            setSuccess({ practice: data.practice, product: data.product });
          });
      }
    },
    competitor_added: (data) => {
      const { competitorName, profile } = data;
      setCompetitorStates((prev) => ({
        ...prev,
        [competitorName]: { status: 'done', profile },
      }));
    },
  });

  // ── PDF/File extraction ──────────────────────────────────────────────────────
  async function handleExtractFromFile() {
    if (!files.length || !pin) return;
    // Only use the first file for extraction (the primary product document)
    const file = files[0];
    setIsExtracting(true);
    setExtractError('');
    setExtractedFields(null);

    try {
      const result = await extractFromFile(file, pin);
      const d = result.data || {};

      // Pre-fill form fields only if not already filled
      if (d.productName && !productName) setProductName(d.productName);
      if (d.description && !description) setDescription(d.description);

      // Add any extracted competitors not already in list
      if (Array.isArray(d.competitors) && d.competitors.length) {
        const newComps = d.competitors.filter(c => c && !competitors.includes(c));
        if (newComps.length) setCompetitors(prev => [...prev, ...newComps]);
      }

      // Store extracted fields to show in a "what we found" panel
      setExtractedFields(d);
    } catch (err) {
      setExtractError(err?.response?.data?.error || err.message || 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  }

  // ── Competitor tag added → immediately trigger AI generation ────────────────
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

  // ── File drop zone ───────────────────────────────────────────────────────────
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => mergeFiles(prev, dropped));
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files);
    if (selected.length) setFiles((prev) => mergeFiles(prev, selected));
    e.target.value = '';
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    // Clear extracted fields if the source file is removed
    if (extractedFields) setExtractedFields(null);
  }

  function mergeFiles(existing, incoming) {
    const names = new Set(existing.map((f) => f.name));
    return [...existing, ...incoming.filter((f) => !names.has(f.name))];
  }

  // ── Main AI generation submit ────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!productName.trim()) { setFormError('Product name is required.'); return; }
    setFormError('');
    setPreviewData(null);
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
      startFakeTicks(5);
      startPollFallback();
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

  // ── "Fill Missing Details with AI" ──────────────────────────────────────────
  // Triggers ai-fill on the already-saved product (from previewData) or by name
  async function handleAiFill() {
    const targetProduct = previewData?.product || productName.trim();
    const targetPractice = previewData?.practice || practice;
    if (!targetProduct) return;

    setIsAiFilling(true);
    setAiFillDone(false);
    setFormError('');

    try {
      const { aiFillProduct } = await import('../../api/products.js');
      const result = await aiFillProduct({
        productId: previewData?._id || undefined,
        practice: targetPractice,
        product: targetProduct,
        competitors: competitors.join(','),
      }, pin);
      setAiFillJobId(result.jobId);
    } catch (err) {
      setIsAiFilling(false);
      setFormError(err?.response?.data?.error || err.message || 'AI fill failed');
    }
  }

  // ── Save preview to dashboard ────────────────────────────────────────────────
  // The data is already in DB (saved by the upload route) — this just
  // navigates the dashboard to show it
  function handleSavePreview() {
    if (!previewData) return;
    setIsSavingPreview(true);
    // Small delay for button feedback
    setTimeout(() => {
      onProductAdded(previewData.practice, previewData.product);
    }, 300);
  }

  // ── Discard preview — go back to editing the same form ──────────────────────
  function handleDiscardPreview() {
    setPreviewData(null);
    setProgress(null);
    setAiFillDone(false);
  }

  // ── PIN unlock handler ───────────────────────────────────────────────────────
  function handleUnlock(enteredPin) {
    setPinError('');
    setPin(enteredPin);
    if (onPinSet) onPinSet(enteredPin);
  }

  // ─── PIN gate ────────────────────────────────────────────────────────────────
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

  // ─── Success screen (shown after "Save to Dashboard" is clicked) ─────────────
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
                setCompetitors([]); setCompetitorStates({}); setFiles([]);
                setProgress(null); setExtractedFields(null); setAiFillDone(false);
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

  // ─── Main Form ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 32, maxWidth: 820, margin: '0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>➕ Product Data Engine</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Upload a PDF to extract product data, then use AI to fill any missing fields. Review the preview before saving to the dashboard.
        </div>
      </div>

      {/* ── AI Preview — shown once AI finishes, before saving ───────────────── */}
      {previewData && (
        <PreviewCard
          previewData={previewData}
          onSave={handleSavePreview}
          onDiscard={handleDiscardPreview}
          isSaving={isSavingPreview}
        />
      )}

      {/* ── AI Fill done banner ────────────────────────────────────────────── */}
      {aiFillDone && !previewData && (
        <div style={{
          padding: '12px 18px', borderRadius: 9, background: 'var(--green-lt)',
          border: '1px solid var(--green)', color: 'var(--green)', fontSize: 13,
          fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 9,
        }}>
          ✅ AI has filled missing fields. Click "Generate with AI" again to regenerate full intelligence, or proceed to save.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* ── Section A — Product Info ──────────────────────────────────── */}
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
                    Product Description{' '}
                    <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — AI fills in if blank)</span>
                    {extractedFields?.description && (
                      <span style={{ marginLeft: 8, color: 'var(--green)', fontSize: 10, fontWeight: 800 }}>📄 Extracted from PDF</span>
                    )}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe what this product does, who it's for, and key differentiators..."
                    rows={3}
                    style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 13,
                      border: extractedFields?.description ? '1px solid var(--green)' : '1px solid var(--card-border)',
                      background: 'var(--card-bg2)', color: 'var(--text)', outline: 'none',
                      resize: 'vertical', fontFamily: 'var(--font)',
                    }}
                  />
                </div>
              </div>

              {/* Extracted fields summary */}
              {extractedFields && (
                <div style={{
                  marginTop: 16, padding: '12px 16px', borderRadius: 9,
                  background: 'var(--green-lt)', border: '1px solid var(--green)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)', marginBottom: 8 }}>
                    📄 Extracted from PDF — fields pre-filled:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {extractedFields.productName && (
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--green)', color: 'var(--text)', fontWeight: 600 }}>
                        Name: {extractedFields.productName}
                      </span>
                    )}
                    {extractedFields.category && (
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--blue)', color: 'var(--text)', fontWeight: 600 }}>
                        Category: {extractedFields.category}
                      </span>
                    )}
                    {extractedFields.deployment && (
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--purple)', color: 'var(--text)', fontWeight: 600 }}>
                        Deployment: {extractedFields.deployment}
                      </span>
                    )}
                    {(extractedFields.keyFeatures || []).length > 0 && (
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--blue)', color: 'var(--blue)', fontWeight: 700 }}>
                        {extractedFields.keyFeatures.length} features found
                      </span>
                    )}
                    {(extractedFields.strengths || []).length > 0 && (
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--green)', color: 'var(--green)', fontWeight: 700 }}>
                        {extractedFields.strengths.length} strengths found
                      </span>
                    )}
                    {(extractedFields.competitors || []).length > 0 && (
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--orange)', color: 'var(--orange)', fontWeight: 700 }}>
                        {extractedFields.competitors.length} competitors added
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                    Missing fields will be filled by AI when you click "Generate with AI &amp; Save"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section B — Competitors ───────────────────────────────────── */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <div className="card-title" style={{ marginBottom: 6 }}>
                ⚔️ Section B — Competitor Names
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                Type a competitor name and press{' '}
                <kbd style={{ padding: '1px 5px', borderRadius: 4, border: '1px solid var(--card-border)', fontSize: 11 }}>Enter</kbd>
                {' '}— AI generates their profile instantly.
              </div>

              <TagInput
                tags={competitors}
                onAdd={handleAddCompetitor}
                onRemove={handleRemoveCompetitor}
                placeholder="Type competitor name and press Enter..."
              />

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

          {/* ── Section C — File Upload ───────────────────────────────────── */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <div className="card-title" style={{ marginBottom: 6 }}>
                📎 Section C — Upload Product Data{' '}
                <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-dim)' }}>Optional</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                Upload a <strong style={{ color: 'var(--text)' }}>PDF, CSV, JSON, Excel, or plain text</strong> file.
                Click <strong style={{ color: 'var(--blue)' }}>"Extract from PDF"</strong> to pull data into the form.
                AI will fill any remaining missing fields during generation.
              </div>

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
                    PDF · CSV · JSON · XLSX · TXT &nbsp;·&nbsp; Max 10 MB each
                  </div>
                </div>
              </div>

              {/* File list */}
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

                  {/* Extract button row */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={handleExtractFromFile}
                      style={{
                        padding: '9px 20px', borderRadius: 8, border: 'none',
                        cursor: isExtracting ? 'not-allowed' : 'pointer',
                        background: isExtracting ? 'var(--card-border)' : 'var(--blue)',
                        color: isExtracting ? 'var(--text-muted)' : '#fff',
                        fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
                        transition: 'all .15s',
                      }}
                    >
                      {isExtracting
                        ? <><span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> Extracting...</>
                        : '📄 Extract from PDF'}
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Pulls product data from the file into the form fields above
                    </span>
                  </div>

                  {extractError && (
                    <div style={{ fontSize: 12, color: '#ff5a5a', padding: '7px 12px', borderRadius: 7, background: '#ff5a5a18', border: '1px solid #ff5a5a44' }}>
                      {extractError}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--text-dim)', paddingLeft: 2 }}>
                    {files.length} file{files.length > 1 ? 's' : ''} attached — all will be sent to AI for additional context
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Progress ──────────────────────────────────────────────────────── */}
        {isSubmitting && progress && (
          <div className="card" style={{ padding: '20px 28px', marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>🤖 AI Generation in Progress</div>
            <ProgressBar percent={progress.percent || 0} stage={progress.stage} message={progress.message} />
          </div>
        )}

        {/* ── AI Fill progress ───────────────────────────────────────────────── */}
        {isAiFilling && progress && (
          <div className="card" style={{ padding: '16px 22px', marginBottom: 20, border: '1px solid var(--purple)', background: 'var(--purple-lt)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>✨ AI Filling Missing Fields...</div>
            <ProgressBar percent={progress.percent || 10} stage={progress.stage} message={progress.message} />
          </div>
        )}

        {/* Error */}
        {formError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#ff5a5a18', border: '1px solid #ff5a5a44', color: '#ff5a5a', fontSize: 13, marginBottom: 16 }}>
            {formError}
          </div>
        )}

        {/* ── Action button row ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Main generate button */}
          <button
            type="submit"
            disabled={isSubmitting || isAiFilling}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 10, border: 'none',
              cursor: (isSubmitting || isAiFilling) ? 'not-allowed' : 'pointer',
              background: (isSubmitting || isAiFilling) ? 'var(--card-border)' : 'var(--blue)',
              color: (isSubmitting || isAiFilling) ? 'var(--text-muted)' : '#fff',
              fontSize: 14, fontWeight: 800, letterSpacing: .5,
              transition: 'all .15s',
            }}
          >
            {isSubmitting ? '⏳ Generating with AI...' : '🚀 Generate with AI'}
          </button>

          {/* Fill missing details with AI — always visible once user has a product name */}
          {(productName.trim() || previewData) && !isSubmitting && (
            <button
              type="button"
              disabled={isAiFilling || isSubmitting}
              onClick={handleAiFill}
              style={{
                padding: '14px 22px', borderRadius: 10, border: '2px solid var(--purple)',
                cursor: (isAiFilling || isSubmitting) ? 'not-allowed' : 'pointer',
                background: isAiFilling ? 'var(--purple-lt)' : 'transparent',
                color: isAiFilling ? 'var(--purple)' : 'var(--purple)',
                fontSize: 13, fontWeight: 800, letterSpacing: 0.3,
                transition: 'all .15s', whiteSpace: 'nowrap',
              }}
            >
              {isAiFilling ? '✨ Filling...' : '✨ Fill Missing Details with AI'}
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-dim)' }}>
          Powered by Google Gemini · Data saved to MongoDB · Review preview before publishing to dashboard
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}
