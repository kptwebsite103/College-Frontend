import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { createPage, listPages, deletePage, approvePage, updatePage } from '../api/resources';
import { ensureDevAuth } from '../utils/devAuth';
import Popup from '../components/Popup';
import './UserManagementContent.css';

export default function PagesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletePopup, setDeletePopup] = useState({ isOpen: false, pageId: null, pageTitle: '' });

  // Load pages from database on component mount
  useEffect(() => {
    // Ensure development authentication exists
    ensureDevAuth();
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await listPages();
      setPages(response || []);
    } catch (error) {
      console.error('Error loading pages:', error);
      showNotification('error', 'Failed to load pages from database.');
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

  const handleAddPage = () => {
    setShowAddForm(true);
  };

  const handleDeletePage = async (pageId) => {
    const page = pages.find(p => p._id === pageId);
    if (page) {
      // Check if the page has a restricted route
      if (isRestrictedRoute(page.slug)) {
        showNotification('error', 'Pages with routes "/" and "/home" are managed by the homepage section and cannot be deleted here.');
        return;
      }
      setDeletePopup({
        isOpen: true,
        pageId: pageId,
        pageTitle: page.title.en || page.slug
      });
    }
  };

  const confirmDeletePage = async () => {
    try {
      await deletePage(deletePopup.pageId);
      showNotification('success', 'Page deleted successfully from database!');
      // Reload pages to get updated list
      loadPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      showNotification('error', 'Failed to delete page. Please try again.');
    }
    setDeletePopup({ isOpen: false, pageId: null, pageTitle: '' });
  };

  const isRestrictedRoute = (slug) => {
    const restrictedRoutes = ['/', '/home'];
    return restrictedRoutes.includes(slug?.toLowerCase().trim());
  };

  const validatePageRoute = (slug, isEditing = false) => {
    if (isRestrictedRoute(slug)) {
      showNotification('error', 'Routes "/" and "/home" are reserved for the homepage section and cannot be used here.');
      return false;
    }
    return true;
  };

  const handleApprovePage = async (pageId) => {
    try {
      await approvePage(pageId);
      showNotification('success', 'Page approved successfully!');
      // Reload pages to get updated list
      loadPages();
    } catch (error) {
      console.error('Error approving page:', error);
      showNotification('error', 'Failed to approve page. Please try again.');
    }
  };

  const handleEditPage = async (pageId) => {
    try {
      // Find the page from the current pages list
      const page = pages.find(p => p._id === pageId);
      if (page) {
        // Check if the page has a restricted route
        if (isRestrictedRoute(page.slug)) {
          showNotification('error', 'Pages with routes "/" and "/home" are managed by the homepage section and cannot be edited here.');
          return;
        }
        setEditingPage(page);
        setShowAddForm(true);
      }
    } catch (error) {
      console.error('Error editing page:', error);
      showNotification('error', 'Failed to load page for editing.');
    }
  };

  const handleSavePage = async (pageData) => {
    try {
      // Validate route before saving
      if (!validatePageRoute(pageData.slug, !!editingPage)) {
        return; // Stop execution if route is restricted
      }

      // Transform form data to match database schema
      const pagePayload = {
        title: {
          en: pageData.title_en,
          kn: pageData.title_kn
        },
        slug: pageData.slug,
        redirect_url: pageData.redirect_url,
        css: pageData.css || '',
        content: {
          en: {
            html: pageData.content_en.html || '',
            javascript: pageData.content_en.javascript || ''
          },
          kn: {
            html: pageData.content_kn.html || '',
            javascript: pageData.content_kn.javascript || ''
          }
        },
        status: pageData.status || 'created'
      };
      
      if (editingPage) {
        // Update existing page
        await updatePage(editingPage._id, pagePayload);
        showNotification('success', 'Page updated successfully!');
      } else {
        // Create new page
        await createPage(pagePayload);
        showNotification('success', 'Page saved successfully to database!');
      }
      
      setShowAddForm(false);
      setEditingPage(null);
      // Reload pages to get updated list
      loadPages();
    } catch (error) {
      console.error('Error saving page:', error);
      showNotification('error', 'Failed to save page. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingPage(null);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      approved: { background: '#10B981', color: 'white' },
      created: { background: '#F59E0B', color: 'white' },
      archived: { background: '#6B7280', color: 'white' }
    };
    const colors = statusColors[status] || statusColors.created;
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
        background: colors.background,
        color: colors.color
      }}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Created'}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Notification */}
      {notification.show && (
        <div className="notification" style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 2000,
          background: notification.type === 'success' ? '#10B981' : '#EF4444',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1F2937' }}>Pages</h1>
        <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: '14px' }}>
          Manage your website pages
        </p>
      </div>

      {/* Content */}
      <div style={{ position: 'relative' }}>
        {showAddForm ? (
          <AddEditPageForm
            onSave={handleSavePage}
            onCancel={handleCancel}
            showNotification={showNotification}
            editingPage={editingPage}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {loading ? (
              // Loading state
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '40px',
                color: '#6B7280'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>Loading pages...</div>
                <div style={{ fontSize: '14px' }}>Please wait while we fetch your pages from the database.</div>
              </div>
            ) : pages.length === 0 ? (
              // Empty state
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '60px 20px',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '2px dashed #D1D5DB'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  No pages created yet
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  Create your first page to get started with your website content management.
                </div>
                <button
                  onClick={handleAddPage}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#3B82F6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Create Your First Page
                </button>
              </div>
            ) : (
              // Pages list
              pages.map((page) => (
              <div
                key={page.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                }}
              >
                {/* Top right action buttons */}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPage(page._id);
                    }}
                    title="Edit User"
                  >
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'%3E%3C/path%3E%3Cpath d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'%3E%3C/path%3E%3C/svg%3E" alt="Edit" />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(page._id);
                    }}
                    title="Delete User"
                  >
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3 6 5 6 21 6'%3E%3C/polyline%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'%3E%3C/path%3E%3Cline x1='10' y1='11' x2='10' y2='17'%3E%3C/line%3E%3Cline x1='14' y1='11' x2='14' y2='17'%3E%3C/line%3E%3C/svg%3E" alt="Delete" />
                  </button>
                </div>

                {/* Content */}
                <div style={{ marginBottom: '12px', paddingRight: '80px' }}>
                  <h3 style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1F2937' 
                  }}>
                    {page.title.en}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    color: '#6B7280',
                    fontFamily: 'monospace'
                  }}>
                    {page.slug}
                  </p>
                </div>

                {/* Status tags */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: page.status === 'approved' ? '#D1FAE5' : '#FEF3C7',
                    color: page.status === 'approved' ? '#065F46' : '#92400E'
                  }}>
                    {page.status?.charAt(0).toUpperCase() + page.status?.slice(1) || 'Created'}
                  </span>
                  {isRestrictedRoute(page.slug) && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: '#FEE2E2',
                      color: '#991B1B'
                    }}>
                      Homepage Route
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {page.status !== 'approved' && (
                    <button
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#10B981',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprovePage(page._id);
                      }}
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        )}

        {/* Floating Action Button */}
        {!showAddForm && (
          <button
            onClick={handleAddPage}
            style={{
              position: 'fixed',
              bottom: '32px',
              right: '32px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Delete Confirmation Popup */}
      <Popup
        isOpen={deletePopup.isOpen}
        onClose={() => setDeletePopup({ isOpen: false, pageId: null, pageTitle: '' })}
        title="Delete Page"
        message={`Are you sure you want to delete "${deletePopup.pageTitle}"? This action cannot be undone.`}
        onConfirm={confirmDeletePage}
        confirmText="Delete"
        cancelText="Cancel"
        type="confirm"
      />
    </div>
  );
}

function AddEditPageForm({ onSave, onCancel, showNotification, editingPage }) {
  const [formData, setFormData] = useState({
    title_en: '',
    title_kn: '',
    slug: '',
    status: 'created',
    css: '', // CSS is shared across languages
    content_en: {
      html: '',
      javascript: ''
    },
    content_kn: {
      html: '',
      javascript: ''
    }
  });
  const [formOpen, setFormOpen] = useState(false);

  // Populate form when editingPage changes and form is opening
  useEffect(() => {
    if (editingPage && !formOpen) {
      setFormData({
        title_en: editingPage.title?.en || '',
        title_kn: editingPage.title?.kn || '',
        slug: editingPage.slug || '',
        status: editingPage.status || 'created',
        css: editingPage.css || '',
        content_en: {
          html: editingPage.content?.en?.html || '',
          javascript: editingPage.content?.en?.javascript || ''
        },
        content_kn: {
          html: editingPage.content?.kn?.html || '',
          javascript: editingPage.content?.kn?.javascript || ''
        }
      });
      
      // Initialize single file content for editors
      const enSingleContent = buildSingleFileContent(
        editingPage.content?.en?.html || '',
        editingPage.content?.en?.javascript || ''
      );
      const knSingleContent = buildSingleFileContent(
        editingPage.content?.kn?.html || '',
        editingPage.content?.kn?.javascript || ''
      );
      
      setEnSingleFileContent(enSingleContent);
      setKnSingleFileContent(knSingleContent);
      
      setFormOpen(true);
    } else if (!editingPage) {
      // Reset form for new page
      setFormData({
        title_en: '',
        title_kn: '',
        slug: '',
        status: 'created',
        css: '',
        content_en: {
          html: '',
          javascript: ''
        },
        content_kn: {
          html: '',
          javascript: ''
        }
      });
      
      // Reset single file content
      setEnSingleFileContent('');
      setKnSingleFileContent('');
      
      setFormOpen(false);
    }
  }, [editingPage, formOpen]);
  const [language, setLanguage] = useState('en');
  
  // Separate state for English editor
  const [enContentMode, setEnContentMode] = useState('code');
  const [enCodeTab, setEnCodeTab] = useState('single');
  const [enSingleFileContent, setEnSingleFileContent] = useState('');
  
  // Separate state for Kannada editor
  const [knContentMode, setKnContentMode] = useState('code');
  const [knCodeTab, setKnCodeTab] = useState('single');
  const [knSingleFileContent, setKnSingleFileContent] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Parse single file content into HTML and JS (CSS extracted separately)
  const parseSingleFileContent = (content) => {
    // Extract CSS from <style> tags
    const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
    const extractedCss = styleMatch ? styleMatch[1] : '';
    
    // Extract JavaScript from <script> tags
    const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
    const extractedJs = scriptMatch ? scriptMatch[1] : '';
    
    // Extract HTML (everything outside style and script tags)
    let extractedHtml = content
      .replace(/<style>[\s\S]*?<\/style>/g, '')
      .replace(/<script>[\s\S]*?<\/script>/g, '')
      .trim();
    
    return {
      html: extractedHtml,
      css: extractedCss,
      javascript: extractedJs
    };
  };

  // Build single file content from HTML, CSS, and JS
  const buildSingleFileContent = (html, js) => {
    let result = html;
    if (formData.css) {
      result = `<style>${formData.css}</style>\n${result}`;
    }
    if (js) {
      result = `${result}\n<script>${js}</script>`;
    }
    return result;
  };

  const handleEnCodeChange = (value) => {
    if (enCodeTab === 'single') {
      setEnSingleFileContent(value);
      // Auto-parse and update formData
      const parsed = parseSingleFileContent(value);
      
      // Update CSS (shared)
      if (parsed.css !== formData.css) {
        setFormData(prev => ({ ...prev, css: parsed.css }));
      }
      
      // Update HTML and JS for English
      setFormData(prev => ({
        ...prev,
        content_en: {
          html: parsed.html,
          javascript: parsed.javascript
        }
      }));
    } else if (enCodeTab === 'css') {
      setFormData(prev => ({ ...prev, css: value }));
    } else if (enCodeTab === 'html') {
      setFormData(prev => ({
        ...prev,
        content_en: {
          ...prev.content_en,
          html: value
        }
      }));
    } else if (enCodeTab === 'javascript') {
      setFormData(prev => ({
        ...prev,
        content_en: {
          ...prev.content_en,
          javascript: value
        }
      }));
    }
  };

  const handleKnCodeChange = (value) => {
    if (knCodeTab === 'single') {
      setKnSingleFileContent(value);
      // Auto-parse and update formData
      const parsed = parseSingleFileContent(value);
      
      // Update CSS (shared)
      if (parsed.css !== formData.css) {
        setFormData(prev => ({ ...prev, css: parsed.css }));
      }
      
      // Update HTML and JS for Kannada
      setFormData(prev => ({
        ...prev,
        content_kn: {
          html: parsed.html,
          javascript: parsed.javascript
        }
      }));
    } else if (knCodeTab === 'css') {
      setFormData(prev => ({ ...prev, css: value }));
    } else if (knCodeTab === 'html') {
      setFormData(prev => ({
        ...prev,
        content_kn: {
          ...prev.content_kn,
          html: value
        }
      }));
    } else if (knCodeTab === 'javascript') {
      setFormData(prev => ({
        ...prev,
        content_kn: {
          ...prev.content_kn,
          javascript: value
        }
      }));
    }
  };

  const handleEnTabChange = (newTab) => {
    if (newTab === 'single' && enCodeTab !== 'single') {
      // Switch to single file mode - build combined content
      setEnSingleFileContent(buildSingleFileContent(formData.content_en.html, formData.content_en.javascript));
    } else if (enCodeTab === 'single' && newTab !== 'single') {
      // Switch from single file mode - parse and populate
      const parsed = parseSingleFileContent(enSingleFileContent);
      
      // Update CSS (shared)
      if (parsed.css !== formData.css) {
        setFormData(prev => ({ ...prev, css: parsed.css }));
      }
      
      // Update HTML and JS for English
      setFormData(prev => ({
        ...prev,
        content_en: {
          html: parsed.html,
          javascript: parsed.javascript
        }
      }));
    }
    setEnCodeTab(newTab);
  };

  const handleKnTabChange = (newTab) => {
    if (newTab === 'single' && knCodeTab !== 'single') {
      // Switch to single file mode - build combined content
      setKnSingleFileContent(buildSingleFileContent(formData.content_kn.html, formData.content_kn.javascript));
    } else if (knCodeTab === 'single' && newTab !== 'single') {
      // Switch from single file mode - parse and populate
      const parsed = parseSingleFileContent(knSingleFileContent);
      
      // Update CSS (shared)
      if (parsed.css !== formData.css) {
        setFormData(prev => ({ ...prev, css: parsed.css }));
      }
      
      // Update HTML and JS for Kannada
      setFormData(prev => ({
        ...prev,
        content_kn: {
          html: parsed.html,
          javascript: parsed.javascript
        }
      }));
    }
    setKnCodeTab(newTab);
  };

  const getEnCurrentContent = () => {
    if (enCodeTab === 'single') {
      return enSingleFileContent;
    }
    if (enCodeTab === 'css') {
      return formData.css;
    }
    return formData.content_en[enCodeTab] || '';
  };

  const getKnCurrentContent = () => {
    if (knCodeTab === 'single') {
      return knSingleFileContent;
    }
    if (knCodeTab === 'css') {
      return formData.css;
    }
    return formData.content_kn[knCodeTab] || '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate: Slug is required
    if (!formData.slug) {
      showNotification('error', 'Slug URL is required.');
      return;
    }
    
    onSave(formData);
  };

  const renderEnglishContentEditor = () => {
    const currentContent = getEnCurrentContent();
    const getLanguageForTab = (tab) => {
      switch (tab) {
        case 'html': return 'html';
        case 'css': return 'css';
        case 'javascript': return 'javascript';
        case 'single': return 'html';
        default: return 'html';
      }
    };
    
    // Build preview HTML with embedded CSS and JS
    const buildPreviewHTML = () => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            ${formData.css}
            /* Default font styling to match website */
            body {
              font-family: 'Noto Sans', 'Noto Sans Kannada', sans-serif !important;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            * {
              font-family: inherit;
            }
          </style>
        </head>
        <body>
          ${formData.content_en.html}
          <script>${formData.content_en.javascript}</script>
        </body>
        </html>
      `;
    };
    
    return (
      <div style={{
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setEnContentMode('code')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                background: enContentMode === 'code' ? '#3B82F6' : 'transparent',
                color: enContentMode === 'code' ? 'white' : '#6B7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
              Code
            </button>
            <button
              type="button"
              onClick={() => setEnContentMode('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                background: enContentMode === 'preview' ? '#3B82F6' : 'transparent',
                color: enContentMode === 'preview' ? 'white' : '#6B7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              Preview
            </button>
          </div>
          
          {/* Code Type Tabs */}
          {enContentMode === 'code' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => handleEnTabChange('single')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: enCodeTab === 'single' ? '#8B5CF6' : 'transparent',
                  color: enCodeTab === 'single' ? 'white' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📄 Single File
              </button>
              <button
                type="button"
                onClick={() => handleEnTabChange('html')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: enCodeTab === 'html' ? '#E65100' : 'transparent',
                  color: enCodeTab === 'html' ? 'white' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                HTML
              </button>
              <button
                type="button"
                onClick={() => handleEnTabChange('css')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: enCodeTab === 'css' ? '#1976D2' : 'transparent',
                  color: enCodeTab === 'css' ? 'white' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                CSS
              </button>
              <button
                type="button"
                onClick={() => handleEnTabChange('javascript')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: enCodeTab === 'javascript' ? '#F7DF1E' : 'transparent',
                  color: enCodeTab === 'javascript' ? '#000' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                JS
              </button>
            </div>
          )}
        </div>
        
        {/* Content Area */}
        {enContentMode === 'preview' ? (
          <iframe
            srcDoc={buildPreviewHTML()}
            style={{
              width: '100%',
              height: '400px',
              border: 'none',
              background: 'white'
            }}
            title="English Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div style={{ minHeight: '400px' }}>
            <Editor
              key={`en-${enCodeTab}`}
              height="400px"
              language={getLanguageForTab(enCodeTab)}
              value={currentContent}
              onChange={handleEnCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Noto Sans', 'Noto Sans Kannada', sans-serif",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                tabSize: 2,
                insertSpaces: true,
                folding: true,
                lineDecorationsWidth: 10,
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                contextmenu: true,
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                snippetSuggestions: 'inline'
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderKannadaContentEditor = () => {
    const currentContent = getKnCurrentContent();
    const getLanguageForTab = (tab) => {
      switch (tab) {
        case 'html': return 'html';
        case 'css': return 'css';
        case 'javascript': return 'javascript';
        case 'single': return 'html';
        default: return 'html';
      }
    };
    
    // Build preview HTML with embedded CSS and JS
    const buildPreviewHTML = () => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            ${formData.css}
            /* Default font styling to match website */
            body {
              font-family: 'Noto Sans', 'Noto Sans Kannada', sans-serif !important;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            * {
              font-family: inherit;
            }
          </style>
        </head>
        <body>
          ${formData.content_kn.html}
          <script>${formData.content_kn.javascript}</script>
        </body>
        </html>
      `;
    };
    
    return (
      <div style={{
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setKnContentMode('code')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                background: knContentMode === 'code' ? '#3B82F6' : 'transparent',
                color: knContentMode === 'code' ? 'white' : '#6B7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
              Code
            </button>
            <button
              type="button"
              onClick={() => setKnContentMode('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                background: knContentMode === 'preview' ? '#3B82F6' : 'transparent',
                color: knContentMode === 'preview' ? 'white' : '#6B7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              Preview
            </button>
          </div>
          
          {/* Code Type Tabs */}
          {knContentMode === 'code' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => handleKnTabChange('single')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: knCodeTab === 'single' ? '#8B5CF6' : 'transparent',
                  color: knCodeTab === 'single' ? 'white' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📄 Single File
              </button>
              <button
                type="button"
                onClick={() => handleKnTabChange('html')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: knCodeTab === 'html' ? '#E65100' : 'transparent',
                  color: knCodeTab === 'html' ? 'white' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                HTML
              </button>
              <button
                type="button"
                onClick={() => handleKnTabChange('css')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: knCodeTab === 'css' ? '#1976D2' : 'transparent',
                  color: knCodeTab === 'css' ? 'white' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                CSS
              </button>
              <button
                type="button"
                onClick={() => handleKnTabChange('javascript')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: knCodeTab === 'javascript' ? '#F7DF1E' : 'transparent',
                  color: knCodeTab === 'javascript' ? '#000' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                JS
              </button>
            </div>
          )}
        </div>
        
        {/* Content Area */}
        {knContentMode === 'preview' ? (
          <iframe
            srcDoc={buildPreviewHTML()}
            style={{
              width: '100%',
              height: '400px',
              border: 'none',
              background: 'white'
            }}
            title="Kannada Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div style={{ minHeight: '400px' }}>
            <Editor
              key={`kn-${knCodeTab}`}
              height="400px"
              language={getLanguageForTab(knCodeTab)}
              value={currentContent}
              onChange={handleKnCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Noto Sans', 'Noto Sans Kannada', sans-serif",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                tabSize: 2,
                insertSpaces: true,
                folding: true,
                lineDecorationsWidth: 10,
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                contextmenu: true,
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                snippetSuggestions: 'inline'
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E5E7EB',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #E5E7EB',
        background: '#F9FAFB'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
          {editingPage ? 'Edit Page' : 'Add New Page'}
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9CA3AF',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>

      {/* Language Switcher */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB',
        background: '#FFFFFF'
      }}>
        <button
          onClick={() => setLanguage('en')}
          style={{
            flex: 1,
            padding: '14px 20px',
            border: 'none',
            borderBottom: language === 'en' ? '2px solid #3B82F6' : '2px solid transparent',
            background: language === 'en' ? '#F0F7FF' : 'transparent',
            color: language === 'en' ? '#3B82F6' : '#6B7280',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('kn')}
          style={{
            flex: 1,
            padding: '14px 20px',
            border: 'none',
            borderBottom: language === 'kn' ? '2px solid #3B82F6' : '2px solid transparent',
            background: language === 'kn' ? '#F0F7FF' : 'transparent',
            color: language === 'kn' ? '#3B82F6' : '#6B7280',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Kannada
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        {language === 'en' ? (
          /* English Fields */
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Title (English)
              </label>
              <input
                type="text"
                name="title_en"
                value={formData.title_en}
                onChange={handleChange}
                placeholder="Enter title in English"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Content (English)
              </label>
              {renderEnglishContentEditor()}
            </div>
          </div>
        ) : (
          /* Kannada Fields */
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Title (Kannada)
              </label>
              <input
                type="text"
                name="title_kn"
                value={formData.title_kn}
                onChange={handleChange}
                placeholder="ಕನ್ನಡದಲ್ಲಿ ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'serif'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Content (Kannada)
              </label>
              {renderKannadaContentEditor()}
            </div>
          </div>
        )}

        {/* Common Fields */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #E5E7EB'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="page-url-slug"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: 'white'
              }}
            >
              <option value="created">Created</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 24px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {editingPage ? 'Update Page' : 'Create Page'}
          </button>
        </div>
      </form>
    </div>
  );
}
