import React from 'react';

function parseMoney(str) {
  return parseInt((str || '0').replace(/[^0-9]/g, ''), 10) || 0;
}

function TcoBar({ label, value, max, color, amount }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 80, textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ flex: 1, height: 26, background: 'var(--tco-track)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5 }} />
      </div>
      <div style={{ width: 60, fontSize: 13, fontWeight: 700, color }}>{amount}</div>
    </div>
  );
}

export default function TcoComparisonPage({ data }) {
  if (!data) return null;
  const { tcoData } = data;
  if (!tcoData) return null;

  const { labels, rows, totals } = tcoData;
  const L = labels || { product: 'Instana', comp1: 'Datadog', comp2: 'Dynatrace' };
  const max = 800;

  const bars = [
    { label: L.comp1,   val: parseMoney(totals?.comp1),   amount: totals?.comp1,   color: '#a855f7' },
    { label: L.comp2,   val: parseMoney(totals?.comp2),   amount: totals?.comp2,   color: '#3b82d4' },
    { label: L.product, val: parseMoney(totals?.product), amount: totals?.product, color: 'var(--green)' },
  ];

  const savings1 = parseMoney(totals?.comp1) - parseMoney(totals?.product);
  const savings2 = parseMoney(totals?.comp2) - parseMoney(totals?.product);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>TCO &amp; Pricing Comparison</div>

      {/* Savings callouts */}
      {(savings1 > 0 || savings2 > 0) && (
        <div className="grid-2">
          {savings1 > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4 }}>TCO Advantage vs {L.comp1}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--green)' }}>${savings1}K Savings</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>over 3 years</div>
            </div>
          )}
          {savings2 > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4 }}>TCO Advantage vs {L.comp2}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--green)' }}>${savings2}K Savings</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>over 3 years</div>
            </div>
          )}
        </div>
      )}

      <div className="grid-2">
        {/* Bar chart */}
        <div className="card">
          <div className="card-title">TOTAL TCO (3 YEARS)</div>
          {bars.map((b, i) => <TcoBar key={i} {...b} max={max} />)}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>$0</span><span>$200K</span><span>$400K</span><span>$600K</span><span>$800K</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Lower is Better</div>
        </div>

        {/* Breakdown table */}
        <div className="card">
          <div className="card-title">TCO BREAKDOWN (3 YEARS)</div>
          <div className="table-scroll-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Cost Component</th>
                <th style={{ textAlign: 'right', color: 'var(--green)' }}>{L.product}</th>
                <th style={{ textAlign: 'right', color: '#a855f7' }}>{L.comp1}</th>
                <th style={{ textAlign: 'right', color: '#3b82d4' }}>{L.comp2}</th>
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((r, i) => (
                <tr key={i}>
                  <td>{r.component}</td>
                  <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 700 }}>{r.product}</td>
                  <td style={{ textAlign: 'right', color: '#a855f7' }}>{r.comp1}</td>
                  <td style={{ textAlign: 'right', color: '#3b82d4' }}>{r.comp2}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 800, borderTop: '2px solid var(--card-border)', paddingTop: 8 }}>TOTAL TCO (3 Years)</td>
                <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 900, borderTop: '2px solid var(--card-border)' }}>{totals?.product}</td>
                <td style={{ textAlign: 'right', color: '#a855f7', fontWeight: 800, borderTop: '2px solid var(--card-border)' }}>{totals?.comp1}</td>
                <td style={{ textAlign: 'right', color: '#3b82d4', fontWeight: 800, borderTop: '2px solid var(--card-border)' }}>{totals?.comp2}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
