import React from 'react';
import { getAccessToken, getStoredUser } from '../state/auth.js';

export default function DashboardPage() {
  const token = getAccessToken();
  const user = getStoredUser();

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Dashboard</div>
      <div className="muted" style={{ marginBottom: 12 }}>
        This frontend uses Vite dev proxy to reach your backend at <code>http://localhost:5000</code>.
      </div>

      <div className="row">
        <div className="card" style={{ flex: '1 1 340px' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Auth status</div>
          <div className="muted">Access token present: {token ? 'Yes' : 'No'}</div>
          <div className="muted">Stored user: {user && user.email ? user.email : 'None'}</div>
        </div>

        <div className="card" style={{ flex: '1 1 340px' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>What to try</div>
          <div className="muted">1) Register a user</div>
          <div className="muted">2) Login</div>
          <div className="muted">3) Open Me / Pages / Menus / Departments</div>
        </div>
      </div>
    </div>
  );
}
