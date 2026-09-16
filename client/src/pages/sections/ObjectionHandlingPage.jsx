import React from 'react';

export default function ObjectionHandlingPage({ data }) {
  if (!data) return null;
  const { objectionHandling } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Objection Handling</div>

      <div className="card">
        <div className="card-title">CUSTOMER OBJECTIONS &amp; RECOMMENDED RESPONSES</div>
        <div className="table-scroll-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Customer Objection</th>
              <th>Recommended Response</th>
            </tr>
          </thead>
          <tbody>
            {(objectionHandling || []).map((item, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4 }}>Objection #{i + 1}</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 12.5 }}>{item.objection}</div>
                </td>
                <td>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 10, height: 10 }}><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
                    Recommended Response
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>{item.response}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
