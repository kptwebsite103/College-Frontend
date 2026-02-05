import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMenus, getTheme } from '../../api/resources.js';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import './DynamicNavbar.css';

const DynamicNavbar = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
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
    // For top-level menus: check name.en/name.kn first (new format)
    // For subitems: check title.en/title.kn first (subitem format)
    // Fallback to other field names for backward compatibility
    
    // Debug: Log the item structure when all name fields are empty
    const hasName = item.name?.en || item.name?.kn || item.title?.en || item.title?.kn || 
                   item.menu_name_en || item.menu_name_kn;
    
    if (!hasName) {
      console.log('Unnamed Menu Item:', item);
    }
    
    if (currentLanguage === 'kn') {
      return item.name?.kn || item.title?.kn || item.menu_name_kn || 
             item.name?.en || item.title?.en || item.menu_name_en ||
             item.label || item.text || item.displayName || 'ಹೆಸರಿಲ್ಲದ ಮೆನು';
    }
    return item.name?.en || item.title?.en || item.menu_name_en || 
           item.name?.kn || item.title?.kn || item.menu_name_kn ||
           item.label || item.text || item.displayName || 'Unnamed Menu';
  };

  // Helper function to get URL based on current language
  const getMenuUrl = (item) => {
    // First check for redirect URL (external links)
    if (item.redirect_url) {
      return item.redirect_url;
    }
    // For menu items, URL is stored as 'url' field
    // For backward compatibility, also check url_en, url_kn, link
    return item.url || item.url_en || item.url_kn || item.link;
  };

  // Helper function to check if URL is external
  const isExternalUrl = (url) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  useEffect(() => {
    fetchMenus();
    fetchNavbarColors();

    // Listen for custom events to update navbar colors and menus in real-time
    const handleNavbarColorsUpdated = () => {
      fetchNavbarColors();
    };

    const handleMenusUpdated = (e) => {
      console.log('Menus updated event received:', e.detail);
      fetchMenus();
    };

    window.addEventListener('navbarColorsUpdated', handleNavbarColorsUpdated);
    window.addEventListener('menusUpdated', handleMenusUpdated);

    // Add click outside listener to close dropdowns
    const handleClickOutside = (e) => {
      if (!e.target.closest('.nav-item')) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('navbarColorsUpdated', handleNavbarColorsUpdated);
      window.removeEventListener('menusUpdated', handleMenusUpdated);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchMenus = async () => {
    try {
      console.log('🔄 Fetching menus from API...');

      // Always try API first for consistent data across all users
      const res = await listMenus();
      const apiMenus = res || []; // API returns array directly, not res.data

      console.log('📦 API returned', apiMenus.length, 'menus');
      console.log('📋 Raw menu data:', apiMenus);

      if (apiMenus.length > 0) {
        // Show ALL menus from database
        console.log('✅ All menus:', apiMenus.length);
        setMenus(apiMenus);

        // NO localStorage cache - always use live database data
        return;
      }

      console.log('⚠️ API returned empty, no menus to display');
      setMenus([]);
    } catch (e) {
      console.error('❌ Error fetching menus:', e);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNavbarColors = async () => {
    try {
      const theme = await getTheme('navbar');
      if (theme && theme.colors) {
        setNavbarColors(theme.colors);
      } else {
        // Fallback to hardcoded defaults
        setNavbarColors({
          color1: '#3b82f6',
          color2: '#14b8a6'
        });
      }
    } catch (error) {
      console.error('Error loading navbar theme:', error);
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
    const url = getMenuUrl(item);
    const isExternal = isExternalUrl(url);
    
    // If item has children, toggle dropdown
    if (item.children && item.children.length > 0) {
      // For external URLs, allow the link to open in new tab while also toggling dropdown
      if (!isExternal) {
        e.preventDefault();
        e.stopPropagation();
      }
      toggleDropdown(key, e);
    } else {
      // For items without children, let the link handle navigation
      // But prevent navigation if no URL
      if (!url || url === '#') {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  const isDropdownOpen = (key) => !!openDropdowns[String(key)];

  // Build hierarchical menu structure from flat menu list
  const buildMenuHierarchy = (menus) => {
    console.log('🏗️ Building menu hierarchy from', menus.length, 'menus');

    // Recursive function to build nested structure
    const buildNestedItems = (items) => {
      const filtered = (items || []).filter(item => item.status === 'Approved');
      console.log('  📋 Filtering items:', items?.length || 0, '->', filtered.length, 'approved');
      return filtered
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(item => ({
          ...item,
          id: item._id || item.id,
          children: buildNestedItems(item.items) // Recursively build children
        }));
    };

    const topLevelMenus = menus.filter(menu => !menu.parent_id && menu.status === 'Approved');
    console.log('🎯 Top-level approved menus:', topLevelMenus.length, 'out of', menus.length);

    const hierarchical = topLevelMenus
      .sort((a, b) => (a.order_no || a.order || 0) - (b.order_no || b.order || 0))
      .map(menu => ({
        ...menu,
        id: menu._id || menu.id,
        children: buildNestedItems(menu.items) // Build nested children recursively
      }));

    console.log('✅ Final hierarchical menus:', hierarchical.length);
    return hierarchical;
  };

  // Helper function to generate URL slug from menu name
  const generateUrlSlug = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const generateNestedUrl = (item, parentPath = '') => {
    // Get URL from item using language-aware helper
    let itemUrl = getMenuUrl(item);
    
    // If no URL exists, auto-generate one based on menu name
    if (!itemUrl || itemUrl === '#' || itemUrl === '') {
      const menuName = getMenuText(item);
      const slug = generateUrlSlug(menuName);
      
      if (parentPath) {
        itemUrl = `${parentPath}/${slug}`;
      } else {
        itemUrl = `/${slug}`;
      }
    } else {
      // Ensure itemUrl is a string, fallback to empty string if undefined
      if (typeof itemUrl !== 'string') {
        itemUrl = '';
      }
      
      // If item already has a full path (starts with /), use it directly
      if (itemUrl.startsWith('/')) {
        return itemUrl;
      }
      
      // If it's a relative path, build the nested URL
      if (parentPath) {
        itemUrl = `${parentPath}/${itemUrl}`;
      } else {
        itemUrl = `/${itemUrl}`;
      }
    }
    
    return itemUrl;
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
          
          // Generate the current item's path for children
          const currentPath = itemUrl.startsWith('/') ? itemUrl : `/${itemUrl}`;
          
          return (
            <li
              key={key}
              className={item.children && item.children.length > 0 ? 'has-nested' : ''}
              aria-expanded={isDropdownOpen(key)}
            >
              {item.children && item.children.length > 0 ? (
                <>
                  {isExternalUrl(getMenuUrl(item)) ? (
                    <a
                      href={getMenuUrl(item)}
                      className="nav-link nav-link--nested"
                      onClick={(e) => handleParentClick(key, item, e)}
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen(key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                      }}
                    >
                      <span>{getMenuText(item)}</span>
                      <span className="dropdown-arrow" aria-hidden="true" style={{ marginLeft: '8px' }}>›</span>
                    </a>
                  ) : getMenuUrl(item) && getMenuUrl(item) !== '#' ? (
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
                  ) : (
                    <button
                      className="nav-link nav-link--nested"
                      onClick={(e) => handleParentClick(key, item, e)}
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit'
                      }}
                    >
                      <span>{getMenuText(item)}</span>
                      <span className="dropdown-arrow" aria-hidden="true" style={{ marginLeft: '8px' }}>›</span>
                    </button>
                  )}
                </>
              ) : (
                getMenuUrl(item) && getMenuUrl(item) !== '#' ? (
                  isExternalUrl(getMenuUrl(item)) ? (
                    <a 
                      href={getMenuUrl(item)} 
                      className="nav-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {getMenuText(item)}
                    </a>
                  ) : (
                    <Link to={itemUrl} className="nav-link">
                      {getMenuText(item)}
                    </Link>
                  )
                ) : (
                  <span className="nav-link nav-link--disabled">
                    {getMenuText(item)}
                  </span>
                )
              )}
              {item.children && item.children.length > 0 && renderMenuItems(item.children, key, depth + 1, currentPath)}
            </li>
          );
        })}
      </ul>
    );
  };

  const hierarchicalMenus = buildMenuHierarchy(menus);

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
          {/* Home Icon */}
          <li className="nav-item">
            <Link 
              to="/home" 
              className="nav-link nav-link--parent" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px',
                height: '44px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ 
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              >
                <path d="M12 3l-8 6v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <path d="M9 21V11h6v10"/>
              </svg>
              <span style={{ fontWeight: '600', fontSize: '16px' }}>{t('nav.home')}</span>
            </Link>
          </li>
          
          {hierarchicalMenus.map((item) => {
            const key = item.id; // Now uses consistent id from buildHierarchy
            const itemUrl = generateNestedUrl(item);
            
            return (
              <li
                key={key}
                className={`nav-item ${item.children && item.children.length > 0 ? 'has-dropdown' : ''}`}
                aria-expanded={isDropdownOpen(key)}
              >
                {item.children && item.children.length > 0 ? (
                  <>
                    {isExternalUrl(getMenuUrl(item)) ? (
                      <a
                        href={getMenuUrl(item)}
                        className="nav-link nav-link--dropdown nav-link--parent"
                        onClick={(e) => handleParentClick(key, item, e)}
                        aria-controls={`${item.id}-menu`}
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen(key)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          height: '100%'
                        }}
                      >
                        <span>{getMenuText(item)}</span>
                        <span aria-hidden="true" style={{ marginLeft: '8px' }}>▾</span>
                      </a>
                    ) : getMenuUrl(item) && getMenuUrl(item) !== '#' ? (
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
                    ) : (
                      <button
                        className="nav-link nav-link--dropdown nav-link--parent"
                        onClick={(e) => handleParentClick(key, item, e)}
                        aria-controls={`${item.id}-menu`}
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen(key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          height: '100%',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          font: 'inherit'
                        }}
                      >
                        <span>{getMenuText(item)}</span>
                        <span aria-hidden="true" style={{ marginLeft: '8px' }}>▾</span>
                      </button>
                    )}
                  </>
                ) : (
                  getMenuUrl(item) && getMenuUrl(item) !== '#' ? (
                    isExternalUrl(getMenuUrl(item)) ? (
                      <a 
                        href={getMenuUrl(item)} 
                        className="nav-link nav-link--parent"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getMenuText(item)}
                      </a>
                    ) : (
                      <Link to={itemUrl} className="nav-link nav-link--parent">
                        {getMenuText(item)}
                      </Link>
                    )
                  ) : (
                    <span className="nav-link nav-link--parent nav-link--disabled">
                      {getMenuText(item)}
                    </span>
                  )
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
