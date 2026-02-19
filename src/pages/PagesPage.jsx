import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { createPage, listPages, deletePage, approvePage, rejectPage, updatePage, listMedia } from '../api/resources';
import { ensureDevAuth } from '../utils/devAuth';
import { usePermissions } from '../utils/rolePermissions';
import Popup from '../components/Popup';
import './UserManagementContent.css';

function stripHtmlTags(html = '') {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function PagesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletePopup, setDeletePopup] = useState({ isOpen: false, pageId: null, pageTitle: '' });
  const [searchParams] = useSearchParams();
  const [highlightedId, setHighlightedId] = useState(null);
  const cardRefs = useRef({});
  const didAutoOpenRef = useRef(false);
  const { isAdmin, isSuperAdmin } = usePermissions();
  const canReview = isAdmin || isSuperAdmin;
  const announcementMode = searchParams.get('mode') === 'announcement';

  const hasAnnouncementTag = (page) =>
    Array.isArray(page?.tags) &&
    page.tags.some((tag) => String(tag || '').trim().toLowerCase() === 'announcement');

  const normalizeStatus = (status) => {
    const value = String(status || '').toLowerCase();
    if (['created', 'pending', 'review'].includes(value)) return 'pending';
    return value || 'pending';
  };

  // Load pages from database on component mount
  useEffect(() => {
    // Ensure development authentication exists
    ensureDevAuth();
    loadPages();
  }, []);

  useEffect(() => {
    const createMode = searchParams.get('create') === '1';
    if (!createMode || didAutoOpenRef.current) return;
    didAutoOpenRef.current = true;
    setEditingPage(null);
    setShowAddForm(true);
  }, [searchParams]);

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || pages.length === 0) return;

    const target = cardRefs.current[highlightId] || document.getElementById(`page-card-${highlightId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(highlightId);
      const timer = setTimeout(() => setHighlightedId(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, pages.length]);

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
    setEditingPage(null);
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
      if (!canReview) {
        showNotification('error', 'You do not have permission to approve pages.');
        return;
      }
      await approvePage(pageId);
      showNotification('success', 'Page approved successfully!');
      // Reload pages to get updated list
      loadPages();
    } catch (error) {
      console.error('Error approving page:', error);
      showNotification('error', 'Failed to approve page. Please try again.');
    }
  };

  const handleRejectPage = async (pageId) => {
    try {
      if (!canReview) {
        showNotification('error', 'You do not have permission to reject pages.');
        return;
      }
      await rejectPage(pageId);
      showNotification('success', 'Page rejected.');
      loadPages();
    } catch (error) {
      console.error('Error rejecting page:', error);
      showNotification('error', 'Failed to reject page. Please try again.');
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

      const normalizedTags = Array.isArray(pageData.tags)
        ? pageData.tags.filter((tag) => String(tag || '').trim())
        : [];
      const isAnnouncementTag = normalizedTags.some(
        (tag) => String(tag || '').trim().toLowerCase() === 'announcement'
      );

      // Transform form data to match database schema
      const finalStatus = canReview ? (pageData.status || 'pending') : 'pending';
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
        status: finalStatus,
        tags: normalizedTags
      };

      if (isAnnouncementTag) {
        pagePayload.announcement = {
          text: {
            en: pageData.announcement_text_en || '',
            kn: pageData.announcement_text_kn || ''
          },
          startDate: pageData.announcement_from || null,
          endDate: pageData.announcement_to || null,
          attachmentUrl: pageData.announcement_attachment_url || '',
          attachmentLabel: pageData.announcement_attachment_label || ''
        };
      } else {
        pagePayload.announcement = null;
      }
      
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
    const normalized = normalizeStatus(status);
    const statusColors = {
      approved: { background: '#10B981', color: 'white' },
      pending: { background: '#F59E0B', color: 'white' },
      rejected: { background: '#EF4444', color: 'white' },
      archived: { background: '#6B7280', color: 'white' }
    };
    const colors = statusColors[normalized] || statusColors.pending;
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
        {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
      </span>
    );
  };

  const visiblePages = announcementMode ? pages.filter(hasAnnouncementTag) : pages;

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
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1F2937' }}>
          {announcementMode ? 'Announcements' : 'Pages'}
        </h1>
        <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: '14px' }}>
          {announcementMode
            ? 'Create and manage announcement items shown on the homepage.'
            : 'Manage your website pages'}
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
            canReview={canReview}
            forceAnnouncement={announcementMode}
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
            ) : visiblePages.length === 0 ? (
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
                  {announcementMode ? 'No announcements created yet' : 'No pages created yet'}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  {announcementMode
                    ? 'Create your first announcement to show updates on the homepage.'
                    : 'Create your first page to get started with your website content management.'}
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
                  {announcementMode ? 'Create First Announcement' : 'Create Your First Page'}
                </button>
              </div>
            ) : (
              // Pages list
              visiblePages.map((page) => {
                const displayStatus = normalizeStatus(page.status);
                const isPending = displayStatus === 'pending';
                const isApproved = displayStatus === 'approved';
                const isRejected = displayStatus === 'rejected';
                return (
              <div
                key={page._id}
                id={`page-card-${page._id}`}
                ref={(el) => {
                  if (el) cardRefs.current[page._id] = el;
                }}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E5E7EB',
                  outline: highlightedId === page._id ? '2px solid #3B82F6' : 'none',
                  boxShadow: highlightedId === page._id ? '0 0 0 4px rgba(59,130,246,0.15)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
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
                    background: isApproved ? '#D1FAE5' : isRejected ? '#FEE2E2' : '#FEF3C7',
                    color: isApproved ? '#065F46' : isRejected ? '#991B1B' : '#92400E'
                  }}>
                    {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
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
                  {hasAnnouncementTag(page) && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: '#DBEAFE',
                      color: '#1D4ED8'
                    }}>
                      Announcement
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isPending && canReview && (
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
                  {isPending && canReview && (
                    <button
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#EF4444',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectPage(page._id);
                      }}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
              );
              })
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

function AddEditPageForm({ onSave, onCancel, showNotification, editingPage, canReview, forceAnnouncement = false }) {
  const formatInputDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  const slugifyText = (value) => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const [formData, setFormData] = useState({
    title_en: '',
    title_kn: '',
    slug: '',
    status: 'pending',
    tags: forceAnnouncement ? ['announcement'] : [],
    announcement_text_en: '',
    announcement_text_kn: '',
    announcement_from: '',
    announcement_to: '',
    announcement_attachment_url: '',
    announcement_attachment_label: '',
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
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [previewImageTarget, setPreviewImageTarget] = useState(null);

  // Populate form when editingPage changes and form is opening
  useEffect(() => {
    if (editingPage && !formOpen) {
      setFormData({
        title_en: editingPage.title?.en || '',
        title_kn: editingPage.title?.kn || '',
        slug: editingPage.slug || '',
        status: editingPage.status === 'created' ? 'pending' : (editingPage.status || 'pending'),
        tags: Array.isArray(editingPage.tags) ? editingPage.tags : [],
        announcement_text_en: editingPage.announcement?.text?.en || stripHtmlTags(editingPage.content?.en?.html || ''),
        announcement_text_kn: editingPage.announcement?.text?.kn || stripHtmlTags(editingPage.content?.kn?.html || ''),
        announcement_from: formatInputDate(editingPage.announcement?.startDate),
        announcement_to: formatInputDate(editingPage.announcement?.endDate),
        announcement_attachment_url: editingPage.announcement?.attachmentUrl || '',
        announcement_attachment_label: editingPage.announcement?.attachmentLabel || '',
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
      setEnPreviewDoc('');
      setKnPreviewDoc('');
      
      setFormOpen(true);
    } else if (!editingPage) {
      // Reset form for new page
      setFormData({
        title_en: '',
        title_kn: '',
        slug: '',
        status: 'pending',
        tags: forceAnnouncement ? ['announcement'] : [],
        announcement_text_en: '',
        announcement_text_kn: '',
        announcement_from: '',
        announcement_to: '',
        announcement_attachment_url: '',
        announcement_attachment_label: '',
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
      setEnPreviewDoc('');
      setKnPreviewDoc('');
      
      setFormOpen(false);
    }
  }, [editingPage, formOpen, forceAnnouncement]);
  const [language, setLanguage] = useState('en');
  
  // Separate state for English editor
  const [enContentMode, setEnContentMode] = useState('code');
  const [enCodeTab, setEnCodeTab] = useState('single');
  const [enSingleFileContent, setEnSingleFileContent] = useState('');
  const [enPreviewDoc, setEnPreviewDoc] = useState('');
  const enPreviewIframeRef = useRef(null);
  
  // Separate state for Kannada editor
  const [knContentMode, setKnContentMode] = useState('code');
  const [knCodeTab, setKnCodeTab] = useState('single');
  const [knSingleFileContent, setKnSingleFileContent] = useState('');
  const [knPreviewDoc, setKnPreviewDoc] = useState('');
  const knPreviewIframeRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isAnnouncement = Array.isArray(formData.tags)
    && formData.tags.some((tag) => String(tag || '').trim().toLowerCase() === 'announcement');
  const showAnnouncementFields = forceAnnouncement || isAnnouncement;

  const handleAnnouncementToggle = (checked) => {
    setFormData((prev) => {
      const nextTags = Array.isArray(prev.tags) ? [...prev.tags] : [];
      const hasTag = nextTags.some((tag) => String(tag || '').trim().toLowerCase() === 'announcement');
      if (checked && !hasTag) {
        nextTags.push('announcement');
      }
      if (!checked && hasTag) {
        return {
          ...prev,
          tags: nextTags.filter((tag) => String(tag || '').trim().toLowerCase() !== 'announcement')
        };
      }
      return { ...prev, tags: nextTags };
    });
  };

  const loadMediaLibrary = async () => {
    setMediaLoading(true);
    setMediaError('');
    try {
      const data = await listMedia();
      const normalized = Array.isArray(data)
        ? data
            .map((item) => ({
              id: item._id || item.id || item.url,
              title: item.title || item.filename || item.name || 'Untitled',
              type: item.type || item.format || '',
              url: item.url || item.secure_url || '',
              thumb: item.thumbnailUrl || item.thumbnail || item.url || item.secure_url || ''
            }))
            .filter((item) => item.url)
        : [];
      setMediaItems(normalized);
    } catch (error) {
      console.error('Failed to load media for attachment picker:', error);
      setMediaItems([]);
      setMediaError('Failed to load media library.');
    } finally {
      setMediaLoading(false);
    }
  };

  const openAttachmentPicker = () => {
    setShowAttachmentPicker(true);
    if (mediaItems.length === 0 && !mediaLoading) {
      loadMediaLibrary();
    }
  };

  const closeMediaPicker = () => {
    setShowAttachmentPicker(false);
    setPreviewImageTarget(null);
  };

  const openPreviewImagePicker = ({ locale, imageIndex, currentSrc = '' }) => {
    if (!Number.isInteger(imageIndex) || imageIndex < 0) return;
    setPreviewImageTarget({ locale, imageIndex, currentSrc });
    setShowAttachmentPicker(false);
    if (mediaItems.length === 0 && !mediaLoading) {
      loadMediaLibrary();
    }
  };

  const selectAttachment = (item) => {
    if (!item?.url) return;
    setFormData((prev) => ({
      ...prev,
      announcement_attachment_url: item.url,
      announcement_attachment_label:
        prev.announcement_attachment_label || item.title || 'Attachment'
    }));
    closeMediaPicker();
  };

  const applySelectedPreviewImage = (item) => {
    if (!item?.url || !previewImageTarget) return;
    const { locale, imageIndex } = previewImageTarget;

    setFormData((prev) => {
      const key = locale === 'kn' ? 'content_kn' : 'content_en';
      const currentContent = prev[key] || { html: '', javascript: '' };
      const html = currentContent.html || '';
      const container = document.createElement('div');
      container.innerHTML = html;
      const images = container.querySelectorAll('img');

      if (!images[imageIndex]) {
        return prev;
      }

      images[imageIndex].setAttribute('src', item.url);
      const updatedHtml = container.innerHTML;
      const updatedContent = { ...currentContent, html: updatedHtml };

      if (locale === 'kn') {
        if (knCodeTab === 'single') {
          setKnSingleFileContent(buildSingleFileContent(updatedHtml, updatedContent.javascript || '', prev.css || ''));
        }
        setKnPreviewDoc(buildEditablePreviewHTML('kn', updatedHtml, updatedContent.javascript || ''));
      } else {
        if (enCodeTab === 'single') {
          setEnSingleFileContent(buildSingleFileContent(updatedHtml, updatedContent.javascript || '', prev.css || ''));
        }
        setEnPreviewDoc(buildEditablePreviewHTML('en', updatedHtml, updatedContent.javascript || ''));
      }

      return {
        ...prev,
        [key]: updatedContent
      };
    });

    closeMediaPicker();
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
  const buildSingleFileContent = (html, js, cssValue = formData.css) => {
    let result = html;
    if (cssValue) {
      result = `<style>${cssValue}</style>\n${result}`;
    }
    if (js) {
      result = `${result}\n<script>${js}</script>`;
    }
    return result;
  };

  // Build editable preview HTML that allows editing text directly and image URL via click.
  const buildEditablePreviewHTML = (locale, htmlContent, javascriptContent) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${formData.css}
          body {
            font-family: 'Noto Sans', 'Noto Sans Kannada', sans-serif !important;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            background: #ffffff;
          }
          * {
            font-family: inherit;
          }
          #cms-preview-root {
            min-height: calc(100vh - 40px);
            outline: 2px dashed transparent;
            outline-offset: 6px;
          }
          #cms-preview-root:focus {
            outline-color: rgba(37, 99, 235, 0.4);
          }
          #cms-preview-root img {
            cursor: pointer;
          }
          #cms-preview-root img:hover {
            outline: 2px solid rgba(37, 99, 235, 0.45);
            outline-offset: 2px;
          }
        </style>
      </head>
      <body>
        <div id="cms-preview-root" contenteditable="true">${htmlContent || ''}</div>
        <script>
          (function () {
            const root = document.getElementById('cms-preview-root');
            if (!root) return;

            const sendUpdate = () => {
              window.parent.postMessage({
                type: 'cms-preview-update',
                locale: '${locale}',
                html: root.innerHTML
              }, '*');
            };

            root.addEventListener('input', sendUpdate);
            root.addEventListener('blur', sendUpdate, true);
            root.addEventListener('paste', function () {
              setTimeout(sendUpdate, 0);
            });

            root.addEventListener('click', function (event) {
              const target = event.target;
              if (!target || target.tagName !== 'IMG') return;
              event.preventDefault();
              const images = Array.from(root.querySelectorAll('img'));
              const imageIndex = images.indexOf(target);
              if (imageIndex < 0) return;
              window.parent.postMessage({
                type: 'cms-preview-image-select',
                locale: '${locale}',
                imageIndex,
                currentSrc: target.getAttribute('src') || ''
              }, '*');
            });

            sendUpdate();
          })();
        </script>
        <script>${javascriptContent || ''}</script>
      </body>
      </html>
    `;
  };

  const openEnglishPreview = () => {
    setEnPreviewDoc(buildEditablePreviewHTML('en', formData.content_en.html, formData.content_en.javascript));
    setEnContentMode('preview');
  };

  const openKannadaPreview = () => {
    setKnPreviewDoc(buildEditablePreviewHTML('kn', formData.content_kn.html, formData.content_kn.javascript));
    setKnContentMode('preview');
  };

  useEffect(() => {
    const handlePreviewMessage = (event) => {
      const payload = event?.data;
      if (!payload || !payload.type) return;

      if (payload.type === 'cms-preview-image-select') {
        const sourceMatchesEn = enPreviewIframeRef.current && event.source === enPreviewIframeRef.current.contentWindow;
        const sourceMatchesKn = knPreviewIframeRef.current && event.source === knPreviewIframeRef.current.contentWindow;
        if (!sourceMatchesEn && !sourceMatchesKn) return;
        openPreviewImagePicker({
          locale: payload.locale === 'kn' ? 'kn' : 'en',
          imageIndex: Number(payload.imageIndex),
          currentSrc: payload.currentSrc || ''
        });
        return;
      }

      if (payload.type !== 'cms-preview-update') return;
      const nextHtml = String(payload.html || '');

      if (
        payload.locale === 'en'
        && enPreviewIframeRef.current
        && event.source === enPreviewIframeRef.current.contentWindow
      ) {
        setFormData((prev) => {
          if ((prev.content_en?.html || '') === nextHtml) return prev;
          const nextContent = { ...(prev.content_en || {}), html: nextHtml };
          if (enCodeTab === 'single') {
            setEnSingleFileContent(buildSingleFileContent(nextHtml, nextContent.javascript || '', prev.css || ''));
          }
          return { ...prev, content_en: nextContent };
        });
      }

      if (
        payload.locale === 'kn'
        && knPreviewIframeRef.current
        && event.source === knPreviewIframeRef.current.contentWindow
      ) {
        setFormData((prev) => {
          if ((prev.content_kn?.html || '') === nextHtml) return prev;
          const nextContent = { ...(prev.content_kn || {}), html: nextHtml };
          if (knCodeTab === 'single') {
            setKnSingleFileContent(buildSingleFileContent(nextHtml, nextContent.javascript || '', prev.css || ''));
          }
          return { ...prev, content_kn: nextContent };
        });
      }
    };

    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, [enCodeTab, knCodeTab]);

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

    const payload = { ...formData };

    if (!payload.slug) {
      if (showAnnouncementFields) {
        const base = slugifyText(payload.title_en || payload.title_kn || 'announcement');
        payload.slug = base ? `announcement-${base}-${Date.now()}` : `announcement-${Date.now()}`;
      } else {
        showNotification('error', 'Slug URL is required.');
        return;
      }
    }

    if (showAnnouncementFields) {
      const textEn = String(payload.announcement_text_en || '').trim();
      const textKn = String(payload.announcement_text_kn || '').trim();
      const from = payload.announcement_from;
      const to = payload.announcement_to;

      if (!textEn && !textKn) {
        showNotification('error', 'Announcement text is required.');
        return;
      }
      if (!from || !to) {
        showNotification('error', 'Announcement start and end date are required.');
        return;
      }
      if (new Date(from) > new Date(to)) {
        showNotification('error', 'Announcement end date must be after start date.');
        return;
      }

      payload.tags = Array.from(new Set([...(payload.tags || []), 'announcement']));
      payload.content_en = {
        html: textEn ? `<p>${textEn.replace(/\n/g, '<br/>')}</p>` : '',
        javascript: ''
      };
      payload.content_kn = {
        html: textKn ? `<p>${textKn.replace(/\n/g, '<br/>')}</p>` : '',
        javascript: ''
      };
      payload.css = '';
    }

    onSave(payload);
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
              onClick={openEnglishPreview}
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
            ref={enPreviewIframeRef}
            srcDoc={enPreviewDoc || buildEditablePreviewHTML('en', formData.content_en.html, formData.content_en.javascript)}
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
              onClick={openKannadaPreview}
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
            ref={knPreviewIframeRef}
            srcDoc={knPreviewDoc || buildEditablePreviewHTML('kn', formData.content_kn.html, formData.content_kn.javascript)}
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

  const isImageMediaItem = (item) => {
    const type = String(item?.type || '').toLowerCase();
    if (type === 'image') return true;
    const url = String(item?.url || '');
    return /\.(avif|bmp|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(url);
  };

  const isMediaPickerOpen = showAttachmentPicker || Boolean(previewImageTarget);
  const pickerItems = previewImageTarget ? mediaItems.filter(isImageMediaItem) : mediaItems;

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
                {showAnnouncementFields ? 'Announcement Text (English)' : 'Content (English)'}
              </label>
              {showAnnouncementFields ? (
                <textarea
                  name="announcement_text_en"
                  value={formData.announcement_text_en}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Enter announcement text in English"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              ) : (
                renderEnglishContentEditor()
              )}
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
                {showAnnouncementFields ? 'Announcement Text (Kannada)' : 'Content (Kannada)'}
              </label>
              {showAnnouncementFields ? (
                <textarea
                  name="announcement_text_kn"
                  value={formData.announcement_text_kn}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Enter announcement text in Kannada"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              ) : (
                renderKannadaContentEditor()
              )}
            </div>
          </div>
        )}

        {/* Common Fields */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: showAnnouncementFields ? '1fr' : '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #E5E7EB'
        }}>
          {!showAnnouncementFields ? (
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
          ) : null}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Status
            </label>
            {canReview ? (
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="archived">Archived</option>
              </select>
            ) : (
              <div style={{
                padding: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                background: '#F9FAFB',
                color: '#6B7280',
                fontSize: '14px'
              }}>
                Pending (requires admin approval)
              </div>
            )}
          </div>
        </div>

        {showAnnouncementFields ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                  From Date
                </label>
                <input
                  type="date"
                  name="announcement_from"
                  value={formData.announcement_from}
                  onChange={handleChange}
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
                  To Date
                </label>
                <input
                  type="date"
                  name="announcement_to"
                  value={formData.announcement_to}
                  onChange={handleChange}
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
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Attachable (optional)
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <input
                  type="url"
                  name="announcement_attachment_url"
                  value={formData.announcement_attachment_url}
                  onChange={handleChange}
                  placeholder="https://example.com/file"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={openAttachmentPicker}
                  style={{
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    background: '#F9FAFB',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Select from Media
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  name="announcement_attachment_label"
                  value={formData.announcement_attachment_label}
                  onChange={handleChange}
                  placeholder="Attachment label (optional)"
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
              {formData.announcement_attachment_url ? (
                <div style={{ marginTop: 8 }}>
                  <a href={formData.announcement_attachment_url} target="_blank" rel="noreferrer">
                    Open selected attachment
                  </a>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '14px'
            }}
          >
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={(event) => handleAnnouncementToggle(event.target.checked)}
              disabled={forceAnnouncement}
            />
            Show this item in homepage announcements
          </label>
          {forceAnnouncement ? (
            <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>
              Announcement mode is active from dashboard, so this is automatically enabled.
            </div>
          ) : null}
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

      {isMediaPickerOpen ? (
        <div
          onClick={closeMediaPicker}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2200,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(920px, 96vw)',
              maxHeight: '82vh',
              overflow: 'hidden',
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 16px',
                borderBottom: '1px solid #E5E7EB'
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
                  {previewImageTarget ? 'Select Image From Media' : 'Select Attachable From Media'}
                </div>
                {previewImageTarget?.currentSrc ? (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#6B7280', maxWidth: 520, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Current image: {previewImageTarget.currentSrc}
                  </div>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={loadMediaLibrary}
                  disabled={mediaLoading}
                  style={{
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: 13,
                    cursor: mediaLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={closeMediaPicker}
                  style={{
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div style={{ padding: 16, overflow: 'auto' }}>
              {mediaLoading ? (
                <div style={{ color: '#6B7280', fontSize: 14 }}>Loading media...</div>
              ) : mediaError ? (
                <div style={{ color: '#DC2626', fontSize: 14 }}>{mediaError}</div>
              ) : pickerItems.length === 0 ? (
                <div style={{ color: '#6B7280', fontSize: 14 }}>
                  {previewImageTarget
                    ? 'No images found. Upload images from `/admin/media`.'
                    : 'No media found. Upload files from `/admin/media`.'}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 12
                  }}
                >
                  {pickerItems.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        if (previewImageTarget) {
                          applySelectedPreviewImage(item);
                        } else {
                          selectAttachment(item);
                        }
                      }}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 10,
                        padding: 10,
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div
                        style={{
                          height: 96,
                          borderRadius: 8,
                          background: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {String(item.type || '').toLowerCase() === 'image' ? (
                          <img
                            src={item.thumb}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: 12, color: '#6B7280', padding: 10, textAlign: 'center' }}>
                            {item.type || 'file'}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#111827' }}>{item.title}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
