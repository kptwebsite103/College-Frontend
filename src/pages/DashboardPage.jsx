import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listPages, listMenus, listDepartments, getUserCount, approvePage, rejectPage, updateMenu } from '../api/resources.js';
import { usePermissions } from '../utils/rolePermissions';
import UserManagementContent from './UserManagementContent.jsx';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, currentUser, accessToken } = useAuth();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const canReview = isAdmin || isSuperAdmin;

  const [loading, setLoading] = React.useState(false);
  const [counts, setCounts] = React.useState({ pages: null, menus: null, departments: null, users: null });
  const [animatedCounts, setAnimatedCounts] = React.useState({ pages: 0, menus: 0, departments: 0, users: 0 });
  const [showUserManagement, setShowUserManagement] = React.useState(false);
  const [pendingPages, setPendingPages] = React.useState([]);
  const [pendingMenuRequests, setPendingMenuRequests] = React.useState([]);
  const [menuSnapshot, setMenuSnapshot] = React.useState([]);
  const [previewRequest, setPreviewRequest] = React.useState(null);

  const normalizePageStatus = (status) => {
    const value = String(status || '').toLowerCase();
    if (['created', 'pending', 'review'].includes(value)) return 'pending';
    return value || 'pending';
  };

  const normalizeMenuStatus = (status) => {
    if (!status) return 'pending';
    if (status === 'Approved') return 'approved';
    if (status === 'Rejected') return 'rejected';
    return 'pending';
  };

  const buildMenuRequests = (menus = []) => {
    const requests = [];

    const getTitle = (node) =>
      node?.name?.en ||
      node?.title?.en ||
      node?.menu_name_en ||
      node?.name?.kn ||
      node?.title?.kn ||
      node?.menu_name_kn ||
      node?.label ||
      node?.text ||
      node?.displayName ||
      'Unnamed Menu';

    const walkItems = (menu, items, path) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        const status = normalizeMenuStatus(item.status);
        const itemTitle = getTitle(item);
        const nextPath = [...path, itemTitle];
        if (status === 'pending') {
          requests.push({
            type: 'menu',
            kind: 'item',
            id: item._id,
            parentMenuId: menu._id || menu.id,
            title: itemTitle,
            path: nextPath,
            menuTitle: getTitle(menu),
            item
          });
        }
        if (item.items && item.items.length > 0) {
          walkItems(menu, item.items, nextPath);
        }
      });
    };

    menus.forEach((menu) => {
      const status = normalizeMenuStatus(menu.status);
      const title = getTitle(menu);
      if (status === 'pending') {
        requests.push({
          type: 'menu',
          kind: 'menu',
          id: menu._id || menu.id,
          parentMenuId: menu._id || menu.id,
          title,
          path: [title],
          menuTitle: title,
          menu
        });
      }
      walkItems(menu, menu.items || [], [title]);
    });

    return requests;
  };

  async function loadCounts() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([listPages(), listMenus(), listDepartments(), getUserCount()]);
      
      const pageList = results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : null;
      const pages = pageList ? pageList.length : null;
      const pending = pageList
        ? pageList.filter((page) => normalizePageStatus(page.status) === 'pending')
        : [];
      
      // For menus, use API response for accurate dashboard counts
      let menus = null;
      let menuList = [];
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
        // Use live data from database for dashboard
        const allMenus = results[1].value;
        menuList = allMenus;
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
      setPendingPages(pending);
      setMenuSnapshot(menuList);
      setPendingMenuRequests(buildMenuRequests(menuList));
    } finally {
      setLoading(false);
    }
  }

  const updateMenuItemStatus = (items, targetId, nextStatus) => {
    if (!Array.isArray(items)) return items;
    return items.map((item) => {
      if (String(item._id) === String(targetId)) {
        return { ...item, status: nextStatus };
      }
      if (item.items && item.items.length > 0) {
        return { ...item, items: updateMenuItemStatus(item.items, targetId, nextStatus) };
      }
      return item;
    });
  };

  const handleApprovePageRequest = async (pageId) => {
    if (!canReview) return;
    try {
      await approvePage(pageId);
      setPreviewRequest(null);
      loadCounts();
    } catch (error) {
      console.error('Failed to approve page:', error);
    }
  };

  const handleRejectPageRequest = async (pageId) => {
    if (!canReview) return;
    try {
      await rejectPage(pageId);
      setPreviewRequest(null);
      loadCounts();
    } catch (error) {
      console.error('Failed to reject page:', error);
    }
  };

  const handleApproveMenuRequest = async (request) => {
    if (!canReview) return;
    try {
      if (request.kind === 'menu') {
        await updateMenu(request.id, { status: 'Approved', active: true });
      } else {
        const parentMenu = menuSnapshot.find((menu) => String(menu._id || menu.id) === String(request.parentMenuId));
        if (!parentMenu) throw new Error('Parent menu not found');
        const updatedItems = updateMenuItemStatus(parentMenu.items || [], request.id, 'Approved');
        await updateMenu(request.parentMenuId, { items: updatedItems });
      }
      setPreviewRequest(null);
      loadCounts();
    } catch (error) {
      console.error('Failed to approve menu request:', error);
    }
  };

  const handleRejectMenuRequest = async (request) => {
    if (!canReview) return;
    try {
      if (request.kind === 'menu') {
        await updateMenu(request.id, { status: 'Rejected', active: false });
      } else {
        const parentMenu = menuSnapshot.find((menu) => String(menu._id || menu.id) === String(request.parentMenuId));
        if (!parentMenu) throw new Error('Parent menu not found');
        const updatedItems = updateMenuItemStatus(parentMenu.items || [], request.id, 'Rejected');
        await updateMenu(request.parentMenuId, { items: updatedItems });
      }
      setPreviewRequest(null);
      loadCounts();
    } catch (error) {
      console.error('Failed to reject menu request:', error);
    }
  };

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

      {canReview && (
        <div className="dashboard-tiles" style={{ marginTop: 16, gap: 16, gridTemplateColumns: '1fr' }}>
          <div className="tile" style={{ width: '100%', alignItems: 'stretch', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: '100%' }}>
              <div className="tile-title">Pending Page Requests</div>
              <div className="tile-subtitle">
                {pendingPages.length > 0
                  ? `You have ${pendingPages.length} pending page request${pendingPages.length > 1 ? 's' : ''}.`
                  : 'No pending page requests.'}
              </div>
              {pendingPages.length > 0 && (
                <div style={{ marginTop: 12, width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#6B7280', fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
                        <th style={{ padding: '8px 10px', fontWeight: 600 }}>Slug</th>
                        <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPages.slice(0, 5).map((page) => (
                        <tr
                          key={page._id}
                          onClick={() => setPreviewRequest({ type: 'page', data: page })}
                          style={{ borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }}
                        >
                          <td style={{ padding: '10px', fontWeight: 600, color: '#111827' }}>
                            {page.title?.en || page.slug || 'Untitled'}
                          </td>
                          <td style={{ padding: '10px', color: '#6B7280', fontSize: 12 }}>
                            {page.slug || '--'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <Link
                                to={`/admin/pages?highlight=${page._id}`}
                                className="tile-action"
                                style={{ whiteSpace: 'nowrap' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Review
                              </Link>
                              <button
                                className="tile-action"
                                style={{ background: '#10B981', color: 'white' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprovePageRequest(page._id);
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="tile-action"
                                style={{ background: '#EF4444', color: 'white' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectPageRequest(page._id);
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pendingPages.length > 5 && (
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                      Showing first 5. View all in Pages.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="tile" style={{ width: '100%', alignItems: 'stretch', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: '100%' }}>
              <div className="tile-title">Pending Menu Requests</div>
              <div className="tile-subtitle">
                {pendingMenuRequests.length > 0
                  ? `You have ${pendingMenuRequests.length} pending menu request${pendingMenuRequests.length > 1 ? 's' : ''}.`
                  : 'No pending menu requests.'}
              </div>
              {pendingMenuRequests.length > 0 && (
                <div style={{ marginTop: 12, width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#6B7280', fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 600 }}>Item</th>
                        <th style={{ padding: '8px 10px', fontWeight: 600 }}>Path</th>
                        <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMenuRequests.slice(0, 5).map((request) => (
                        <tr
                          key={`${request.kind}-${request.id}`}
                          onClick={() => setPreviewRequest({ type: 'menu', data: request })}
                          style={{ borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }}
                        >
                          <td style={{ padding: '10px', fontWeight: 600, color: '#111827' }}>
                            {request.title}
                          </td>
                          <td style={{ padding: '10px', color: '#6B7280', fontSize: 12 }}>
                            {request.path && request.path.length > 0 ? request.path.join(' / ') : request.menuTitle || '--'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <Link
                                to={
                                  request.kind === 'menu'
                                    ? `/admin/menus?highlightMenu=${request.id}`
                                    : `/admin/menus?highlightMenu=${request.parentMenuId}&highlightItem=${request.id}`
                                }
                                className="tile-action"
                                style={{ whiteSpace: 'nowrap' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Review
                              </Link>
                              <button
                                className="tile-action"
                                style={{ background: '#10B981', color: 'white' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveMenuRequest(request);
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="tile-action"
                                style={{ background: '#EF4444', color: 'white' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectMenuRequest(request);
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pendingMenuRequests.length > 5 && (
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                      Showing first 5. View all in Menus.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showUserManagement && (
        <div className="user-management-inline">
          <div className="user-management-inline-header">
            <h2>User Management</h2>
            <button className="close-btn" onClick={() => setShowUserManagement(false)}>×</button>
          </div>
          <UserManagementContent />
        </div>
      )}

      {previewRequest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '24px'
          }}
          onClick={() => setPreviewRequest(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              width: 'min(900px, 95vw)',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {previewRequest.type === 'page' ? 'Page Request Preview' : 'Menu Request Preview'}
              </div>
              <button
                onClick={() => setPreviewRequest(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                Ã—
              </button>
            </div>
            <div style={{ padding: '16px 20px', overflow: 'auto' }}>
              {previewRequest.type === 'page' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Title</div>
                    <div style={{ fontWeight: 600 }}>{previewRequest.data?.title?.en || previewRequest.data?.slug || 'Untitled'}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Slug</div>
                    <div>{previewRequest.data?.slug || '—'}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Status</div>
                    <div>{normalizePageStatus(previewRequest.data?.status)}</div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Preview</div>
                    <div
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        padding: 12,
                        background: '#F9FAFB'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: previewRequest.data?.content?.en?.html || '<p>No content available.</p>'
                      }}
                    />
                  </div>
                </>
              )}

              {previewRequest.type === 'menu' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Path</div>
                    <div>{previewRequest.data?.path ? previewRequest.data.path.join(' / ') : '—'}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Title</div>
                    <div style={{ fontWeight: 600 }}>{previewRequest.data?.title || 'Untitled'}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>URL</div>
                    <div>{previewRequest.data?.item?.url || previewRequest.data?.menu?.url || '—'}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Redirect URL</div>
                    <div>{previewRequest.data?.item?.redirect_url || previewRequest.data?.menu?.redirect_url || '—'}</div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Sub-items</div>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, background: '#F9FAFB' }}>
                      {(previewRequest.data?.item?.items || previewRequest.data?.menu?.items || []).length === 0 && (
                        <div style={{ color: '#6B7280', fontSize: 13 }}>No sub-items.</div>
                      )}
                      {(previewRequest.data?.item?.items || previewRequest.data?.menu?.items || []).map((child, index) => (
                        <div key={child._id || index} style={{ marginBottom: 6 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {child.title?.en || child.name?.en || child.menu_name_en || 'Untitled'}
                          </div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>
                            {child.url || child.redirect_url || 'No URL'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
