import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MenuCard from '../components/MenuCard.jsx';
import AddMenuItemForm from '../components/AddMenuItemForm.jsx';
import { listMenus, createMenu, updateMenu, deleteMenu, getTheme, updateTheme, createPage, getPageBySlug } from '../api/resources.js';
import { usePermissions } from '../utils/rolePermissions';
import './UserManagementContent.css';

export default function MenusPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menus, setMenus] = useState([]);
  const [searchParams] = useSearchParams();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const canReview = isAdmin || isSuperAdmin;
  const [highlightedMenuId, setHighlightedMenuId] = useState(null);
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [color1, setColor1] = useState('');
  const [color2, setColor2] = useState('');
  const [showPredefinedGradients, setShowPredefinedGradients] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [currentParentMenu, setCurrentParentMenu] = useState(null);
  const [currentParentPath, setCurrentParentPath] = useState([]); // Track hierarchy path as indices
  const [blockName, setBlockName] = useState({
    english: 'Main Menu',
    kannada: 'ಮುಖ್ಯ ಮೆನು'
  });
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    // Load current navbar colors from database
    const loadTheme = async () => {
      try {
        const theme = await getTheme('navbar');
        if (theme && theme.colors) {
          setColor1(theme.colors.color1);
          setColor2(theme.colors.color2);
        } else {
          // Use hardcoded defaults if no theme exists
          setColor1('#3b82f6');
          setColor2('#14b8a6');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Fallback to hardcoded defaults
        setColor1('#3b82f6');
        setColor2('#14b8a6');
      }
    };

    loadTheme();
  }, []);

  async function fetchMenus() {
    setLoading(true);
    setError(null);
    try {
      const res = await listMenus();
      const menus = res || [];

      // Count total nested items
      const countNested = (items, depth = 0) => {
        let count = 0;
        if (items && Array.isArray(items)) {
          items.forEach(item => {
            count++;
            if (item.items && Array.isArray(item.items)) {
              count += countNested(item.items, depth + 1);
            }
          });
        }
        return count;
      };

      // Ensure all menu items have unique IDs for nested operations
      const addTempIds = (items, path = '') => {
        return items.map((item, index) => {
          // Create stable ID based on content and position
          const contentHash = `${item.title?.en || ''}-${item.url || ''}-${item.order || 0}`;
          const stableId = item._id || `temp-${path}-${index}-${contentHash}`;
          return {
            ...item,
            _id: stableId,
            items: item.items ? addTempIds(item.items, `${path}-${index}`) : []
          };
        });
      };

      const menusWithIds = menus.map(menu => ({
        ...menu,
        items: menu.items ? addTempIds(menu.items) : []
      }));
      return menusWithIds;
    } catch (e) {
      console.error('❌ Error fetching menus:', e);
      setError(e);
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load menus from database
    fetchMenus().then(apiMenus => {
      if (apiMenus && apiMenus.length > 0) {
        setMenus(apiMenus);
      }
    });
  }, []);

  const findItemPath = (menuList, targetId) => {
    const findInItems = (items, path) => {
      if (!items) return null;
      for (const item of items) {
        if (String(item._id) === String(targetId)) {
          return { path, item };
        }
        if (item.items && item.items.length > 0) {
          const result = findInItems(item.items, [...path, item]);
          if (result) return result;
        }
      }
      return null;
    };

    for (const menu of menuList) {
      const result = findInItems(menu.items || [], [menu]);
      if (result) return result;
    }
    return null;
  };

  useEffect(() => {
    if (!menus.length) return;

    const menuId = searchParams.get('highlightMenu');
    const itemId = searchParams.get('highlightItem');

    if (itemId) {
      const result = findItemPath(menus, itemId);
      if (result && result.path && result.path.length > 0) {
        const parentPath = result.path;
        const parentMenu = parentPath[parentPath.length - 1];
        setCurrentParentPath(parentPath);
        setCurrentParentMenu(parentMenu);
        setHighlightedItemId(itemId);
        setHighlightedMenuId(null);
        const timer = setTimeout(() => setHighlightedItemId(null), 4000);
        return () => clearTimeout(timer);
      }
    } else if (menuId) {
      setCurrentParentMenu(null);
      setCurrentParentPath([]);
      setHighlightedMenuId(menuId);
      setHighlightedItemId(null);
      const timer = setTimeout(() => setHighlightedMenuId(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, menus]);

  // Debug: Log when menus state changes
  useEffect(() => {
    // Removed debug logs
  }, [menus]);

  // Remove automatic saving on menu change to avoid conflicts
  // useEffect(() => {

  // Removed saveMenusToStorage function - menus are now stored only in database

  const handleViewSubItems = (parentMenu) => {
    setCurrentParentMenu(parentMenu);
    setCurrentParentPath(prev => [...prev, parentMenu]);
    setShowAddForm(false);
    setEditingMenu(null);
  };

  const handleBackToParent = () => {
    if (currentParentPath.length > 1) {
      // Go back to previous level in hierarchy
      const newPath = [...currentParentPath];
      newPath.pop();
      setCurrentParentPath(newPath);
      setCurrentParentMenu(newPath[newPath.length - 1]);
    } else {
      // Back to main menu
      setCurrentParentMenu(null);
      setCurrentParentPath([]);
    }
  };

  const handleAddMenu = () => {
    setEditingMenu(null);
    setShowAddForm(true);
  };

  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setShowAddForm(true);
  };

  const handleSaveMenu = async (menuData) => {
    setLoading(true);
    setError(null);
    
    try {
      const statusForSave = canReview ? (menuData.status || 'Created') : 'Created';
      const statusForEdit = canReview ? (menuData.status || editingMenu?.status || 'Created') : 'Created';

      // Transform frontend data to backend format
      const slug = (menuData.menu_name_en || menuData.name?.en || '').toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `menu-${Date.now()}`;

      const newItem = {
        _id: editingMenu?._id,
        title: {
          en: menuData?.menu_name_en || '',
          kn: menuData?.menu_name_kn || ''
        },
        url: menuData?.url_en || '',
        redirect_url: menuData?.redirect_url || '',
        order: menuData?.order_no || 0,
        target: '_self',
        status: statusForEdit,
        items: []
      };

      const transformedData = {
        name: {
          en: menuData.menu_name_en || menuData.name?.en || '',
          kn: menuData.menu_name_kn || menuData.name?.kn || ''
        },
        slug: slug,
        type: 'navigation', // Default type
        status: statusForSave, // Set status field
        active: statusForSave === 'Approved' || menuData.active,
        order: menuData.order_no || menuData.order || 0,
        url: menuData.url_en || '',
        redirect_url: menuData.redirect_url || '',
        items: []
      };

      if (editingMenu && editingMenu.parentMenu && editingMenu.itemIndex !== undefined) {
        // Update existing subitem (handle both single level and deeply nested)
        const parentPath = editingMenu.parentPath || currentParentPath;
        
        if (parentPath && parentPath.length > 0) {
          // Handle deeply nested subitem
          let currentLevel = menus;
          let targetMenu = null;
          
          // Navigate to the correct level using the parent path
          for (let i = 0; i < parentPath.length; i++) {
            const pathItem = parentPath[i];
            if (i === 0) {
              // First level - find the root menu
              targetMenu = currentLevel.find(menu => 
                menu._id === pathItem._id || menu.id === pathItem._id
              );
              if (targetMenu) {
                currentLevel = targetMenu.items || [];
              }
            } else {
              // Subsequent levels - navigate through items
              targetMenu = currentLevel.find(item => 
                item._id === pathItem._id || item.id === pathItem._id
              );
              if (targetMenu) {
                currentLevel = targetMenu.items || [];
              }
            }
          }
          
          // Now update the subitem at the correct level
          if (targetMenu && currentLevel) {
            const currentItemIndex = currentLevel.findIndex(item => 
              item._id === editingMenu._id || item.id === editingMenu._id
            );
            
            if (currentItemIndex >= 0) {
              currentLevel[currentItemIndex] = {
                ...currentLevel[currentItemIndex],
                title: {
                  en: menuData.menu_name_en || '',
                  kn: menuData.menu_name_kn || ''
                },
                url: menuData.url_en || '',
                redirect_url: menuData.redirect_url || '',
                order: menuData.order_no || 0,
                target: '_self',
                status: statusForEdit
              };
              
              // Update the root menu with the updated nested structure
              const rootMenu = menus.find(menu => 
                menu._id === parentPath[0]._id || menu.id === parentPath[0]._id
              );
              
              if (rootMenu) {
                const updatedMenu = await updateMenu(rootMenu._id || rootMenu.id, rootMenu);
                const updated = menus.map(m =>
                  (m._id || m.id) === (rootMenu._id || rootMenu.id) ? updatedMenu : m
                );
                setMenus(updated);
                showNotification('success', 'Sub-item updated successfully!');
              }
            } else {
              console.error('Deeply nested subitem not found for update:', editingMenu._id);
              showNotification('error', 'Error: Subitem not found. Please refresh and try again.');
            }
          } else {
            console.error('Could not locate parent menu for nested subitem');
            showNotification('error', 'Error: Could not locate parent menu. Please refresh and try again.');
          }
        } else {
          // Handle single level subitem (original logic)
          const parentMenu = editingMenu.parentMenu;
          const updatedItems = [...(parentMenu.items || [])];
          const currentItemIndex = updatedItems.findIndex(item => item._id === editingMenu._id);

          if (currentItemIndex >= 0) {
            updatedItems[currentItemIndex] = {
              ...updatedItems[currentItemIndex],
              title: {
                en: menuData.menu_name_en || '',
                kn: menuData.menu_name_kn || ''
              },
              url: menuData.url_en || '',
              redirect_url: menuData.redirect_url || '',
              order: menuData.order_no || 0,
              target: '_self',
              status: statusForEdit
            };
            
            const updatedParent = {
              ...parentMenu,
              items: updatedItems
            };

            const response = await updateMenu(parentMenu._id || parentMenu.id, updatedParent);
            const updated = menus.map(m =>
              (m._id || m.id) === (parentMenu._id || parentMenu.id) ? response : m
            );
            setMenus(updated);
            showNotification('success', 'Sub-item updated successfully!');
          } else {
            console.error('Subitem not found for update:', editingMenu._id);
            showNotification('error', 'Error: Subitem not found. Please refresh and try again.');
          }
        }

        // Dispatch event to notify navbar of menu changes
        window.dispatchEvent(new CustomEvent('menusUpdated', { detail: menus }));
        setShowAddForm(false);
        setEditingMenu(null);
        setLoading(false);
        return;
      }

      // If we're in a sub-menu context, handle parent-child relationship
      if (currentParentMenu) {
        // For sub-items, we need to add them as items to the correct nested location
        const rootParent = currentParentPath[0]; // Always the root menu
        const rootParentId = rootParent._id || rootParent.id;

        const newItem = {
          title: {
            en: menuData?.menu_name_en || '',
            kn: menuData?.menu_name_kn || ''
          },
          url: menuData?.url_en || '',
          redirect_url: menuData?.redirect_url || '',
          order: menuData?.order_no || 0,
          target: '_self',
          status: statusForSave,
          items: [] // Ensure items array exists
        };


        // Add the item at the correct nested location
        const addNestedItem = (items, pathIndex = 1) => {
          if (pathIndex === currentParentPath.length) {
            // We're at the current level, add the new item
            return [...items, newItem];
          } else {
            // Traverse deeper
            const pathItem = currentParentPath[pathIndex];
            // Match by _id for reliable identification
            const itemIndex = items.findIndex(item =>
              item._id === pathItem._id
            );
            if (itemIndex >= 0) {
              const updatedItems = [...items];
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                items: addNestedItem(updatedItems[itemIndex].items || [], pathIndex + 1)
              };
              return updatedItems;
            }
          }
          return items;
        };

        const updatedItems = addNestedItem(rootParent.items || []);
        const updatedParent = {
          ...rootParent,
          items: updatedItems
        };

        const response = await updateMenu(rootParentId, updatedParent);

        // Check if the new sub-item is in the response
        const hasNewSubItem = (items) => {
          if (!items || !Array.isArray(items)) return false;
          for (const item of items) {
            if (item.title?.en === newItem.title.en && item.url === newItem.url) {
              return true;
            }
            if (item.items && hasNewSubItem(item.items)) {
              return true;
            }
          }
          return false;
        };

        const backendHasNewItem = response && hasNewSubItem(response.items);

        // Process the updated menu with temp IDs
        const addTempIds = (items, path = '') => {
          return items.map((item, index) => {
            // Create stable ID based on content and position
            const contentHash = `${item.title?.en || ''}-${item.url || ''}-${item.order || 0}`;
            const stableId = item._id || `temp-${path}-${index}-${contentHash}`;
            return {
              ...item,
              _id: stableId,
              items: item.items ? addTempIds(item.items, `${path}-${index}`) : []
            };
          });
        };

        const processedResponse = {
          ...response,
          items: response.items ? addTempIds(response.items) : []
        };

        // Update local state to show changes immediately
        const updatedMenus = menus.map(menu =>
          (menu._id || menu.id) === (processedResponse._id || processedResponse.id) ? processedResponse : menu
        );
        setMenus(updatedMenus);

        // Auto-create page if sub-item has a URL
        const subItemUrl = newItem.url;
        if (subItemUrl && subItemUrl !== '#') {
          try {
            const slug = subItemUrl.startsWith('/') ? subItemUrl.slice(1) : subItemUrl;
            try {
              await getPageBySlug(slug);
              console.log('Page already exists for slug:', slug);
            } catch (pageNotFound) {
              await createPage({
                title: {
                  en: newItem.title?.en || menuData.menu_name_en || 'New Page',
                  kn: newItem.title?.kn || menuData.menu_name_kn || ''
                },
                slug: slug,
                content: {
                  en: `<h1>${newItem.title?.en || menuData.menu_name_en || 'New Page'}</h1><p>Welcome to the ${newItem.title?.en || menuData.menu_name_en || 'new page'}.</p>`,
                  kn: newItem.title?.kn ? `<h1>${newItem.title?.kn}</h1><p>ಸ್ವಾಗತ</p>` : ''
                },
                status: canReview ? 'approved' : 'pending'
              });
              console.log('Auto-created page for slug:', slug);
            }
          } catch (pageError) {
            console.error('Failed to auto-create page:', pageError);
          }
        }

        // Dispatch event to notify navbar of menu changes
        window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updatedMenus }));

        showNotification('success', 'Sub-item created successfully!');
        setShowAddForm(false);
        setEditingMenu(null);
        setLoading(false);
        return;
      } else if (editingMenu && !editingMenu.title) {
        // Update existing menu via API
        const menuId = editingMenu._id || editingMenu.id;
        const response = await updateMenu(menuId, transformedData);
        const updatedMenu = response;

        // Process with temp IDs
        const addTempIds = (items, path = '') => {
          return items.map((item, index) => {
            // Create stable ID based on content and position
            const contentHash = `${item.title?.en || ''}-${item.url || ''}-${item.order || 0}`;
            const stableId = item._id || `temp-${path}-${index}-${contentHash}`;
            return {
              ...item,
              _id: stableId,
              items: item.items ? addTempIds(item.items, `${path}-${index}`) : []
            };
          });
        };

        const processedMenu = {
          ...updatedMenu,
          items: updatedMenu.items ? addTempIds(updatedMenu.items) : []
        };

        // Update local state to show changes immediately
        const updatedMenus = menus.map(menu => (menu._id || menu.id) === (processedMenu._id || processedMenu.id) ? processedMenu : menu);
        setMenus(updatedMenus);

        // Dispatch event to notify navbar of menu changes
        window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updatedMenus }));

        showNotification('success', 'Menu updated successfully!');
        setShowAddForm(false);
        setEditingMenu(null);
        setLoading(false);
        return;
      } else if (editingMenu) {
        // Editing top-level item
        const parentMenu = menus.find(menu => menu.items && menu.items.some(item => item._id.toString() === editingMenu._id.toString()));
        if (parentMenu) {
          const updatedItems = parentMenu.items.map(item => item._id.toString() === editingMenu._id.toString() ? newItem : item);
          const response = await updateMenu(parentMenu._id || parentMenu.id, { items: updatedItems });
          const updated = menus.map(menu => (menu._id || menu.id) === (parentMenu._id || parentMenu.id) ? response : menu);
          setMenus(updated);
          window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updated }));
          showNotification('success', 'Item updated successfully!');
          setShowAddForm(false);
          setEditingMenu(null);
          setLoading(false);
          return;
        }

        // Dispatch event to notify navbar of menu changes
        window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updated }));
      } else {
        // Add new menu via API
        try {
          const response = await createMenu(transformedData);
          const newMenu = response; // API returns the created menu directly

          // Auto-create page if menu has a URL (for top-level items)
          const menuUrl = transformedData.url;
          if (menuUrl && menuUrl !== '#' && !editingMenu) {
            try {
              // Extract slug from URL (e.g., "/about" -> "about")
              const slug = menuUrl.startsWith('/') ? menuUrl.slice(1) : menuUrl;
              
              // Check if page already exists
              try {
                await getPageBySlug(slug);
                console.log('Page already exists for slug:', slug);
              } catch (pageNotFound) {
                // Page doesn't exist, create it
                await createPage({
                  title: {
                    en: transformedData.name?.en || menuData.menu_name_en || 'New Page',
                    kn: transformedData.name?.kn || menuData.menu_name_kn || ''
                  },
                  slug: slug,
                  content: {
                    en: `<h1>${transformedData.name?.en || menuData.menu_name_en || 'New Page'}</h1><p>Welcome to the ${transformedData.name?.en || menuData.menu_name_en || 'new page'}.</p>`,
                    kn: transformedData.name?.kn ? `<h1>${transformedData.name?.kn}</h1><p>ಸ್ವಾಗತ</p>` : ''
                  },
                  status: canReview ? 'approved' : 'pending'
                });
                console.log('Auto-created page for slug:', slug);
              }
            } catch (pageError) {
              console.error('Failed to auto-create page:', pageError);
            }
          }

          // Process the new menu with temp IDs like fetchMenus does
          const addTempIds = (items, path = '') => {
            return items.map((item, index) => {
              // Create stable ID based on content and position
              const contentHash = `${item.title?.en || ''}-${item.url || ''}-${item.order || 0}`;
              const stableId = item._id || `temp-${path}-${index}-${contentHash}`;
              return {
                ...item,
                _id: stableId,
                items: item.items ? addTempIds(item.items, `${path}-${index}`) : []
              };
            });
          };

          const processedMenu = {
            ...newMenu,
            items: newMenu.items ? addTempIds(newMenu.items) : []
          };

          // Update local state to show changes immediately
          setMenus(prevMenus => [...prevMenus, processedMenu]);

          // Dispatch event to notify navbar of menu changes
          window.dispatchEvent(new CustomEvent('menusUpdated', { detail: [...menus, processedMenu] }));

          showNotification('success', 'Menu created successfully!');
          setShowAddForm(false);
          setEditingMenu(null);
          setLoading(false);
          return;
  
          // Dispatch event to notify navbar of menu changes
          window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updated }));
        } catch (createError) {
          setError('Failed to create menu: ' + (createError.message || createError));

          showNotification('error', 'Failed to create menu: ' + (createError.message || 'Unknown error'));
        }
      }
      
      setShowAddForm(false);
      setEditingMenu(null);
      
    } catch (error) {
      console.error('Error saving menu:', error);
      setError('Failed to save menu. Please try again.');
      setShowAddForm(false);
      setEditingMenu(null);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleForceReload = async () => {
    // Force reload menus from database
    const freshMenus = await fetchMenus();
    setMenus(freshMenus);
    showNotification('success', `Force reloaded ${freshMenus.length} menus from database!`);
  };

  const handleCreateSampleData = async () => {
    setLoading(true);
    setError(null);
    
    const sampleMenus = [
      {
        menu_name_en: 'Home',
        menu_name_kn: 'ಮುಖಪುಟ',
        url_en: '/',
        url_kn: '/kn',
        parent_id: 0,
        status: 'Approved',
        order_no: 1
      },
      {
        menu_name_en: 'About Us',
        menu_name_kn: 'ನಮ್ಮ ಬಗ್ಗೆ',
        url_en: '/about',
        url_kn: '/kn/about',
        parent_id: 0,
        status: 'Approved',
        order_no: 2
      },
      {
        menu_name_en: 'Services',
        menu_name_kn: 'ಸೇವೆಗಳು',
        url_en: '/services',
        url_kn: '/kn/services',
        parent_id: 0,
        status: 'Created', // Mix of statuses to test
        order_no: 3
      }
    ];
    
    try {
      // Create each menu item in database via API
      for (const menuData of sampleMenus) {
        console.log('Creating menu:', menuData.menu_name_en);
        const response = await createMenu(menuData);
        console.log('Created menu:', response.data);
      }
      
      // Refresh menus from database to get the created items
      const freshMenus = await fetchMenus();
      setMenus(freshMenus);

      showNotification('success', 'Sample data created successfully in database! Check navbar and menu list.');
    } catch (error) {
      console.error('Error creating sample data:', error);
      setError('Failed to create sample data');
    } finally {
      setLoading(false);
    }
  };

      const handleApproveMenu = async (menuId) => {
        if (!canReview) {
          showNotification('error', 'You do not have permission to approve menus.');
          return;
        }
        setLoading(true);
        setError(null);
    
        try {
          // Find menu to update
          const menuToUpdate = menus.find(m => (m._id || m.id) === menuId);
          const apiMenuId = menuToUpdate ? (menuToUpdate._id || menuToUpdate.id) : menuId;
    
          console.log('Approving menu:', menuId, 'API ID:', apiMenuId);
    
          // Update menu status via API
          const response = await updateMenu(apiMenuId, { status: 'Approved', active: true });
          console.log('API response:', response);

          // For top-level menu approval, we need to update the entire menu from backend
          // since approval might change other fields too
          const approvalResponse = await updateMenu(apiMenuId, { status: 'Approved', active: true });
          console.log('API response:', approvalResponse);

          // Process with temp IDs
          const addTempIds = (items, path = '') => {
            return items.map((item, index) => {
              // Create stable ID based on content and position
              const contentHash = `${item.title?.en || ''}-${item.url || ''}-${item.order || 0}`;
              const stableId = item._id || `temp-${path}-${index}-${contentHash}`;
              return {
                ...item,
                _id: stableId,
                items: item.items ? addTempIds(item.items, `${path}-${index}`) : []
              };
            });
          };

          const processedMenu = {
            ...approvalResponse,
            items: approvalResponse.items ? addTempIds(approvalResponse.items) : []
          };

          // Update local state to show changes immediately
          console.log('🔄 Updating local state to show approved menu');
          const updatedMenus = menus.map(menu =>
            (menu._id || menu.id) === (processedMenu._id || processedMenu.id) ? processedMenu : menu
          );
          setMenus(updatedMenus);

          // Dispatch event to notify navbar of menu changes
          window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updatedMenus }));

          showNotification('success', 'Menu approved successfully!');
          setLoading(false);
          return;
    
          // Refresh from database to ensure we have latest data
          setTimeout(async () => {
            const freshMenus = await fetchMenus();
            setMenus(freshMenus);
          }, 1000);
    
        } catch (error) {
          console.error('Error approving menu:', error);
          setError('Failed to approve menu: ' + (error.message || error));
        } finally {
          setLoading(false);
        }
      };

      const handleRejectMenu = async (menuId) => {
        if (!canReview) {
          showNotification('error', 'You do not have permission to reject menus.');
          return;
        }
        setLoading(true);
        setError(null);

        try {
          const menuToUpdate = menus.find(m => (m._id || m.id) === menuId);
          const apiMenuId = menuToUpdate ? (menuToUpdate._id || menuToUpdate.id) : menuId;

          const rejectionResponse = await updateMenu(apiMenuId, { status: 'Rejected', active: false });

          const addTempIds = (items, path = '') => {
            return items.map((item, index) => {
              const contentHash = `${item.title?.en || ''}-${item.url || ''}-${item.order || 0}`;
              const stableId = item._id || `temp-${path}-${index}-${contentHash}`;
              return {
                ...item,
                _id: stableId,
                items: item.items ? addTempIds(item.items, `${path}-${index}`) : []
              };
            });
          };

          const processedMenu = {
            ...rejectionResponse,
            items: rejectionResponse.items ? addTempIds(rejectionResponse.items) : []
          };

          const updatedMenus = menus.map(menu =>
            (menu._id || menu.id) === (processedMenu._id || processedMenu.id) ? processedMenu : menu
          );
          setMenus(updatedMenus);

          window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updatedMenus }));

          showNotification('success', 'Menu rejected.');
        } catch (error) {
          console.error('Error rejecting menu:', error);
          setError('Failed to reject menu: ' + (error.message || error));
        } finally {
          setLoading(false);
        }
      };
    
      const handleApproveSubItem = async (parentMenu, subItem) => {
        if (!canReview) {
          showNotification('error', 'You do not have permission to approve menu items.');
          return;
        }
        setLoading(true);
        setError(null);

        try {
          // Find the root parent menu
          const rootParent = currentParentPath[0];

          // Update the nested item by finding it by _id recursively
          const updateItemById = (items) => {
            return items.map(item => {
              if (item._id === subItem._id) {
                // Found the item to update
                return { ...item, status: 'Approved' };
              } else if (item.items && item.items.length > 0) {
                // Recursively search in sub-items
                return {
                  ...item,
                  items: updateItemById(item.items)
                };
              }
              return item;
            });
          };

          const updatedItems = updateItemById(rootParent.items || []);
          const updatedParent = {
            ...rootParent,
            items: updatedItems
          };

          const response = await updateMenu(rootParent._id || rootParent.id, updatedParent);

          // Update local state
          const updated = menus.map(m =>
            (m._id || m.id) === (rootParent._id || rootParent.id) ? response : m
          );
          setMenus(updated);

          // Dispatch event to notify navbar of menu changes
          window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updated }));

          showNotification('success', 'Sub-item approved successfully!');

        } catch (error) {
          console.error('Error approving sub-item:', error);
          setError('Failed to approve sub-item: ' + (error.message || error));
        } finally {
          setLoading(false);
        }
      };

      const handleRejectSubItem = async (parentMenu, subItem) => {
        if (!canReview) {
          showNotification('error', 'You do not have permission to reject menu items.');
          return;
        }
        setLoading(true);
        setError(null);

        try {
          const rootParent = currentParentPath[0];

          const updateItemById = (items) => {
            return items.map(item => {
              if (item._id === subItem._id) {
                return { ...item, status: 'Rejected' };
              } else if (item.items && item.items.length > 0) {
                return {
                  ...item,
                  items: updateItemById(item.items)
                };
              }
              return item;
            });
          };

          const updatedItems = updateItemById(rootParent.items || []);
          const updatedParent = {
            ...rootParent,
            items: updatedItems
          };

          const response = await updateMenu(rootParent._id || rootParent.id, updatedParent);

          const updated = menus.map(m =>
            (m._id || m.id) === (rootParent._id || rootParent.id) ? response : m
          );
          setMenus(updated);

          window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updated }));

          showNotification('success', 'Sub-item rejected.');
        } catch (error) {
          console.error('Error rejecting sub-item:', error);
          setError('Failed to reject sub-item: ' + (error.message || error));
        } finally {
          setLoading(false);
        }
      };

  const handleDeleteMenu = async (menuId) => {
    console.log('=== handleDeleteMenu called ===');
    console.log('Menu ID to delete:', menuId);
    console.log('Current menus before delete:', menus);

    if (window.confirm('Are you sure you want to delete this menu item?')) {
      setLoading(true);
      setError(null);

      try {
        // Find menu to get its proper ID
        const menuToDelete = menus.find(m => (m._id || m.id) === menuId);
        if (!menuToDelete) {
          throw new Error('Menu not found');
        }

        const apiMenuId = menuToDelete._id || menuToDelete.id;
        console.log('Deleting menu with API ID:', apiMenuId);

        // Delete via API
        await deleteMenu(apiMenuId);
        console.log('API delete successful');

        // Update local state - remove deleted menu
        const updated = menus.filter(m => (m._id || m.id) !== menuId);
        console.log('Updated menus after delete:', updated);

        setMenus(updated);

        // NO localStorage backup - rely on database
        console.log('✅ Menu deleted from database, no localStorage backup needed');

        showNotification('success', 'Menu deleted successfully!');

      } catch (error) {
        console.error('Error deleting menu:', error);
        setError('Failed to delete menu: ' + (error.message || error));
        showNotification('error', 'Failed to delete menu: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditSubItem = (parentMenu, subItem, itemIndex) => {
    // For editing subitems, we can set editingMenu to the subitem with additional context
    setEditingMenu({ ...subItem, parentMenu, itemIndex, parentPath: currentParentPath });
    setShowAddForm(true);
  };

  const handleDeleteSubItem = async (parentMenu, subItem, itemIndex) => {
    if (window.confirm('Are you sure you want to delete this sub-item?')) {
      setLoading(true);
      setError(null);

      try {
        // Find the root parent menu
        const rootParent = currentParentPath[0];

        // Delete the nested item by traversing the path
        const deleteNestedItem = (items, pathIndex = 1) => {
          if (pathIndex === currentParentPath.length) {
            // We're at the current level, remove the item
            return items.filter((_, index) => index !== itemIndex);
          } else {
            // Traverse deeper
            const pathItem = currentParentPath[pathIndex];
            // Match by content
            const itemIndexInParent = items.findIndex(item =>
              item.title?.en === pathItem.title?.en &&
              item.url === pathItem.url
            );
            if (itemIndexInParent >= 0) {
              const updatedItems = [...items];
              updatedItems[itemIndexInParent] = {
                ...updatedItems[itemIndexInParent],
                items: deleteNestedItem(updatedItems[itemIndexInParent].items || [], pathIndex + 1)
              };
              return updatedItems;
            }
          }
          return items;
        };

        const updatedItems = deleteNestedItem(rootParent.items || []);
        const updatedParent = {
          ...rootParent,
          items: updatedItems
        };

        const response = await updateMenu(rootParent._id || rootParent.id, updatedParent);

        // Process with temp IDs
        const addTempIds = (items, path = '') => {
          return items.map((item, index) => {
            // Create stable ID based on content and position
            const contentHash = `${item.title?.en || ''}-${item.url || ''}-${item.order || 0}`;
            const stableId = item._id || `temp-${path}-${index}-${contentHash}`;
            return {
              ...item,
              _id: stableId,
              items: item.items ? addTempIds(item.items, `${path}-${index}`) : []
            };
          });
        };

        const processedResponse = {
          ...response,
          items: response.items ? addTempIds(response.items) : []
        };

        // Update local state
        const updated = menus.map(m =>
          (m._id || m.id) === (rootParent._id || rootParent.id) ? processedResponse : m
        );
        setMenus(updated);

        // Dispatch event to notify navbar of menu changes
        window.dispatchEvent(new CustomEvent('menusUpdated', { detail: updated }));

        showNotification('success', 'Sub-item deleted successfully!');

      } catch (error) {
        console.error('Error deleting sub-item:', error);
        setError('Failed to delete sub-item: ' + (error.message || error));
      } finally {
        setLoading(false);
      }
    }
  };

const handleUsePredefinedClick = () => {
  setShowPredefinedGradients(true);
};

const handlePageColourClick = () => {
  setShowColorPicker(true);
};

const handleBackToMenu = () => {
  setShowColorPicker(false);
};

const handleCancelForm = () => {
  setShowAddForm(false);
  setEditingMenu(null);
};

// ... rest of the code remains the same ...

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

  const handleApplyColors = async () => {
    try {
      // Save colors to database
      const themeData = {
        type: 'navbar',
        colors: {
          color1: color1,
          color2: color2
        }
      };

      await updateTheme('navbar', themeData);

      // Trigger navbar refresh
      window.dispatchEvent(new CustomEvent('navbarColorsUpdated', { detail: { color1, color2 } }));
      showNotification('success', 'Navbar colors saved and applied! Check the public homepage to see the changes.');
    } catch (error) {
      console.error('Error saving theme:', error);
      showNotification('error', 'Failed to save navbar colors. Please try again.');
    }
  };

  // Removed setDefaultColors function as we now use database storage

  const buildHierarchy = (menus, parentId = 0) => {
    // Filter out null/undefined menus and then filter by parent_id
    const validMenus = menus.filter(menu => menu && menu !== null);
    const filtered = validMenus.filter(menu => menu.parent_id == parentId || (!menu.parent_id && parentId === 0));

    const sorted = filtered.sort((a, b) => (a.order_no || a.order || 0) - (b.order_no || b.order || 0));

    return sorted.map(menu => ({
      ...menu,
      children: buildHierarchy(validMenus, menu.id || menu._id)
    }));
  };

  const getSubMenus = (parentMenu) => {
    return menus
      .filter(menu => menu && menu !== null && menu.parent_id === (parentMenu.id || parentMenu._id))
      .sort((a, b) => a.order_no - b.order_no);
  };

  const countNestedItems = (items) => {
    let count = 0;
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        count++;
        if (item.items && Array.isArray(item.items)) {
          count += countNestedItems(item.items);
        }
      });
    }
    return count;
  };

  const getCurrentItems = () => {
    if (!currentParentMenu) return [];

    const items = currentParentMenu.items || [];
    console.log('🗂️ getCurrentItems: Items for', currentParentMenu.title?.en || currentParentMenu.name?.en, 'at depth', currentParentPath.length - 1, ':', items.length, 'items');
    return items;
  };

  const renderMenuHierarchy = (menuList, level = 0) => {
    return (
      <div style={{ marginLeft: `${level * 20}px` }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {menuList.map(menu => (
            <MenuCard
              key={menu._id || menu.id}
              menu={menu}
              onEdit={handleEditMenu}
              onApprove={handleApproveMenu}
              onReject={handleRejectMenu}
              onDelete={handleDeleteMenu}
              onViewSubItems={handleViewSubItems}
              canReview={canReview}
              highlighted={highlightedMenuId && String(highlightedMenuId) === String(menu._id || menu.id)}
            />
          ))}
        </div>
        {menuList.map(menu => (
          <div key={`nested-${menu.id}`}>
            {menu.children && menu.children.length > 0 &&
              renderMenuHierarchy(menu.children, level + 1)
            }
          </div>
        ))}
      </div>
    );
  };

  const renderSubItemHierarchy = (itemList, level = 0) => {
    console.log(`🏗️ Rendering hierarchy at level ${level} with ${itemList.length} items`);
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginLeft: level > 0 ? '20px' : '0'
      }}>
        {itemList.map((item, index) => {
          console.log(`📄 Rendering item ${index} at level ${level}:`, item.title?.en || item.name?.en, 'has', item.items?.length || 0, 'sub-items');
          return (
            <MenuCard
              key={`subitem-${level}-${index}`}
              menu={item}
              onEdit={() => handleEditSubItem(currentParentMenu, item, index)}
              onApprove={() => handleApproveSubItem(currentParentMenu, item)}
              onReject={() => handleRejectSubItem(currentParentMenu, item)}
              onDelete={() => handleDeleteSubItem(currentParentMenu, item, index)}
              onViewSubItems={handleViewSubItems}
              isSubItem={true}
              canReview={canReview}
              highlighted={highlightedItemId && String(highlightedItemId) === String(item._id)}
            />
          );
        })}
      </div>
    );
  };

  const renderNavbarPreview = (menuList) => {
    return menuList.map(menu => (
      <div key={menu._id || menu.id} style={{ display: 'inline-block', marginRight: '8px', marginBottom: '8px' }}>
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'inline-block'
          }}
        >
          {menu.name?.en || menu.menu_name_en}
        </div>
        {menu.children && menu.children.length > 0 && (
          <div style={{ display: 'inline-block', marginLeft: '8px' }}>
            {menu.children.map(child => (
              <div
                key={child._id || child.id}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#60a5fa',
                  color: 'white',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'inline-block',
                  marginRight: '4px',
                  marginBottom: '4px'
                }}
              >
                {child.title?.en || child.name?.en || child.menu_name_en}
              </div>
            ))}
          </div>
        )}
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
            canReview={canReview}
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
            Sub-items for: {currentParentMenu.name?.en || currentParentMenu.menu_name_en || currentParentMenu.title?.en}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            Parent Menu: {currentParentMenu.name?.en || currentParentMenu.menu_name_en}
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
              Menu Items ({countNestedItems(getCurrentItems())})
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

          {getCurrentItems().length === 0 ? (
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
                Create your first sub-menu item under "{currentParentMenu.title?.en || currentParentMenu.name?.en || currentParentMenu.menu_name_en}"
              </div>
            </div>
          ) : (
            <div>
              {renderSubItemHierarchy(getCurrentItems())}
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
          canReview={canReview}
        />
      </div>
    );
  }

  const hierarchicalMenus = menus && Array.isArray(menus) ? buildHierarchy(menus) : [];

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
                  Navbar Preview (All Menus)
                </div>
                <button
                  onClick={() => {
                    // Trigger navbar refresh
                    window.dispatchEvent(new CustomEvent('menusUpdated', { detail: menus }));
                    showNotification('success', 'Navbar refreshed! Check the public homepage to see updates.');
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                    {renderNavbarPreview(hierarchicalMenus.filter(menu => menu.status === 'Approved'))}
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
                    canReview={canReview}
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
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '20px'
                    }}>
                      {hierarchicalMenus.map((menu) => (
                        <MenuCard
                          key={menu._id || menu.id || 'menu-card-' + Math.random()}
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

        {/* Notification Toast */}
        {notification.show && (
          <div className={`notification notification-${notification.type}`}>
            <div className="notification-content">
              <span className="notification-message">
                {notification.type === 'success' ? '✓' : '✗'} {notification.message}
              </span>
              <button className="notification-close" onClick={() => setNotification({ show: false, type: '', message: '' })}>
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

