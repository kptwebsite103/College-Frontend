import React from 'react';
import { Link } from 'react-router-dom';
import { getAccessToken, getStoredUser } from '../state/auth.js';
import { listDepartments, listMenus, listPages } from '../api/resources.js';

export default function DashboardPage() {
  const token = getAccessToken();
  const user = getStoredUser();

  const [loading, setLoading] = React.useState(false);
  const [counts, setCounts] = React.useState({ pages: null, menus: null, departments: null });

  async function loadCounts() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([listPages(), listMenus(), listDepartments()]);

      const pages = results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value.length : null;
      const menus = results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value.length : null;
      const departments =
        results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value.length : null;

      setCounts({ pages, menus, departments });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadCounts();
  }, []);

  const displayName = user && (user.name || user.email) ? String(user.name || user.email) : 'Admin';
  const welcomeInitial = displayName.slice(0, 1).toUpperCase();

  const totalItemsCreated =
    [counts.pages, counts.menus, counts.departments].every((v) => typeof v === 'number')
      ? counts.pages + counts.menus + counts.departments
      : null;

  return (
    <div className="page">
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-avatar" aria-hidden="true">
          {welcomeInitial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="dashboard-welcome-title">Welcome Back, {displayName} !</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {token ? 'You are signed in.' : 'You are browsing as guest.'}{' '}
            {loading ? 'Refreshing stats…' : null}
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-label">Total Items Created</div>
          <div className="stat-value blue">{typeof totalItemsCreated === 'number' ? totalItemsCreated : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Visitors Count</div>
          <div className="stat-value red">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pages</div>
          <div className="stat-value orange">{typeof counts.pages === 'number' ? counts.pages : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Number of Users</div>
          <div className="stat-value green">—</div>
        </div>
      </div>

      <div className="dashboard-tiles">
        <div className="tile">
          <div>
            <div className="tile-title">User</div>
            <div className="tile-subtitle">Management</div>
          </div>
          <Link className="tile-action" to="/me">
            Open
          </Link>
        </div>

        <div className="tile">
          <div>
            <div className="tile-title">Gallery</div>
            <div className="tile-subtitle">Create albums</div>
          </div>
          <Link className="tile-action" to="/pages">
            Manage
          </Link>
        </div>

        <div className="tile">
          <div>
            <div className="tile-title">Translator</div>
            <div className="tile-subtitle">Language tools</div>
          </div>
          <Link className="tile-action" to="/menus">
            Open
          </Link>
        </div>

        <div className="tile">
          <div>
            <div className="tile-title">Upload</div>
            <div className="tile-subtitle">Document / File Manager</div>
          </div>
          <Link className="tile-action" to="/pages">
            Upload
          </Link>
        </div>
      </div>

      <div className="dashboard-tabs">
        <Link className="dash-tab red" to="/pages">Latest News</Link>
        <Link className="dash-tab orange" to="/pages">Announcements</Link>
        <Link className="dash-tab blue" to="/departments">Feedbacks</Link>
        <Link className="dash-tab dark" to="/menus">+ Add Social Media</Link>
      </div>
    </div>
  );
}
