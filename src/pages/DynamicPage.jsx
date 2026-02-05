import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { listMenus, getPageBySlug } from '../api/resources.js';
import { useLanguage } from '../contexts/LanguageContext';

export default function DynamicPage() {
  const { route, parentRoute, childRoute, grandChildRoute } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useLanguage();
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

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, [pageData]);

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
  }, [location.pathname, currentRoute]);

  async function loadPageData() {
    setLoading(true);
    setError(null);

    try {
      // First, try to get a page by slug (remove leading slash)
      const slug = currentRoute.startsWith('/') ? currentRoute.slice(1) : currentRoute;
      try {
        const page = await getPageBySlug(slug);
        if (page) {
          // Check if page has a redirect URL
          if (page.redirect_url && page.redirect_url.trim()) {
            // Redirect to the specified URL
            window.location.href = page.redirect_url;
            return;
          }
          // Found a published page, show it
          setPageData({ ...page, isPage: true });
          setLoading(false);
          return;
        }
      } catch (pageErr) {
        // Page not found or error, continue to menu fallback
        console.log('Page not found for slug:', slug, pageErr);
      }

      // Fallback: Get all menus from API
      const menus = await listMenus();
      if (!menus || menus.length === 0) {
        throw new Error('No menu data found');
      }

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
        throw new Error(`No menu item or page found for route: ${currentRoute}`);
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
        minHeight: '400px',
        fontSize: '18px',
        color: '#6b7280',
        backgroundColor: '#ffffff',
        padding: '40px'
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
        minHeight: '400px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box'
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
      padding: '0',
      margin: '0',
      width: '100%',
      minHeight: '100%',
      backgroundColor: '#ffffff',
      color: '#374151',
      lineHeight: '1.6'
    }}>
      {/* Page Content - Full Width */}
      <div style={{
        width: '100%',
        minHeight: '100%',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        {pageData.isPage ? (
          // Render actual page content with HTML, CSS, and JavaScript
          <div 
            className="page-content-wrapper"
            style={{
              width: '100%',
              minHeight: '100%',
              padding: '0',
              paddingLeft: '0',
              paddingRight: '0',
              paddingBottom: '0',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            {/* Render HTML content based on user language */}
            <div 
              className="page-content-html"
              style={{
                width: '100%',
                minHeight: '100%',
                position: 'relative'
              }}
              dangerouslySetInnerHTML={{
                __html: pageData.content?.[currentLanguage]?.html || pageData.content?.en?.html || '<p>No content available for this page.</p>'
              }} 
            />
            
            {/* Render shared CSS */}
            {pageData.css && (
              <style>{pageData.css}</style>
            )}
            
            {/* Render custom JavaScript */}
            {pageData.content?.[currentLanguage]?.javascript && (
              <script dangerouslySetInnerHTML={{
                __html: pageData.content[currentLanguage].javascript
              }} />
            )}
            
            {/* Default styling for HTML elements */}
            <style>{`
              .page-content-html {
                max-width: none;
                width: 100%;
                padding: 0 !important;
                margin: 0 !important;
              }
              .page-content-html > div:first-child {
                padding: 0 !important;
                margin: 0 !important;
              }
              .page-content-html div {
                padding-left: 0 !important;
                padding-right: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
              .page-content-html p { 
                font-size: 16px !important; 
                margin-bottom: 16px; 
                line-height: 1.6;
              }
              .page-content-html h1 { 
                font-size: 28px !important; 
                margin-bottom: 20px;
                font-weight: 600;
              }
              .page-content-html h2 { 
                font-size: 22px !important; 
                margin-bottom: 16px;
                font-weight: 600;
              }
              .page-content-html h3 { 
                font-size: 18px !important; 
                margin-bottom: 14px;
                font-weight: 600;
              }
              .page-content-html ul, .page-content-html ol { 
                margin-left: 24px; 
                margin-bottom: 16px;
              }
              .page-content-html li { 
                font-size: 16px !important; 
                margin-bottom: 8px;
              }
            `}</style>
          </div>
        ) : (
          // Render menu placeholder
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '1.125rem',
            padding: '40px',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            backgroundColor: '#ffffff'
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
        )}
      </div>
    </div>
  );
}
