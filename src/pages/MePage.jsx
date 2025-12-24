import React from 'react';
import ApiResult from '../components/ApiResult.jsx';
import { me } from '../api/auth.js';
import { setAuth, getRefreshToken, getStoredUser } from '../state/auth.js';
import { apiRequest } from '../api/http.js';

export default function MePage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  async function run() {
    setLoading(true);
    setError(null);

    try {
      const res = await me();
      setData(res);

      const existingUser = getStoredUser();
      if (!existingUser && res && typeof res === 'object') {
        setAuth({ user: res });
      }
    } catch (e) {
      setError(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function doRefresh() {
    setLoading(true);
    setError(null);
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token found. Login again.');
      const res = await apiRequest('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      setAuth(res);
      await run();
    } catch (e) {
      setError(e);
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
        <button onClick={run} disabled={loading}>Reload /api/me</button>
        <button className="secondary" onClick={doRefresh} disabled={loading}>Refresh token</button>
      </div>

      <ApiResult title="GET /api/me" loading={loading} error={error} data={data} />
    </div>
  );
}
