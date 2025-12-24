import React from 'react';
import ApiResult from '../components/ApiResult.jsx';
import { listPages } from '../api/resources.js';

export default function PagesPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await listPages();
      setData(res);
    } catch (e) {
      setError(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
  }, []);

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button onClick={run} disabled={loading}>Reload pages</button>
      </div>
      <ApiResult title="GET /api/pages" loading={loading} error={error} data={data} />
    </div>
  );
}
