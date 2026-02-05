import React from 'react';
import ApiResult from '../components/ApiResult.jsx';
import { listDepartments } from '../api/resources.js';

export default function DepartmentsPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await listDepartments();
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
        <button onClick={run} disabled={loading}>Reload departments</button>
      </div>
      <ApiResult title="GET /api/departments" loading={loading} error={error} data={data} />
    </div>
  );
}
