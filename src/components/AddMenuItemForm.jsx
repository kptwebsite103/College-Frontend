import React, { useState, useEffect } from 'react';

const getMenuId = (menuItem) => {
  return menuItem?._id || menuItem?.id || '';
};

const getMenuLabel = (menuItem) => {
  return (
    menuItem?.menu_name_en ||
    menuItem?.name?.en ||
    menuItem?.title?.en ||
    menuItem?.label ||
    menuItem?.text ||
    menuItem?.slug ||
    'Untitled'
  );
};

export default function AddMenuItemForm({
  menu,
  onSave,
  onCancel,
  existingMenus = [],
  parentMenu = null,
  canReview = false
}) {
  const [formData, setFormData] = useState({
    menu_name_en: '',
    menu_name_kn: '',
    url_en: '',
    redirect_url: '',
    parent_id: '0',
    status: 'Created',
    order_no: 0
  });
  
  const [availableMenus, setAvailableMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parentPath, setParentPath] = useState('');

  // Helper function to generate slug from text
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .trim();
  };

  // Get parent path for nested URLs
  const getParentPath = () => {
    if (!parentMenu) return '';
    
    // If parentMenu has a URL, use it as the base path
    const parentUrl = parentMenu.url_en || parentMenu.url || '';
    if (parentUrl && parentUrl !== '#') {
      // Remove leading slash if present, then rebuild the path
      const cleanParentUrl = parentUrl.startsWith('/') ? parentUrl.slice(1) : parentUrl;
      return `/${cleanParentUrl}`;
    }
    
    // Fallback: generate path from parent's name
    const parentName = parentMenu.menu_name_en || parentMenu.title?.en || parentMenu.name?.en || '';
    if (parentName) {
      return `/${generateSlug(parentName)}`;
    }
    
    return '';
  };

  useEffect(() => {
    if (menu) {
      setFormData({
        menu_name_en: menu.name?.en || menu.title?.en || menu.menu_name_en || 
                     menu.label || menu.text || menu.displayName || '',
        menu_name_kn: menu.name?.kn || menu.title?.kn || menu.menu_name_kn || '',
        url_en: menu.url_en || menu.url || '',
        redirect_url: menu.redirect_url || '',
        parent_id: String(menu.parent_id || '0'),
        status: canReview ? (menu.status || 'Created') : 'Created',
        order_no: menu.order_no || menu.order || 0
      });
    }
  }, [menu]);

  useEffect(() => {
    // Set parent path when parentMenu changes
    if (parentMenu) {
      setParentPath(getParentPath());
    }
  }, [parentMenu]);

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
    const { name, value = '' } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order_no' ? (parseInt(value, 10) || 0) : value
    }));

    // Auto-generate URL from menu_name_en only for new items or when URL is empty
    if (name === 'menu_name_en' && (!menu || !formData.url_en || formData.url_en === '')) {
      const slug = generateSlug(value);
      
      // For subitems, include parent path in the URL
      let finalUrl = '';
      if (parentMenu && parentPath) {
        finalUrl = `${parentPath}/${slug}`;
      } else {
        finalUrl = slug ? `/${slug}` : '';
      }
      
      setFormData(prev => ({
        ...prev,
        url_en: finalUrl
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Allow empty URLs for both parent menus and submenus
    // Items with empty URLs will be treated as menu containers
    const hasUrl = formData.url_en || formData.redirect_url;
    
    // No validation required - empty URLs are allowed for all items
    // They will be treated as menu containers
    
    // Clear conflicting fields
    const submissionData = { ...formData, status: canReview ? formData.status : 'Created' };
    submissionData.parent_id =
      submissionData.parent_id && String(submissionData.parent_id) !== '0'
        ? String(submissionData.parent_id)
        : 0;
    if (submissionData.redirect_url) {
      submissionData.url_en = ''; // Clear internal URL when redirect URL is provided
    } else if (submissionData.url_en) {
      submissionData.redirect_url = ''; // Clear redirect URL when internal URL is provided
    }
    // If both are empty, keep them empty for menu items
    
    setLoading(true);
    
    setTimeout(() => {
      onSave(submissionData);
      setLoading(false);
    }, 500);
  };

  const currentMenuId = menu ? String(getMenuId(menu)) : '';
  const parentOptions = (availableMenus || [])
    .filter((item) => Boolean(getMenuId(item)))
    .filter((item) => {
      if (!currentMenuId) return true;
      return String(getMenuId(item)) !== currentMenuId;
    });

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
          {menu ? 'Editing' : 'Creating'} sub-item under: <strong>{parentMenu.name?.en || parentMenu.menu_name_en || parentMenu.title?.en}</strong>
        </div>
      )}
      
      <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
        {menu ? (parentMenu ? 'Edit Sub-menu Item' : 'Edit Menu Item') : (parentMenu ? `Add Sub-menu Item under "${parentMenu.name?.en || parentMenu.menu_name_en || parentMenu.title?.en}"` : 'Add Top Menu')}
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

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#374151' }}>
            Link Configuration
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label>URL (English) <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}>{parentMenu ? `(Auto-generated with parent path)` : `(For internal pages)`}</span></label>
              <input
                type="text"
                name="url_en"
                value={formData.url_en}
                onChange={handleChange}
                className="form-control"
                placeholder={parentMenu ? `${parentPath}/your-submenu` : "/about-us"}
                disabled={!!formData.redirect_url}
                style={{
                  backgroundColor: formData.redirect_url ? '#f3f4f6' : 'white',
                  cursor: formData.redirect_url ? 'not-allowed' : 'text'
                }}
              />
              {formData.redirect_url && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                  URL is disabled when redirect URL is provided
                </div>
              )}
              {parentMenu && formData.url_en && !formData.redirect_url && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Full path: {formData.url_en}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Redirect URL <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}>(For external links)</span></label>
              <input
                type="url"
                name="redirect_url"
                value={formData.redirect_url}
                onChange={handleChange}
                className="form-control"
                placeholder="https://maps.google.com"
                style={{
                  backgroundColor: formData.url_en ? '#f3f4f6' : 'white',
                  cursor: formData.url_en ? 'not-allowed' : 'text'
                }}
                disabled={!!formData.url_en}
              />
              {formData.url_en && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                  Redirect URL is disabled when internal URL is provided
                </div>
              )}
              {formData.redirect_url && (
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                  ✅ Will redirect to: {formData.redirect_url}
                </div>
              )}
            </div>
          </div>

          {/* Validation Message */}
          {!formData.url_en && !formData.redirect_url && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#dcfce7',
              border: '1px solid #22c55e',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#166534',
              marginBottom: '8px'
            }}>
              ✅ This will be created as a menu item (no URL required for menu containers)
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
            <label htmlFor="parent_id">Select Parent</label>
            <select
              id="parent_id"
              name="parent_id"
              value={parentMenu ? String(getMenuId(parentMenu) || '0') : String(formData.parent_id ?? '0')}
              onChange={handleChange}
              className="form-control"
              disabled={!!parentMenu}
            >
              {parentMenu ? (
                <option value={String(getMenuId(parentMenu) || '0')}>
                  {getMenuLabel(parentMenu)} (Current Parent)
                </option>
              ) : (
                <>
                  <option value="0">Self Parent (Top Level)</option>
                  {parentOptions.map((m) => {
                    const optionId = String(getMenuId(m));
                    return (
                    <option key={optionId} value={optionId}>
                      {getMenuLabel(m)}
                    </option>
                    );
                  })}
                </>
              )}
            </select>
            {parentMenu && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Parent is fixed when creating sub-items
              </div>
            )}
          </div>
        </div>

        {/* Status dropdown - only show in edit mode */}
        {menu && canReview && (
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-control"
            >
              <option value="Created">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}
        {menu && !canReview && (
          <div className="form-group">
            <label>Status</label>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                color: '#6b7280',
                fontSize: '14px'
              }}
            >
              Pending (requires admin approval)
            </div>
          </div>
        )}

        {/* Page Preview Section */}
        {formData.url_en && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#374151' }}>
              Page Preview for URL: {formData.url_en}
            </div>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <div style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                <div style={{ marginBottom: '12px', fontWeight: '500', color: '#374151' }}>
                  Preview: {formData.menu_name_en || 'Menu Item'}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  URL: {formData.url_en}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  This URL will display a page when clicked. If a page exists with this slug, it will show the page content. Otherwise, it will show a placeholder.
                </div>
              </div>
            </div>
          </div>
        )}

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
