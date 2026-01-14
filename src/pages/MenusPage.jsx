import React, { useState, useEffect } from 'react';
import MenuCard from '../components/MenuCard.jsx';
import AddMenuItemForm from '../components/AddMenuItemForm.jsx';
import { listMenus } from '../api/resources.js';

export default function MenusPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menus, setMenus] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [color1, setColor1] = useState('');
  const [color2, setColor2] = useState('');
  const [showPredefinedGradients, setShowPredefinedGradients] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [currentParentMenu, setCurrentParentMenu] = useState(null);
  const [blockName, setBlockName] = useState({ 
    english: 'Main Menu', 
    kannada: 'ಮುಖ್ಯ ಮೆನು' 
  });

  useEffect(() => {
    // Load current navbar colors when component mounts
    const savedColors = localStorage.getItem('navbarColors');
    const defaultColors = localStorage.getItem('defaultNavbarColors');
    
    if (savedColors) {
      const colors = JSON.parse(savedColors);
      setColor1(colors.color1);
      setColor2(colors.color2);
    } else if (defaultColors) {
      const colors = JSON.parse(defaultColors);
      setColor1(colors.color1);
      setColor2(colors.color2);
    } else {
      // Use hardcoded defaults
      setColor1('#3b82f6');
      setColor2('#14b8a6');
    }
  }, []);

  async function fetchMenus() {
    setLoading(true);
    setError(null);
    try {
      const res = await listMenus();
      return res.data || [];
    } catch (e) {
      setError(e);
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load menus from localStorage on component mount first
    console.log('=== Loading menus from localStorage ===');
    console.log('Available localStorage keys:', Object.keys(localStorage));
    
    let savedMenus = localStorage.getItem('menus');
    console.log('Raw saved menus from localStorage:', savedMenus);
    
    // If localStorage is empty, try sessionStorage as fallback
    if (!savedMenus) {
      savedMenus = sessionStorage.getItem('menus');
      console.log('Raw saved menus from sessionStorage (fallback):', savedMenus);
    }
    
    console.log('Final saved menus to use:', savedMenus);
    console.log('Type of savedMenus:', typeof savedMenus);
    console.log('Length of savedMenus:', savedMenus ? savedMenus.length : 'null');
    
    if (savedMenus) {
      try {
        const parsedMenus = JSON.parse(savedMenus);
        console.log('Parsed menus:', parsedMenus);
        console.log('Type of parsed menus:', Array.isArray(parsedMenus) ? 'array' : typeof parsedMenus);
        setMenus(parsedMenus);
      } catch (error) {
        console.error('Error parsing menus from localStorage:', error);
        console.error('Saved menus string:', savedMenus);
        setMenus([]);
      }
    } else {
      console.log('No saved menus found in localStorage or sessionStorage');
      // Only fetch from API if no local data exists
      fetchMenus().then(apiMenus => {
        if (apiMenus.length > 0) {
          setMenus(apiMenus);
          saveMenusToStorage(apiMenus);
        }
      });
    }
  }, []);

  // Remove automatic saving on menu change to avoid conflicts
  // useEffect(() => {
  //   // Save menus to localStorage whenever they change
  //   if (menus.length > 0) {
  //     localStorage.setItem('menus', JSON.stringify(menus));
  //   }
  // }, [menus]);

  const saveMenusToStorage = (menusToSave) => {
    try {
      console.log('=== saveMenusToStorage called ===');
      console.log('Saving to localStorage:', menusToSave);
      
      // Save to both localStorage and sessionStorage as backup
      const menusString = JSON.stringify(menusToSave);
      localStorage.setItem('menus', menusString);
      sessionStorage.setItem('menus', menusString);
      
      // Dispatch custom event to notify navbar of menu changes
      window.dispatchEvent(new CustomEvent('menusUpdated', { detail: menusToSave }));
      
      // Verify it was saved
      const saved = localStorage.getItem('menus');
      const sessionSaved = sessionStorage.getItem('menus');
      console.log('localStorage verification - saved data:', saved);
      console.log('sessionStorage verification - saved data:', sessionSaved);
      console.log('Save successful!');
    } catch (error) {
      console.error('Error saving menus to localStorage:', error);
    }
  };

  const handleViewSubItems = (parentMenu) => {
    setCurrentParentMenu(parentMenu);
    setShowAddForm(false);
    setEditingMenu(null);
  };

  const handleBackToParent = () => {
    setCurrentParentMenu(null);
  };

  const handleAddMenu = () => {
    setEditingMenu(null);
    setShowAddForm(true);
  };

  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setShowAddForm(true);
  };

  const handleSaveMenu = (menuData) => {
    // In a real app, this would make an API call
    console.log('=== handleSaveMenu called ===');
    console.log('Saving menu:', menuData);
    
    // If we're in a sub-menu context, set the parent_id
    if (currentParentMenu) {
      menuData.parent_id = currentParentMenu.id;
    }
    
    if (editingMenu) {
      // Update existing menu
      console.log('Updating existing menu:', editingMenu.id);
      const updated = menus.map(m => 
        m.id === editingMenu.id ? { ...m, ...menuData } : m
      );
      console.log('Updated menus:', updated);
      
      // Save to localStorage first, then update state
      saveMenusToStorage(updated);
      setMenus(updated);
    } else {
      // Add new menu
      const newMenu = {
        id: Date.now(), // Temporary ID
        ...menuData
      };
      console.log('Adding new menu:', newMenu);
      const updated = [...menus, newMenu];
      console.log('Updated menus after add:', updated);
      
      // Save to localStorage first, then update state
      saveMenusToStorage(updated);
      setMenus(updated);
    }
    
    setShowAddForm(false);
    setEditingMenu(null);
  };

  const handleForceReload = () => {
    // Force reload menus from localStorage
    const savedMenus = localStorage.getItem('menus') || sessionStorage.getItem('menus');
    if (savedMenus) {
      try {
        const parsedMenus = JSON.parse(savedMenus);
        console.log('Force reloaded menus:', parsedMenus);
        setMenus(parsedMenus);
        alert(`Force reloaded ${parsedMenus.length} menus from storage`);
      } catch (error) {
        console.error('Error force reloading:', error);
        alert('Error reloading menus');
      }
    } else {
      alert('No menus found in storage');
    }
  };

  const handleDebugLocalStorage = () => {
    console.log('=== DEBUG: LocalStorage Analysis ===');
    const keys = Object.keys(localStorage);
    console.log('All localStorage keys:', keys);
    
    const menusData = localStorage.getItem('menus');
    console.log('Raw menus data:', menusData);
    
    if (menusData) {
      try {
        const parsed = JSON.parse(menusData);
        console.log('Parsed menus:', parsed);
        console.log('Menu count:', parsed.length);
        console.log('Menu IDs:', parsed.map(m => m.id));
        alert(`Debug: Found ${parsed.length} menus in localStorage. Check console for details.`);
      } catch (e) {
        console.error('Parse error:', e);
        alert('Debug: Error parsing localStorage data. Check console.');
      }
    } else {
      console.log('No menus found in localStorage');
      alert('Debug: No menus found in localStorage');
    }
    
    // Also check sessionStorage
    const sessionMenus = sessionStorage.getItem('menus');
    console.log('SessionStorage menus:', sessionMenus);
  };

  const handleCreateSampleData = () => {
    const sampleMenus = [
      {
        id: Date.now() + 1,
        menu_name_en: 'Home',
        menu_name_kn: 'ಮುಖಪುಟ',
        url_en: '/',
        url_kn: '/kn',
        parent_id: 0,
        status: 'Approved',
        order_no: 1
      },
      {
        id: Date.now() + 2,
        menu_name_en: 'About Us',
        menu_name_kn: 'ನಮ್ಮ ಬಗ್ಗೆ',
        url_en: '/about',
        url_kn: '/kn/about',
        parent_id: 0,
        status: 'Approved',
        order_no: 2
      },
      {
        id: Date.now() + 3,
        menu_name_en: 'Services',
        menu_name_kn: 'ಸೇವೆಗಳು',
        url_en: '/services',
        url_kn: '/kn/services',
        parent_id: 0,
        status: 'Created',
        order_no: 3
      }
    ];
    
    const updated = [...menus, ...sampleMenus];
    saveMenusToStorage(updated);
    setMenus(updated);
    alert('Sample data created! Check the menu list and navbar preview.');
  };

  const handleApproveMenu = (menuId) => {
    // In a real app, this would make an API call
    const updated = menus.map(m => 
      m.id === menuId ? { ...m, status: 'Approved' } : m
    );
    console.log('Approved menu:', menuId);
    console.log('Updated menus:', updated);
    
    // Save to localStorage first, then update state
    saveMenusToStorage(updated);
    setMenus(updated);
  };

  const handleDeleteMenu = (menuId) => {
    // In a real app, this would make an API call
    console.log('=== handleDeleteMenu called ===');
    console.log('Menu ID to delete:', menuId);
    console.log('Current menus before delete:', menus);
    
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      const updated = menus.filter(m => m.id !== menuId);
      console.log('Updated menus after delete:', updated);
      console.log('Deleted menu ID:', menuId);
      
      // Save to localStorage first, then update state
      saveMenusToStorage(updated);
      setMenus(updated);
      
      // Verify deletion
      console.log('Menus state after setMenus:', menus);
    } else {
      console.log('Delete cancelled by user');
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingMenu(null);
  };

  const handlePageColourClick = () => {
    setShowColorPicker(true);
  };

  const handleBackToMenu = () => {
    setShowColorPicker(false);
  };

  const handleUsePredefinedClick = () => {
    setShowPredefinedGradients(true);
  };

  const handleClosePredefinedGradients = () => {
    setShowPredefinedGradients(false);
  };

  const predefinedGradients = [
    { name: 'BLUE CMS1 (OLD COLOR)', color1: '#1e40af', color2: '#3b82f6' },
    { name: 'MAROON', color1: '#7c2d12', color2: '#c2410c' },
    { name: 'GREY & BLACK', color1: '#374151', color2: '#111827' },
    { name: 'WINE RED', color1: '#7f1d1d', color2: '#991b1b' },
    { name: 'Berry Crush', color1: '#831843', color2: '#be185d' },
    { name: 'Deep Night', color1: '#1e293b', color2: '#0f172a' },
    { name: 'Mystic Olive', color1: '#365314', color2: '#4d7c0f' },
    { name: 'Sunburst Sky', color1: '#0284c7', color2: '#0ea5e9' },
    { name: 'Stormy Blue', color1: '#1e3a8a', color2: '#1d4ed8' },
    { name: 'Golden Teal', color1: '#047857', color2: '#14b8a6' },
    { name: 'Rosy Velvet', color1: '#be185d', color2: '#ec4899' },
    { name: 'Royal Aqua', color1: '#065f46', color2: '#10b981' },
    { name: 'Midnight Indigo', color1: '#312e81', color2: '#4f46e5' },
    { name: 'Plum Passion', color1: '#6b21a8', color2: '#9333ea' },
    { name: 'Electric Violet', color1: '#6b21a8', color2: '#a855f7' },
    { name: 'Golden Leaf', color1: '#a16207', color2: '#eab308' },
    { name: 'Sunset Rose', color1: '#be123c', color2: '#f43f5e' },
    { name: 'Ocean Depth', color1: '#0c4a6e', color2: '#0284c7' },
    { name: 'Dark Emerald', color1: '#064e3b', color2: '#059669' },
    { name: 'Wine Shadow', color1: '#881337', color2: '#be123c' },
    { name: 'Blue Eclipse', color1: '#1e3a8a', color2: '#2563eb' },
    { name: 'Golden Harvest', color1: '#92400e', color2: '#d97706' },
    { name: 'Charcoal Mist', color1: '#374151', color2: '#6b7280' },
    { name: 'Deep Orchid', color1: '#6b21a8', color2: '#c026d3' },
    { name: 'Twilight Ocean', color1: '#0c4a6e', color2: '#0891b2' },
    { name: 'Electric Shadow', color1: '#4c1d95', color2: '#7c3aed' },
    { name: 'Emerald Noir', color1: '#064e3b', color2: '#10b981' },
    { name: 'Crimson Velvet', color1: '#7f1d1d', color2: '#dc2626' },
    { name: 'Dark Cyan Storm', color1: '#164e63', color2: '#06b6d4' },
    { name: 'Royal Amethyst', color1: '#581c87', color2: '#9333ea' },
    { name: 'Mystic Plum', color1: '#6b21a8', color2: '#a21caf' },
    { name: 'Cobalt Depth', color1: '#1e3a8a', color2: '#3b82f6' },
    { name: 'Wine Dusk', color1: '#7c2d12', color2: '#b91c1c' },
    { name: 'Cosmic Blue', color1: '#1e3a8a', color2: '#6366f1' },
    { name: 'Dark Teal Aura', color1: '#134e4a', color2: '#14b8a6' },
    { name: 'Royal Rose', color1: '#be123c', color2: '#f43f5e' },
    { name: 'Fiery Red', color1: '#7f1d1d', color2: '#ef4444' },
    { name: 'Deep Crimson', color1: '#881337', color2: '#dc2626' },
    { name: 'Coral Blush', color1: '#dc2626', color2: '#f87171' },
    { name: 'Aqua Green', color1: '#059669', color2: '#34d399' },
    { name: 'Hot Pink', color1: '#be185d', color2: '#ec4899' },
    { name: 'Purple Passion', color1: '#6b21a8', color2: '#a855f7' },
    { name: 'Soft Pink', color1: '#be185d', color2: '#f9a8d4' },
    { name: 'Sky Blue', color1: '#0284c7', color2: '#38bdf8' },
    { name: 'Slate Blue', color1: '#475569', color2: '#64748b' },
    { name: 'Orange Red', color1: '#c2410c', color2: '#f97316' },
    { name: 'Lime Green', color1: '#365314', color2: '#84cc16' },
    { name: 'Yellow Green', color1: '#4d7c0f', color2: '#a3e635' },
    { name: 'Mint Green', color1: '#047857', color2: '#6ee7b7' },
    { name: 'Deep Sky Blue', color1: '#0369a1', color2: '#0ea5e9' },
    { name: 'Pale Green', color1: '#166534', color2: '#86efac' },
    { name: 'Khaki', color1: '#713f12', color2: '#fbbf24' },
    { name: 'Golden Orange', color1: '#c2410c', color2: '#f59e0b' },
    { name: 'Dark Goldenrod', color1: '#92400e', color2: '#eab308' },
    { name: 'Brown Red', color1: '#7c2d12', color2: '#b91c1c' },
    { name: 'Cantaloupe', color1: '#c2410c', color2: '#fb923c' },
    { name: 'Peachy Rose', color1: '#be123c', color2: '#fb7185' },
    { name: 'Tomato', color1: '#b91c1c', color2: '#f87171' },
    { name: 'Light Sea Green', color1: '#047857', color2: '#5eead4' },
    { name: 'Medium Sea Green', color1: '#047857', color2: '#10b981' },
    { name: 'Chocolate Brown', color1: '#7c2d12', color2: '#92400e' },
    { name: 'Olive Green', color1: '#365314', color2: '#84cc16' },
    { name: 'Indigo', color1: '#312e81', color2: '#6366f1' },
    { name: 'Dark Orange', color1: '#c2410c', color2: '#fb923c' },
    { name: 'Coral Reef', color1: '#dc2626', color2: '#fb7185' },
    { name: 'Dark Gray', color1: '#374151', color2: '#6b7280' },
    { name: 'Light Steel Blue', color1: '#64748b', color2: '#94a3b8' },
    { name: 'Charcoal Grey', color1: '#374151', color2: '#4b5563' },
    { name: 'Steel Blue', color1: '#475569', color2: '#64748b' },
    { name: 'Saddle Brown', color1: '#7c2d12', color2: '#92400e' },
    { name: 'Chocolate Brown', color1: '#7c2d12', color2: '#92400e' },
    { name: 'Rustic Red', color1: '#7f1d1d', color2: '#b91c1c' },
    { name: 'Crimson Red', color1: '#7f1d1d', color2: '#dc2626' },
    { name: 'Onyx Black', color1: '#18181b', color2: '#3f3f46' },
    { name: 'Pewter', color1: '#374151', color2: '#6b7280' },
    { name: 'Tomato Red', color1: '#b91c1c', color2: '#f87171' },
    { name: 'Sky Blue', color1: '#0284c7', color2: '#38bdf8' },
    { name: 'Firebrick Red', color1: '#7f1d1d', color2: '#dc2626' },
    { name: 'Golden Amber', color1: '#b45309', color2: '#fbbf24' },
    { name: 'Forest Green', color1: '#14532d', color2: '#16a34a' },
    { name: 'Cadet Blue', color1: '#475569', color2: '#64748b' },
    { name: 'Slate Blue', color1: '#475569', color2: '#64748b' },
    { name: 'Orange Red', color1: '#c2410c', color2: '#f97316' },
    { name: 'Sea Green', color1: '#047857', color2: '#10b981' },
    { name: 'Burnt Orange', color1: '#c2410c', color2: '#fb923c' },
    { name: 'Light Sea Green', color1: '#047857', color2: '#5eead4' },
    { name: 'Burgundy', color1: '#7f1d1d', color2: '#991b1b' },
    { name: 'Deep Pink', color1: '#be185d', color2: '#ec4899' },
    { name: 'Thistle', color1: '#6b21a8', color2: '#c084fc' },
    { name: 'Medium Purple', color1: '#6b21a8', color2: '#a855f7' },
    { name: 'Medium Slate Blue', color1: '#475569', color2: '#6366f1' },
    { name: 'Moccasin', color1: '#92400e', color2: '#fbbf24' },
    { name: 'Indigo', color1: '#312e81', color2: '#6366f1' },
    { name: 'Blue Violet', color1: '#1e3a8a', color2: '#6366f1' },
    { name: 'Khaki', color1: '#713f12', color2: '#fbbf24' },
    { name: 'Light Cyan', color1: '#06b6d4', color2: '#67e8f9' },
    { name: 'Mint Green', color1: '#047857', color2: '#6ee7b7' },
    { name: 'Medium Spring Green', color1: '#059669', color2: '#34d399' },
    { name: 'Sea Green', color1: '#047857', color2: '#10b981' },
    { name: 'Yellow', color1: '#a16207', color2: '#fbbf24' },
    { name: 'Deep Sky Blue', color1: '#0369a1', color2: '#0ea5e9' }
  ];

  const handleSelectGradient = (gradient) => {
    setColor1(gradient.color1);
    setColor2(gradient.color2);
    setShowPredefinedGradients(false);
  };

  const handleApplyColors = () => {
    // Save colors to localStorage for the dynamic navbar
    const navbarColors = {
      color1: color1,
      color2: color2
    };
    localStorage.setItem('navbarColors', JSON.stringify(navbarColors));
    
    // Set as default colors in the component state
    setDefaultColors(navbarColors);
    
    // Show success message and refresh page
    alert('Colors applied successfully! The page will refresh to update the navbar.');
    window.location.reload();
  };

  const setDefaultColors = (colors) => {
    // This could be used to persist default colors to backend or localStorage
    localStorage.setItem('defaultNavbarColors', JSON.stringify(colors));
  };

  const buildHierarchy = (menus, parentId = 0) => {
    console.log('Building hierarchy for parentId:', parentId);
    const filtered = menus.filter(menu => menu.parent_id === parentId);
    console.log('Filtered menus:', filtered);
    const sorted = filtered.sort((a, b) => a.order_no - b.order_no);
    console.log('Sorted menus:', sorted);
    return sorted.map(menu => ({
      ...menu,
      children: buildHierarchy(menus, menu.id)
    }));
  };

  const getSubMenus = (parentMenu) => {
    return menus
      .filter(menu => menu.parent_id === parentMenu.id)
      .sort((a, b) => a.order_no - b.order_no);
  };

  const renderMenuHierarchy = (menuList, level = 0) => {
    return menuList.map(menu => (
      <div key={menu.id} style={{ marginLeft: `${level * 20}px` }}>
        <MenuCard
          menu={menu}
          onEdit={handleEditMenu}
          onApprove={handleApproveMenu}
          onDelete={handleDeleteMenu}
          onViewSubItems={handleViewSubItems}
        />
        {menu.children && menu.children.length > 0 && 
          renderMenuHierarchy(menu.children, level + 1)
        }
      </div>
    ));
  };

  if (currentParentMenu) {
    // If we're in sub-items view and showAddForm is true, show the form
    if (showAddForm) {
      return (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={handleCancelForm}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                backgroundColor: '#f9fafb',
                color: '#111827',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Back to Sub-items
            </button>
          </div>
          
          <AddMenuItemForm
            menu={editingMenu}
            onSave={handleSaveMenu}
            onCancel={handleCancelForm}
            existingMenus={menus}
            parentMenu={currentParentMenu}
          />
        </div>
      );
    }

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleBackToParent}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#111827',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Back to Main Menu
          </button>
        </div>

        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '20px', marginBottom: '16px' }}>
            Sub-items for: {currentParentMenu.menu_name_en}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            Parent Menu: {currentParentMenu.menu_name_en} (Order: {currentParentMenu.order_no})
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px' 
          }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              Menu Items ({getSubMenus(currentParentMenu).length})
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleForceReload}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #f59e0b',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                title="Force reload menus from storage"
              >
                🔄 Reload
              </button>
              <button
                onClick={() => {
                  setEditingMenu(null);
                  setShowAddForm(true);
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #3b82f6',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add Menu Item
              </button>
            </div>
          </div>

          {getSubMenus(currentParentMenu).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                No menu items found
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Create your first sub-menu item under "{currentParentMenu.menu_name_en}"
              </div>
            </div>
          ) : (
            <div>
              {getSubMenus(currentParentMenu).map((menu) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  onEdit={handleEditMenu}
                  onApprove={handleApproveMenu}
                  onDelete={handleDeleteMenu}
                  onViewSubItems={handleViewSubItems}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={handleCancelForm}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#111827',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Back to Menu List
          </button>
        </div>
        
        <AddMenuItemForm
          menu={editingMenu}
          onSave={handleSaveMenu}
          onCancel={handleCancelForm}
          existingMenus={menus}
          parentMenu={currentParentMenu}
        />
      </div>
    );
  }

  const hierarchicalMenus = buildHierarchy(menus);
  console.log('All menus:', menus);
  console.log('Hierarchical menus (top level):', hierarchicalMenus);

  return (
    <div>
      <div className="page">
        {!showColorPicker ? (
          <>
            {/* Page Colour Button */}
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
              <button
                style={{
                  padding: '8px 16px',
                  border: '1px solid #10b981',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.borderColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.borderColor = '#10b981';
                }}
                onClick={handlePageColourClick}
              >
                Page Colour
              </button>
            </div>

            {/* Navbar Preview Section */}
            <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px' 
              }}>
                <div style={{ fontWeight: 700, fontSize: '20px' }}>
                  Navbar Preview (Approved Menus Only)
                </div>
                <button
                  onClick={() => {
                    // Trigger navbar refresh
                    window.dispatchEvent(new CustomEvent('menusUpdated', { detail: menus }));
                    alert('Navbar refreshed! Check the public homepage to see updates.');
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #10b981',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Refresh Navbar
                </button>
              </div>
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '16px',
                backgroundColor: '#f9fafb'
              }}>
                {hierarchicalMenus.filter(menu => menu.status === 'Approved').length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#6b7280', 
                    fontStyle: 'italic',
                    padding: '20px' 
                  }}>
                    No approved menus to display. Create and approve menus to see them here.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {hierarchicalMenus
                      .filter(menu => menu.status === 'Approved')
                      .map(menu => (
                        <div 
                          key={menu.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          {menu.menu_name_en} {menu.children && menu.children.length > 0 && '▼'}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#6b7280',
                textAlign: 'center'
              }}>
                💡 Approved menus appear in the DynamicNavbar on the public homepage
              </div>
            </div>

            {/* Block Name Section */}
            <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '20px', marginBottom: '16px' }}>
                Main Menu Section
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Block Name (English)</label>
                  <input
                    type="text"
                    value={blockName.english}
                    onChange={(e) => setBlockName(prev => ({ ...prev, english: e.target.value }))}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Block Name (Kannada)</label>
                  <input
                    type="text"
                    value={blockName.kannada}
                    onChange={(e) => setBlockName(prev => ({ ...prev, kannada: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Menu Items List */}
            <div style={{ marginTop: '20px' }}>
              {showAddForm ? (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={handleCancelForm}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#f9fafb',
                        color: '#111827',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '12px'
                      }}
                    >
                      Cancel
                    </button>
                    <span style={{ fontWeight: '500', color: '#374151' }}>
                      {editingMenu ? 'Editing Menu Item' : 'Adding New Menu Item'}
                    </span>
                  </div>
                  
                  <AddMenuItemForm
                    menu={editingMenu}
                    onSave={handleSaveMenu}
                    onCancel={handleCancelForm}
                    existingMenus={menus}
                    parentMenu={currentParentMenu}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '16px' 
                  }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      Menu Items ({hierarchicalMenus.length})
                    </h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleForceReload}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #f59e0b',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                        title="Force reload menus from storage"
                      >
                        🔄 Reload
                      </button>
                      <button
                        onClick={handleAddMenu}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #3b82f6',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Add Menu Item
                      </button>
                    </div>
                  </div>

                  {hierarchicalMenus.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                        No menu items found
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
                        Debug: Total menus: {menus.length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
                        Debug: Hierarchical menus: {hierarchicalMenus.length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
                        Debug: All menus: {JSON.stringify(menus, null, 2)}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={handleAddMenu}
                          style={{
                            padding: '10px 20px',
                            border: '1px solid #3b82f6',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Add Your First Menu Item
                        </button>
                        <button
                          onClick={handleCreateSampleData}
                          style={{
                            padding: '10px 20px',
                            border: '1px solid #10b981',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Create Sample Data
                        </button>
                        <button
                          onClick={handleDebugLocalStorage}
                          style={{
                            padding: '10px 20px',
                            border: '1px solid #f59e0b',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          🐛 Debug Storage
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {hierarchicalMenus.map((menu) => (
                        <MenuCard
                          key={menu.id}
                          menu={menu}
                          onEdit={handleEditMenu}
                          onApprove={handleApproveMenu}
                          onDelete={handleDeleteMenu}
                          onViewSubItems={handleViewSubItems}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Color Picker Section */
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={handleBackToMenu}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#f9fafb',
                  color: '#111827',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Back to Menu
              </button>
            </div>

            <h3 style={{ fontWeight: 700, fontSize: '20px', marginBottom: '20px' }}>
              Page Colour Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Select Color 1:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{color1}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Select Color 2:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{color2}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Preview:
              </label>
              <div
                style={{
                  height: '100px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
                  border: '1px solid #d1d5db'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  padding: '10px 20px',
                  border: '1px solid #10b981',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.borderColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.borderColor = '#10b981';
                }}
                onClick={handleUsePredefinedClick}
              >
                Use Predefined
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  border: '1px solid #3b82f6',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={handleApplyColors}
              >
                Apply Colors
              </button>
            </div>
          </div>
        )}

        {/* Predefined Gradients Modal */}
        {showPredefinedGradients && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              {/* Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                  Select a Gradient
                </h2>
                <button
                  onClick={handleClosePredefinedGradients}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  ×
                </button>
              </div>

              {/* Gradients Grid */}
              <div style={{
                padding: '20px',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {predefinedGradients.map((gradient, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectGradient(gradient)}
                      style={{
                        cursor: 'pointer',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          height: '80px',
                          background: `linear-gradient(135deg, ${gradient.color1} 0%, ${gradient.color2} 100%)`
                        }}
                      />
                      <div style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        backgroundColor: 'white'
                      }}>
                        {gradient.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
