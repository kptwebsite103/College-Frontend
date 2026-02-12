import React from 'react';

export default function MenuCard({
  menu,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onViewSubItems,
  isSubItem = false,
  canReview = false,
  highlighted = false
}) {
  const normalizeStatus = (status) => {
    if (status === 'Approved') return 'Approved';
    if (status === 'Rejected') return 'Rejected';
    return 'Pending';
  };

  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'Approved') return '#16a34a';
    if (normalized === 'Rejected') return '#dc2626';
    return '#d97706';
  };

  const getStatusBg = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'Approved') return '#f0fdf4';
    if (normalized === 'Rejected') return '#fee2e2';
    return '#fef3c7';
  };

  // Handle both old format, new backend format, and subitem format
  // Use same priority order as DynamicNavbar for consistency
  const menuName = menu.name?.en || menu.title?.en || menu.menu_name_en || 
                   menu.name?.kn || menu.title?.kn || menu.menu_name_kn ||
                   menu.label || menu.text || menu.displayName || 'Unnamed Menu';
  const menuUrl = menu.redirect_url || menu.url_en || menu.url || 'No URL';
  const menuStatus = menu.status || 'Created'; // Show actual status from database
  const menuOrder = menu.order_no || menu.order || 0;
  const displayStatus = normalizeStatus(menuStatus);
  const isPending = displayStatus === 'Pending';

  return (
    <div
      className="card"
      style={{
        marginBottom: '12px',
        position: 'relative',
        outline: highlighted ? '2px solid #3B82F6' : 'none',
        boxShadow: highlighted ? '0 0 0 4px rgba(59,130,246,0.15)' : undefined
      }}
    >
      {/* Edit and Delete Icons - Top Right */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        display: 'flex', 
        gap: '8px',
        zIndex: 10
      }}>
        <button 
          className="edit-btn"
          onClick={() => onEdit(menu)}
          title="Edit"
        >
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'%3E%3C/path%3E%3Cpath d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'%3E%3C/path%3E%3C/svg%3E" alt="Edit" />
        </button>
        
        <button 
          className="delete-btn"
          onClick={() => onDelete(menu._id || menu.id)}
          title="Delete"
        >
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3 6 5 6 21 6'%3E%3C/polyline%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'%3E%3C/path%3E%3Cline x1='10' y1='11' x2='10' y2='17'%3E%3C/line%3E%3Cline x1='14' y1='11' x2='14' y2='17'%3E%3C/line%3E%3C/svg%3E" alt="Delete" />
        </button>
      </div>

      {/* Card Content */}
      <div style={{ padding: '16px', paddingRight: '80px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
            {menuName}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            {menuUrl}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span 
              style={{ 
                backgroundColor: getStatusBg(menuStatus),
                color: getStatusColor(menuStatus),
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {displayStatus}
            </span>
            <span 
              style={{ 
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Order: {menuOrder}
            </span>
          </div>
        </div>
        
        {/* View Sub-items Button - Below Icons */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => onViewSubItems(menu)}
            style={{
              padding: '6px 12px',
              border: '1px solid #3b82f6',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.borderColor = '#2563eb';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
              e.target.style.borderColor = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 1px 2px rgba(59, 130, 246, 0.3)';
            }}
          >
            View Sub-items
          </button>

          {isPending && canReview && (!isSubItem ? (menu._id || menu.id) : true) && (
            <button
              onClick={() => onApprove(menu._id || menu.id)}
              style={{
                padding: '6px 12px',
                border: '1px solid #16a34a',
                backgroundColor: '#16a34a',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(22, 163, 74, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#15803d';
                e.target.style.borderColor = '#15803d';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 4px rgba(22, 163, 74, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#16a34a';
                e.target.style.borderColor = '#16a34a';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 2px rgba(22, 163, 74, 0.3)';
              }}
            >
              Approve
            </button>
          )}

          {isPending && canReview && (
            <button
              onClick={() => onReject(menu._id || menu.id)}
              style={{
                padding: '6px 12px',
                border: '1px solid #dc2626',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(220, 38, 38, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
                e.target.style.borderColor = '#b91c1c';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.borderColor = '#dc2626';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 2px rgba(220, 38, 38, 0.3)';
              }}
            >
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
