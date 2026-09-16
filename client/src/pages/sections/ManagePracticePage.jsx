import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { createPractice, fetchProducts, deleteProduct, deletePractice, verifyPin } from '../../api/products.js';
import { useSSE } from '../../hooks/useSSE.js';

const PRACTICE_COLORS = [
  '#4a9eff','#2dca6e','#b47fff','#ff8c42','#ff5a5a','#f5c518','#00c9b1','#e91e8c',
];

function colorForPractice(name, allNames) {
  const idx = allNames.indexOf(name);
  return PRACTICE_COLORS[idx % PRACTICE_COLORS.length];
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--modal-overlay)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 12, padding: '28px 32px', maxWidth: 380, width: '90%',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Confirm Delete</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: '#ff5a5a', color: '#fff', fontSize: 13, fontWeight: 700,
          }}>Delete</button>
          <button onClick={onCancel} style={{
            flex: 1, padding: '9px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
            border: '1px solid var(--card-border)', background: 'var(--card-bg2)', color: 'var(--text)',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Practice Modal ───────────────────────────────────────────────────────
function AddPracticeModal({ pin, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createPractice(name.trim(), pin);
      onCreated(name.trim().toUpperCase());
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--modal-overlay)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 12, padding: '28px 32px', width: 380,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>➕ New Practice</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .6 }}>Practice Name</label>
            <input
              autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Google, Salesforce, Microsoft"
              style={{
                padding: '10px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
                color: 'var(--text)', outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Will be converted to uppercase. Products are added separately.
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#ff5a5a', marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              background: saving ? 'var(--card-border)' : 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700,
            }}>{saving ? 'Creating...' : 'Create Practice'}</button>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '9px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
              border: '1px solid var(--card-border)', background: 'var(--card-bg2)', color: 'var(--text)',
            }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────────
function ProductRow({ doc, pin, onDelete, onEdit, onNavigate }) {
  const [deleting, setDeleting] = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 8,
      background: 'var(--card-bg2)', border: '1px solid var(--card-border)',
      transition: 'border-color .15s',
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{doc.overview?.logo || '📦'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{doc.product}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
          {doc.overview?.category || '—'} · {doc.competitors || 'no competitors yet'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {doc.aiGenerated && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
            background: 'var(--purple-lt)', color: 'var(--purple)',
          }}>AI</span>
        )}
        <button onClick={() => onEdit(doc)} style={{
          padding: '4px 10px', borderRadius: 6, border: '1px solid var(--card-border)',
          background: 'var(--card-bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer', fontWeight: 600,
        }}>Edit</button>
        <button onClick={() => setDeleting(true)} style={{
          padding: '4px 10px', borderRadius: 6, border: '1px solid #ff5a5a33',
          background: '#ff5a5a11', color: '#ff5a5a', fontSize: 11, cursor: 'pointer', fontWeight: 600,
        }}>Delete</button>
      </div>
      {deleting && (
        <ConfirmDialog
          message={`Delete "${doc.product}" from ${doc.practice}? This cannot be undone.`}
          onConfirm={async () => { setDeleting(false); await onDelete(doc._id, doc.practice, doc.product); }}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  );
}

// ─── Practice Card ────────────────────────────────────────────────────────────
function PracticeCard({ practiceName, products, pin, color, onAddProduct, onDelete, onEdit, onDeletePractice }) {
  const [expanded, setExpanded] = useState(true);
  const [deletingPractice, setDeletingPractice] = useState(false);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        borderBottom: expanded ? '1px solid var(--card-border)' : 'none',
        cursor: 'pointer', userSelect: 'none',
      }} onClick={() => setExpanded(v => !v)}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `${color}22`, border: `1.5px solid ${color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color,
        }}>
          {practiceName.slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{practiceName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAddProduct(practiceName); }}
          style={{
            padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: color, color: '#fff', fontSize: 11, fontWeight: 700,
          }}
        >+ Add Product</button>
        <button
          onClick={e => { e.stopPropagation(); setDeletingPractice(true); }}
          style={{
            padding: '5px 10px', borderRadius: 7, border: '1px solid #ff5a5a33',
            background: '#ff5a5a11', color: '#ff5a5a', fontSize: 11, cursor: 'pointer', fontWeight: 700,
          }}
        >🗑 Delete</button>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {deletingPractice && (
        <ConfirmDialog
          message={`Delete practice "${practiceName}" and all ${products.length} product(s) inside it? This cannot be undone.`}
          onConfirm={async () => { setDeletingPractice(false); await onDeletePractice(practiceName); }}
          onCancel={() => setDeletingPractice(false)}
        />
      )}

      {/* Product list */}
      {expanded && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {products.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '8px 4px' }}>
              No products yet. Click "+ Add Product" to add the first one.
            </div>
          ) : (
            products.map(doc => (
              <ProductRow
                key={doc._id}
                doc={doc}
                pin={pin}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── PIN gate (reused) ────────────────────────────────────────────────────────
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
      <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, textAlign: 'center' }}>Enter admin PIN to manage practices and products.</div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManagePracticePage({ pin: externalPin, onPinSet, onAddProduct, onNavigate }) {
  // ALL hooks must be declared unconditionally before any conditional return
  const [pin, setPin]                   = useState(externalPin || null);
  const [allProducts, setAllProducts]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showAddPractice, setShowAddPractice] = useState(false);

  const { practices, addPracticeToList, addProductToList, removeProductFromList, removePracticeFromList } = useData();

  // Load all products once (skip if PIN not yet set — prevents 401 noise)
  useEffect(() => {
    if (!pin) return;
    fetchProducts()
      .then(docs => { setAllProducts(docs); setLoading(false); })
      .catch(() => setLoading(false));
  }, [pin]);   // re-runs when PIN becomes available

  // SSE — refresh on product_added / product_deleted / practice_deleted
  useSSE({
    product_added: ({ practice, product: prod }) => {
      addProductToList(practice, prod);
      fetchProducts().then(setAllProducts);
    },
    product_deleted: ({ productId }) => {
      setAllProducts(prev => prev.filter(d => d._id !== productId));
    },
    practice_deleted: ({ practice: name }) => {
      if (removePracticeFromList) removePracticeFromList(name);
      setAllProducts(prev => prev.filter(d => d.practice !== name));
    },
  });

  // Conditional render — AFTER all hooks
  if (!pin) return <PinGate onUnlock={(p) => { setPin(p); if (onPinSet) onPinSet(p); }} />;

  const practiceNames = Object.keys(practices);

  async function handleDelete(productId, practice, product) {
    try {
      await deleteProduct(productId, pin);
      removeProductFromList(practice, product);
      setAllProducts(prev => prev.filter(d => d._id !== productId));
    } catch (err) {
      alert('Delete failed: ' + (err?.response?.data?.error || err.message));
    }
  }

  async function handleDeletePractice(practiceName) {
    try {
      await deletePractice(practiceName, pin);
      if (removePracticeFromList) removePracticeFromList(practiceName);
      setAllProducts(prev => prev.filter(d => d.practice !== practiceName));
    } catch (err) {
      alert('Delete practice failed: ' + (err?.response?.data?.error || err.message));
    }
  }

  function handlePracticeCreated(name) {
    addPracticeToList(name);
    setShowAddPractice(false);
  }

  const grouped = practiceNames.reduce((acc, name) => {
    acc[name] = allProducts.filter(d => d.practice === name);
    return acc;
  }, {});

  // Practices in DB but not yet in context (e.g. from SSE)
  const extraPractices = [...new Set(allProducts.map(d => d.practice))].filter(p => !practiceNames.includes(p));
  const allNames = [...practiceNames, ...extraPractices];

  return (
    <div style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
            🏢 Manage Practices &amp; Products
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            View all practices, add new ones, add products, or edit/delete existing products.
          </div>
        </div>
        <button
          onClick={() => setShowAddPractice(true)}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}
        >
          + New Practice
        </button>
      </div>

      {/* Stats bar */}
      <div className="mp-stats-bar" style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Practices', value: allNames.length, color: 'var(--blue)' },
          { label: 'Total Products', value: allProducts.length, color: 'var(--green)' },
          { label: 'AI Generated', value: allProducts.filter(d => d.aiGenerated).length, color: 'var(--purple)' },
          { label: 'Manual Entry', value: allProducts.filter(d => !d.aiGenerated).length, color: 'var(--orange)' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, padding: '12px 16px', borderRadius: 10,
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Practice cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
      ) : allNames.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
          No practices yet. Click "+ New Practice" to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {allNames.map(name => (
            <PracticeCard
              key={name}
              practiceName={name}
              products={grouped[name] || allProducts.filter(d => d.practice === name)}
              pin={pin}
              color={colorForPractice(name, allNames)}
              onAddProduct={(p) => onAddProduct(p, pin)}
              onDelete={handleDelete}
              onEdit={(doc) => onNavigate('product-form', { editDoc: doc, defaultPractice: doc.practice })}
              onDeletePractice={handleDeletePractice}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddPractice && (
        <AddPracticeModal
          pin={pin}
          onClose={() => setShowAddPractice(false)}
          onCreated={handlePracticeCreated}
        />
      )}
    </div>
  );
}
