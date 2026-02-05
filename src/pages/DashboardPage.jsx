import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listPages, listMenus, listDepartments, getUserCount } from '../api/resources.js';
import UserManagementContent from './UserManagementContent.jsx';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, currentUser, accessToken } = useAuth();

  const [loading, setLoading] = React.useState(false);
  const [counts, setCounts] = React.useState({ pages: null, menus: null, departments: null, users: null });
  const [animatedCounts, setAnimatedCounts] = React.useState({ pages: 0, menus: 0, departments: 0, users: 0 });
  const [showUserManagement, setShowUserManagement] = React.useState(false);

  async function loadCounts() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([listPages(), listMenus(), listDepartments(), getUserCount()]);
      
      const pages = results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value.length : null;
      
      // For menus, use API response for accurate dashboard counts
      let menus = null;
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
        // Use live data from database for dashboard
        const allMenus = results[1].value;
        let totalMenuItems = 0;

        // Count all parent menus (both approved and created)
        const allMenusCount = allMenus.filter(menu =>
          menu.status === 'Approved' || menu.status === 'Created' || (menu.active === true)
        );
        totalMenuItems += allMenusCount.length;

        // Recursively count all subitems (both approved and created) at any nesting level
        const countAllItems = (items) => {
          let count = 0;
          if (items && Array.isArray(items)) {
            items.forEach(item => {
              if (item.status === 'Approved' || item.status === 'Created') {
                count++;
              }
              // Recursively count nested sub-items
              if (item.items && Array.isArray(item.items)) {
                count += countAllItems(item.items);
              }
            });
          }
          return count;
        };

        allMenus.forEach(menu => {
          if (menu.items && Array.isArray(menu.items)) {
            totalMenuItems += countAllItems(menu.items);
          }
        });

        menus = totalMenuItems;
      }
      
      const departments = results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value.length : null;
      const users = results[3].status === 'fulfilled' && results[3].value && typeof results[3].value.count === 'number' ? results[3].value.count : null;

      setCounts({ pages, menus, departments, users });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadCounts();
    
    // Set up periodic polling for live updates
    const interval = setInterval(loadCounts, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Animate counts when they change
  React.useEffect(() => {
    const startTime = Date.now();

    // Easing function for smooth animation
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // Dynamic duration based on count size
    const getDuration = (targetValue) => {
      if (targetValue <= 20) return 1500; // 1.5s for small numbers
      if (targetValue <= 100) return 1000; // 1s for medium numbers
      return 800; // 0.8s for large numbers (100+)
    };

    const animateCount = (key, targetValue) => {
      if (targetValue === null || targetValue === 0) {
        setAnimatedCounts(prev => ({ ...prev, [key]: targetValue || 0 }));
        return;
      }

      const startValue = animatedCounts[key] || 0;
      const duration = getDuration(targetValue);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        const currentValue = Math.round(startValue + (targetValue - startValue) * easedProgress);
        setAnimatedCounts(prev => ({ ...prev, [key]: currentValue }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedCounts(prev => ({ ...prev, [key]: targetValue }));
        }
      };

      requestAnimationFrame(animate);
    };

    // Animate each count
    Object.keys(counts).forEach(key => {
      if (counts[key] !== null) {
        animateCount(key, counts[key]);
      }
    });
  }, [counts]);

  const displayName = currentUser?.username || 'Admin';
  const welcomeInitial = displayName.slice(0, 1).toUpperCase();

  const totalItemsCreated =
    [animatedCounts.pages, animatedCounts.menus, animatedCounts.departments].every((v) => typeof v === 'number')
      ? animatedCounts.pages + animatedCounts.menus + animatedCounts.departments
      : null;

  // Handle user count separately to avoid being overridden
  const displayUserCount = typeof animatedCounts.users === 'number' ? animatedCounts.users : '—';

  return (
    <div className="page">
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-avatar" aria-hidden="true">
          {welcomeInitial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="dashboard-welcome-title">Welcome Back, {displayName} !</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {isSignedIn ? 'You are signed in.' : 'You are browsing as guest.'}{' '}
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
          <div className="stat-value orange">{typeof animatedCounts.pages === 'number' ? animatedCounts.pages : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Number of Users</div>
          <div className="stat-value green">{displayUserCount}</div>
        </div>
      </div>

      <div className="dashboard-tiles">
        <div className="tile">
          <div>
            <div className="tile-title">User</div>
            <div className="tile-subtitle">Management</div>
          </div>
          <button className="tile-action" onClick={() => setShowUserManagement(true)}>
            Open
          </button>
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

      {showUserManagement && (
        <div className="user-management-inline">
          <div className="user-management-inline-header">
            <h2>User Management</h2>
            <button className="close-btn" onClick={() => setShowUserManagement(false)}>×</button>
          </div>
          <UserManagementContent />
        </div>
      )}
    </div>
  );
}
