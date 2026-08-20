import React from 'react';

function WinPie({ competitors }) {
  const r = 44, cx = 55, cy = 55, sw = 18;
  const total = competitors.reduce((s, c) => s + c.wins, 0);
  let offset = 0;
  const circ = 2 * Math.PI * r;
  const segments = competitors.map((c) => {
    const pct = c.wins / total;
    const seg = { ...c, dashArray: `${pct * circ} ${circ}`, offset };
    offset += pct * circ;
    return seg;
  });
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--card-border)" strokeWidth={sw} />
      {segments.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth={sw}
          strokeDasharray={s.dashArray}
          strokeDashoffset={-s.offset + circ * 0.25}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

function WinRateDonut({ rate }) {
  const r = 44, cx = 55, cy = 55, sw = 10;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 110, height: 110 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--card-border)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--blue)" strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{rate}%</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Win Rate</span>
      </div>
    </div>
  );
}

export default function WinLossPage({ data }) {
  if (!data) return null;
  const { winLoss } = data;
  if (!winLoss) return null;
  const { total, won, lost, winRate, competitors, topMessages } = winLoss;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Win / Loss Intelligence</div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { num: total,         label: 'Total Opportunities', color: 'var(--text)' },
          { num: won,           label: `Won (${winRate}%)`,   color: 'var(--green)' },
          { num: lost,          label: `Lost (${100 - winRate}%)`, color: 'var(--red)' },
          { num: `${winRate}%`, label: 'Win Rate',            color: 'var(--blue)' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.num}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">WINS BY COMPETITOR</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <WinPie competitors={competitors || []} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(competitors || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ color: c.color, fontSize: 16 }}>●</span>
                  <span>{c.label}</span>
                  <span style={{ fontWeight: 800, marginLeft: 4 }}>{c.wins}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({c.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">TOP WINNING MESSAGES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {(topMessages || []).map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', alignItems: 'center', background: 'rgba(255,255,255,.03)', border: '1px solid var(--card-border)', borderRadius: 8 }}>
                <span style={{ background: 'var(--blue)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{m}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <WinRateDonut rate={winRate} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Overall Win Rate</div>
              <div style={{ background: 'var(--tco-track)', borderRadius: 6, height: 12, width: 160, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${winRate}%`, height: '100%', background: 'var(--green)', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', width: 160 }}>
                <span>{won} Won</span><span>{lost} Lost</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
