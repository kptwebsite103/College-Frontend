import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMenus } from '../../api/resources.js';
import { useLanguage } from '../../contexts/LanguageContext';
import './DynamicNavbar.css';

const DynamicNavbar = () => {
  const { currentLanguage } = useLanguage();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [navbarColors, setNavbarColors] = useState({
    color1: '#3b82f6',
    color2: '#14b8a6'
  });
  const navigate = useNavigate();

  // Helper function to get menu text based on current language
  const getMenuText = (item) => {
    if (currentLanguage === 'kn') {
      return item.menu_name_kn || item.menu_name_en || item.name;
    }
    return item.menu_name_en || item.name;
  };

  // Helper function to get URL based on current language
  const getMenuUrl = (item) => {
    if (currentLanguage === 'kn') {
      return item.url_kn || item.url_en || item.link;
    }
    return item.url_en || item.link;
  };

  useEffect(() => {
    fetchMenus();
    fetchNavbarColors();

    // Listen for storage changes to update navbar colors and menus in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'navbarColors') {
        fetchNavbarColors();
      } else if (e.key === 'menus') {
        fetchMenus();
      }
    };

    // Listen for custom menu update events
    const handleMenusUpdated = (e) => {
      console.log('Menus updated event received:', e.detail);
      fetchMenus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('menusUpdated', handleMenusUpdated);
    
    // Add click outside listener to close dropdowns
    const handleClickOutside = (e) => {
      if (!e.target.closest('.nav-item')) {
        setOpenDropdowns({});
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('menusUpdated', handleMenusUpdated);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchMenus = async () => {
    try {
      // First try to get menus from localStorage (for admin-created menus)
      const savedMenus = localStorage.getItem('menus');
      if (savedMenus) {
        const menus = JSON.parse(savedMenus);
        // Filter only approved menus for display
        const approvedMenus = menus.filter(menu => menu.status === 'Approved');
        setMenus(approvedMenus);
        return;
      }
      
      // Fallback to API if no saved menus
      const res = await listMenus();
      setMenus(res.data || []);
    } catch (e) {
      console.error('Error fetching menus:', e);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNavbarColors = () => {
    // Get saved colors from localStorage or use defaults
    const savedColors = localStorage.getItem('navbarColors');
    const defaultColors = localStorage.getItem('defaultNavbarColors');
    
    if (savedColors) {
      setNavbarColors(JSON.parse(savedColors));
    } else if (defaultColors) {
      setNavbarColors(JSON.parse(defaultColors));
    } else {
      // Fallback to hardcoded defaults
      setNavbarColors({
        color1: '#3b82f6',
        color2: '#14b8a6'
      });
    }
  };

  const toggleDropdown = (key, e) => {
    e?.stopPropagation();
    
    // Ensure key is a string
    const keyStr = String(key);
    
    setOpenDropdowns((prev) => {
      const isOpen = !!prev[keyStr];
      const nextState = {};

      // Keep parent dropdowns open
      const parts = keyStr.split('-');
      const parentKey = parts.length > 1 ? parts.slice(0, -1).join('-') : null;

      if (parentKey) {
        parentKey.split('-').reduce((acc, part) => {
          const ancestorKey = acc ? `${acc}-${part}` : part;
          nextState[ancestorKey] = true;
          return ancestorKey;
        }, '');
      }

      // Toggle the current dropdown
      if (!isOpen) {
        nextState[keyStr] = true;
      }

      return nextState;
    });
  };

  const handleDropdownClick = (key, item, e) => {
    // Prevent navigation when clicking dropdown toggle
    e.preventDefault();
    e.stopPropagation();
    
    // Only toggle dropdown, don't navigate
    toggleDropdown(key, e);
  };

  const handleParentClick = (key, item, e) => {
    // If item has children, toggle dropdown instead of navigating
    if (item.children && item.children.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(key, e);
    } else {
      // Navigate if it doesn't have children
      const route = getMenuUrl(item);
      if (route && route !== '#') {
        navigate(route);
      }
    }
  };

  const isDropdownOpen = (key) => !!openDropdowns[String(key)];

  const buildHierarchy = (items, parentId = 0) => {
    return items
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.order_no - b.order_no)
      .map(item => ({
        ...item,
        children: buildHierarchy(items, item.id),
      }));
  };

  const generateNestedUrl = (item, parentPath = '') => {
    // Get URL from item using language-aware helper
    let itemUrl = getMenuUrl(item);
    
    // Ensure itemUrl is a string, fallback to empty string if undefined
    if (!itemUrl || typeof itemUrl !== 'string') {
      itemUrl = '';
    }
    
    // If item already has a full path (starts with /), use it directly
    if (itemUrl.startsWith('/')) {
      return itemUrl;
    }
    
    // If it's a relative path, build the nested URL
    if (parentPath) {
      return `${parentPath}/${itemUrl}`;
    }
    
    return `/${itemUrl}`;
  };

  const renderMenuItems = (items, parentKey = '', depth = 0, parentPath = '') => {
    const isNested = depth > 1;
    const isMain = depth === 1;

    return (
      <ul
        className={`dropdown ${isNested ? 'nested-dropdown' : ''} ${isMain ? 'main-dropdown' : ''} ${isDropdownOpen(parentKey) ? 'is-open' : ''}`}
        aria-label={`${parentKey || ''} submenu`}
      >
        {items.map((item) => {
          const key = parentKey ? `${parentKey}-${item.id}` : item.id;
          const itemUrl = generateNestedUrl(item, parentPath);
          const itemUrlForPath = getMenuUrl(item);
          const currentPath = parentPath || (itemUrlForPath && typeof itemUrlForPath === 'string' && itemUrlForPath.startsWith('/')) ? '' : `/${itemUrlForPath || ''}`;
          
          return (
            <li
              key={key}
              className={item.children && item.children.length > 0 ? 'has-nested' : ''}
              aria-expanded={isDropdownOpen(key)}
            >
              {item.children && item.children.length > 0 ? (
                <>
                  <Link
                    to={itemUrl}
                    className="nav-link nav-link--nested"
                    onClick={(e) => handleParentClick(key, item, e)}
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen(key)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      width: '100%'
                    }}
                  >
                    <span>{getMenuText(item)}</span>
                    <span className="dropdown-arrow" aria-hidden="true" style={{ marginLeft: '8px' }}>›</span>
                  </Link>
                </>
              ) : (
                <Link to={itemUrl} className="nav-link">
                  {getMenuText(item)}
                </Link>
              )}
              {item.children && item.children.length > 0 && renderMenuItems(item.children, key, depth + 1, itemUrl)}
            </li>
          );
        })}
      </ul>
    );
  };

  const hierarchicalMenus = buildHierarchy(menus);

  return (
    <nav 
      className="dynamic-navbar" 
      style={{ 
        background: `linear-gradient(135deg, ${navbarColors.color1} 0%, ${navbarColors.color2} 100%)`,
        '--navbar-color-1': navbarColors.color1,
        '--navbar-color-2': navbarColors.color2
      }}
    >
      <div className="navbar-container">
        <button
          className="navbar__toggle"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`navbar__links ${mobileOpen ? 'is-open' : ''}`}>
          {hierarchicalMenus.map((item) => {
            const key = item.id;
            const itemUrl = generateNestedUrl(item);
            
            return (
              <li
                key={key}
                className={`nav-item ${item.children && item.children.length > 0 ? 'has-dropdown' : ''}`}
                aria-expanded={isDropdownOpen(key)}
              >
                {item.children && item.children.length > 0 ? (
                  <>
                    <Link
                      to={itemUrl}
                      className="nav-link nav-link--dropdown nav-link--parent"
                      onClick={(e) => handleParentClick(key, item, e)}
                      aria-controls={`${item.id}-menu`}
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen(key)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        height: '100%'
                      }}
                    >
                      <span>{getMenuText(item)}</span>
                      <span aria-hidden="true" style={{ marginLeft: '8px' }}>▾</span>
                    </Link>
                  </>
                ) : (
                  <Link to={itemUrl} className="nav-link nav-link--parent">
                    {getMenuText(item)}
                  </Link>
                )}
                {item.children && item.children.length > 0 && renderMenuItems(item.children, key, 1, itemUrl)}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default DynamicNavbar;
