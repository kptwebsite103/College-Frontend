import React, { useState, useEffect } from 'react';

export default function AddMenuItemForm({ menu, onSave, onCancel, existingMenus = [], parentMenu = null }) {
  const [formData, setFormData] = useState({
    menu_name_en: '',
    menu_name_kn: '',
    url_en: '',
    url_kn: '',
    parent_id: 0,
    status: 'Created',
    order_no: 0
  });
  
  const [availableMenus, setAvailableMenus] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (menu) {
      setFormData({
        menu_name_en: menu.menu_name_en || '',
        menu_name_kn: menu.menu_name_kn || '',
        url_en: menu.url_en || '',
        url_kn: menu.url_kn || '',
        parent_id: menu.parent_id || 0,
        status: menu.status || 'Created',
        order_no: menu.order_no || 0
      });
    }
  }, [menu]);

  useEffect(() => {
    fetchMenus();
  }, [existingMenus]);

  const fetchMenus = async () => {
    try {
      // Use the existing menus passed as props instead of mock data
      setAvailableMenus(existingMenus);
    } catch (error) {
      console.error('Error fetching menus:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'parent_id' || name === 'order_no' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      onSave(formData);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      {parentMenu && (
        <div style={{ 
          backgroundColor: '#e0e7ff', 
          color: '#3730a3', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Creating sub-item under: <strong>{parentMenu.menu_name_en}</strong> (Order: {parentMenu.order_no})
        </div>
      )}
      
      <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
        {menu ? 'Edit Menu Item' : (parentMenu ? `Add Sub-menu Item under "${parentMenu.menu_name_en}"` : 'Add Top Menu')}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label>Menu Name (English)</label>
            <input
              type="text"
              name="menu_name_en"
              value={formData.menu_name_en}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Menu Name (Kannada)</label>
            <input
              type="text"
              name="menu_name_kn"
              value={formData.menu_name_kn}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label>URL (English)</label>
            <input
              type="text"
              name="url_en"
              value={formData.url_en}
              onChange={handleChange}
              className="form-control"
              placeholder="/about-us"
            />
          </div>
          
          <div className="form-group">
            <label>URL (Kannada)</label>
            <input
              type="text"
              name="url_kn"
              value={formData.url_kn}
              onChange={handleChange}
              className="form-control"
              placeholder="/kn/about-us"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label htmlFor="parent_id">Select Parent</label>
            <select
              id="parent_id"
              name="parent_id"
              value={parentMenu ? parentMenu.id : formData.parent_id}
              onChange={handleChange}
              className="form-control"
              disabled={!!parentMenu}
            >
              {parentMenu ? (
                <option value={parentMenu.id}>{parentMenu.menu_name_en} (Current Parent)</option>
              ) : (
                <>
                  <option value={0}>Self Parent (Top Level)</option>
                  {availableMenus
                    .filter(m => {
                      // Exclude current menu from parent options
                      if (menu && m.id === menu.id) return false;
                      
                      // When creating main menu item (parentMenu is null), only show main menu items (parent_id: 0)
                      if (!parentMenu) {
                        return m.parent_id === 0;
                      }
                      
                      // For subitems, show all menus (existing behavior)
                      return true;
                    })
                    .map(m => (
                    <option key={m.id} value={m.id}>
                      {m.menu_name_en}
                    </option>
                  ))}
                </>
              )}
            </select>
            {parentMenu && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Parent is fixed when creating sub-items
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Order Number</label>
            <input
              type="number"
              name="order_no"
              value={formData.order_no}
              onChange={handleChange}
              className="form-control"
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-control"
            >
              <option value="Created">Created</option>
              <option value="Approved">Approved</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#111827',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              border: '1px solid #3b82f6',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Save Menu'}
          </button>
        </div>
      </form>
    </div>
  );
}
