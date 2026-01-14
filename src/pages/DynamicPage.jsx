import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listMenus } from '../api/resources.js';

export default function DynamicPage() {
  const { route, parentRoute, childRoute, grandChildRoute } = useParams();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Build the full route path
  const buildRoutePath = () => {
    if (grandChildRoute) {
      return `/${parentRoute}/${childRoute}/${grandChildRoute}`;
    } else if (childRoute) {
      return `/${parentRoute}/${childRoute}`;
    } else if (parentRoute) {
      return `/${parentRoute}`;
    } else {
      return `/${route}`;
    }
  };

  const currentRoute = buildRoutePath();

  useEffect(() => {
    loadPageData();
  }, [parentRoute, childRoute, grandChildRoute, route]);

  async function loadPageData() {
    setLoading(true);
    setError(null);
    
    try {
      // Get all menus from localStorage (like DynamicNavbar does)
      const savedMenus = localStorage.getItem('menus');
      if (!savedMenus) {
        throw new Error('No menu data found');
      }

      const menus = JSON.parse(savedMenus);
      
      // Find the menu item that matches this route
      const findMenuItem = (menuList, targetRoute) => {
        for (const menu of menuList) {
          if (menu.url_en === targetRoute || menu.link === targetRoute) {
            return menu;
          }
          if (menu.children && menu.children.length > 0) {
            const found = findMenuItem(menu.children, targetRoute);
            if (found) return found;
          }
        }
        return null;
      };

      const menuItem = findMenuItem(menus, currentRoute);
      
      if (!menuItem) {
        throw new Error(`No menu item found for route: ${currentRoute}`);
      }

      setPageData(menuItem);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading page...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Page Not Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          {error}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '60vh'
    }}>
      {/* Page Header */}
      <div style={{ 
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          {pageData.menu_name_en || pageData.name || 'Page'}
        </h1>
        
        {pageData.menu_name_kn && (
          <h2 style={{ 
            fontSize: '1.5rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            {pageData.menu_name_kn}
          </h2>
        )}
      </div>

      {/* Page Content */}
      <div style={{ 
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '32px',
        minHeight: '300px'
      }}>
        <div style={{ 
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '1.125rem'
        }}>
          <h3 style={{ 
            marginBottom: '16px',
            color: '#374151'
          }}>
            Welcome to {pageData.menu_name_en || pageData.name || 'this page'}
          </h3>
          
          <p style={{ marginBottom: '24px' }}>
            This is a dynamically generated page based on your navbar configuration.
            You can customize this page content in the admin panel.
          </p>
          
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
