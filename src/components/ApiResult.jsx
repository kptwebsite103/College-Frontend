import React from 'react';

export default function ApiResult({ title, loading, error, data }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        {loading ? <div className="muted">Loading…</div> : null}
      </div>

      {error ? (
        <div style={{ marginTop: 10 }} className="error">
          {error.message || String(error)}
        </div>
      ) : null}

      <div style={{ marginTop: 10 }}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
