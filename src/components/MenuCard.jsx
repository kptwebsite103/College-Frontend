import React from 'react';

export default function MenuCard({ menu, onEdit, onApprove, onDelete, onViewSubItems }) {
  const getStatusColor = (status) => {
    return status === 'Approved' ? '#16a34a' : '#f59e0b';
  };

  const getStatusBg = (status) => {
    return status === 'Approved' ? '#f0fdf4' : '#fef3c7';
  };

  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
            {menu.menu_name_en}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            {menu.url_en || 'No URL'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span 
              style={{ 
                backgroundColor: getStatusBg(menu.status),
                color: getStatusColor(menu.status),
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {menu.status}
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
              Order: {menu.order_no}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onEdit(menu)}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#111827',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Edit
          </button>
          
          <button
            onClick={() => onViewSubItems(menu)}
            style={{
              padding: '6px 12px',
              border: '1px solid #3b82f6',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View Sub-items
          </button>
          
          {menu.status === 'Created' && (
            <button
              onClick={() => onApprove(menu.id)}
              style={{
                padding: '6px 12px',
                border: '1px solid #16a34a',
                backgroundColor: '#16a34a',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Approve
            </button>
          )}
          
          <button
            onClick={() => onDelete(menu.id)}
            style={{
              padding: '6px 12px',
              border: '1px solid #dc2626',
              backgroundColor: '#dc2626',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
