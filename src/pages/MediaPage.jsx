import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadFile, listMedia, deleteMedia, compressImage } from '../api/resources.js';
import './UserManagementContent.css';

export default function MediaPage() {
  const { t } = useTranslation();
  const isMounted = useRef(true);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    loadMediaItems();
  }, []);

  const loadMediaItems = async () => {
    try {
      setLoading(true);
      const mediaData = await listMedia();
      setMediaItems(mediaData || []);
    } catch (error) {
      console.error('Failed to load media items:', error);
      // Fallback to mock data when API is not available
      setMediaItems([
        {
          id: 1,
          type: 'image',
          name: 'College Building.jpg',
          url: 'https://ik.imagekit.io/kpt103/college-building.jpg',
          size: '2.4 MB',
          uploadedAt: '2024-01-15',
          thumbnail: 'https://picsum.photos/200/150?random=1'
        },
        {
          id: 2,
          type: 'video',
          name: 'Campus Tour.mp4',
          url: 'https://ik.imagekit.io/kpt103/campus-tour.mp4',
          size: '15.8 MB',
          uploadedAt: '2024-01-14',
          thumbnail: 'https://picsum.photos/200/150?random=2'
        },
        {
          id: 3,
          type: 'document',
          name: 'College Brochure.pdf',
          url: 'https://ik.imagekit.io/kpt103/college-brochure.pdf',
          size: '4.2 MB',
          uploadedAt: '2024-01-13',
          thumbnail: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFileHandler(files[0]);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFileHandler = async (file) => {
    console.log('📁 File selected for upload:', {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError('');

      // Compress image if applicable
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        console.log('🖼️ Image compression started for:', file.name);
        setUploadError('Compressing image...');
        
        const originalSize = file.size;
        processedFile = await compressImage(file, 0.8, 1920, 1080);
        const compressionRatio = ((originalSize - processedFile.size) / originalSize * 100).toFixed(1);
        
        console.log('✅ Image compression completed:', {
          fileName: file.name,
          originalSize: formatFileSize(originalSize),
          compressedSize: formatFileSize(processedFile.size),
          compressionRatio: `${compressionRatio}%`,
          dimensions: processedFile.type.startsWith('image/') ? 'max 1920x1080' : 'N/A'
        });
        
        setUploadError('');
      } else {
        console.log('📄 Non-image file, skipping compression:', file.name);
      }

      // Optimized upload options
      const uploadOptions = {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        timeout: 60000, // 60 seconds for better reliability
        maxRetries: 3
      };

      console.log('⚙️ Starting upload with options:', uploadOptions);

      const result = await uploadFile(processedFile, (progress) => {
        if (isMounted.current) setUploadProgress(progress);
      }, uploadOptions);

      // Add uploaded file to the media list
      const newMediaItem = {
        id: result.fileId || result.id,
        type: getFileType(file),
        name: file.name,
        url: result.url,
        size: formatFileSize(processedFile.size),
        uploadedAt: new Date().toISOString().split('T')[0],
        thumbnail: result.thumbnailUrl || null
      };

      console.log('➕ Adding file to media library:', {
        fileName: file.name,
        fileId: newMediaItem.id,
        url: newMediaItem.url,
        size: newMediaItem.size,
        type: newMediaItem.type
      });

      if (isMounted.current) {
        setMediaItems(prev => [newMediaItem, ...prev]);
        setUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('❌ Upload process failed:', {
        fileName: file.name,
        error: error.message,
        stack: error.stack
      });
      
      // If backend is not available, simulate upload for demo purposes
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        console.log('🔄 Backend unavailable, using demo mode for:', file.name);
        
        const newMediaItem = {
          id: Date.now(),
          type: getFileType(file),
          name: file.name,
          url: `https://ik.imagekit.io/kpt103/demo-${file.name}`,
          size: formatFileSize(file.size),
          uploadedAt: new Date().toISOString().split('T')[0],
          thumbnail: file.type.startsWith('image/') ? `https://picsum.photos/200/150?random=${Date.now()}` : null
        };
        
        console.log('➕ Demo file added to media library:', newMediaItem);
        
        if (isMounted.current) {
          setMediaItems(prev => [newMediaItem, ...prev]);
          setUploading(false);
          setUploadProgress(0);
        }
      } else {
        if (isMounted.current) {
          setUploadError(error.message || 'Upload failed. Please try again.');
          setUploading(false);
          setUploadProgress(0);
        }
      }
    }
  };

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf' || file.type.includes('document')) return 'document';
    return 'document';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (mediaId) => {
    try {
      await deleteMedia(mediaId);
      setMediaItems(prev => prev.filter(item => item.id !== mediaId));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const filteredItems = useMemo(() => {
    if (!mediaItems || !Array.isArray(mediaItems)) return [];
    return mediaItems.filter(item => {
      const matchesFilter = filter === 'all' || item.type === filter;
      const matchesSearch = item.name && item.name.toLowerCase && item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [mediaItems, filter, searchTerm]);

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      return newSelected;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedItems.size} items?`)) return;

    try {
      await Promise.all(
        [...selectedItems].map(id => deleteMedia(id))
      );

      setMediaItems(prev =>
        prev.filter(item => !selectedItems.has(item.id))
      );

      setSelectedItems(new Set());
    } catch (err) {
      alert("Bulk delete failed");
    }
  };

  const getFileIcon = (type, size = 24) => {
    switch (type) {
      case 'image':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,15"/>
          </svg>
        );
      case 'video':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23,7 16,12 23,17 23,7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            <line x1="23" y1="7" x2="23" y2="17"/>
          </svg>
        );
      case 'document':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V9L13,2Z"/>
            <polyline points="14,2 14,9 20,9"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V9L13,2M18,20H6V9H18M16,13V8H8V13H16"/>
          </svg>
        );
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'image': return '#059669';
      case 'video': return '#D97706';
      case 'document': return '#1D4ED8';
      default: return '#374151';
    }
  };

  if (loading) {
    return (
      <div className="user-management-content">
        <div className="content-header">
          <h2>Media Library</h2>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px', color: '#3B82F6' }}>📁</div>
          <div style={{ fontSize: '18px', color: '#6B7280' }}>Loading media files...</div>
          <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Please wait while we fetch your media</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-content">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="content-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Media Library</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* View Toggle Buttons */}
            <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', padding: '2px', borderRadius: '6px' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '4px',
                  background: viewMode === 'grid' ? 'white' : 'transparent',
                  color: viewMode === 'grid' ? '#374151' : '#6B7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '4px',
                  background: viewMode === 'list' ? 'white' : 'transparent',
                  color: viewMode === 'list' ? '#374151' : '#6B7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                List
              </button>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: uploading ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {uploading ? (
                <>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid white', 
                    borderTop: '2px solid transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></div>
                  Uploading... {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload File
                </>
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              style={{ display: 'none' }}
            />
            
            <div className="dropdown-container" style={{ position: 'relative' }}>
              <button 
                className="dropdown-button" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ 
                  background: 'white', 
                  border: '1px solid #ddd', 
                  padding: '8px 12px', 
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '120px'
                }}
              >
                <span>{filter === 'all' ? 'All Files' : filter.charAt(0).toUpperCase() + filter.slice(1) + 's'}</span>
                <span style={{ marginLeft: '4px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </button>
              <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`} style={{ 
                position: 'absolute', 
                top: '100%', 
                left: '0', 
                right: '0',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                marginTop: '4px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                opacity: isDropdownOpen ? 1 : 0,
                visibility: isDropdownOpen ? 'visible' : 'hidden',
                transform: isDropdownOpen ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'all 0.2s ease'
              }}>
                <div 
                  className={`dropdown-item ${filter === 'all' ? 'selected' : ''}`}
                >
                  All Files
                </div>
                <div 
                  className={`dropdown-item ${filter === 'image' ? 'selected' : ''}`}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: '1px solid #f0f0f0',
                    background: filter === 'image' ? '#007bff' : 'transparent',
                    color: filter === 'image' ? 'white' : '#000000'
                  }}
                  onClick={() => {
                    setFilter('image');
                    setIsDropdownOpen(false);
                  }}
                >
                  Images
                </div>
                <div 
                  className={`dropdown-item ${filter === 'video' ? 'selected' : ''}`}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: '1px solid #f0f0f0',
                    background: filter === 'video' ? '#007bff' : 'transparent',
                    color: filter === 'video' ? 'white' : '#000000'
                  }}
                  onClick={() => {
                    setFilter('video');
                    setIsDropdownOpen(false);
                  }}
                >
                  Videos
                </div>
                <div 
                  className={`dropdown-item ${filter === 'document' ? 'selected' : ''}`}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    background: filter === 'document' ? '#007bff' : 'transparent',
                    color: filter === 'document' ? 'white' : '#000000'
                  }}
                  onClick={() => {
                    setFilter('document');
                    setIsDropdownOpen(false);
                  }}
                >
                  Documents
                </div>
              </div>
            </div>
            
            <input
              type="text"
              placeholder="Search media files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                width: '250px'
              }}
            />
          </div>
        </div>
      </div>

      {uploadError && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #DC2626',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', color: '#DC2626' }}>
            {uploadError}
          </span>
          <button
            onClick={() => setUploadError('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {(() => {
        const containerStyle = viewMode === 'grid' 
          ? { gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' } 
          : {};
        return (
          <div 
            className={viewMode === 'grid' ? 'users-grid' : 'media-list'} 
            style={containerStyle}
          >
        {filteredItems.map(item => (
          <div key={item.id} className={`user-card ${viewMode === 'list' ? 'list-view' : ''}`} style={{ cursor: 'pointer' }}>
            {viewMode === 'grid' ? (
              // Grid View (existing card design)
              <div style={{ position: 'relative', paddingBottom: '4px' }}>
                {/* Checkbox for selection */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleItemSelection(item.id)}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                />
                
                {/* File type icon */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '6px',
                  padding: '8px',
                  background: getTypeColor(item.type),
                  borderRadius: '6px',
                  color: 'white',
                  position: 'relative'
                }}>
                  {getFileIcon(item.type)}
                  
                  {/* Action buttons positioned over icon container */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '6px',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: '4px',
                    zIndex: 10
                  }}>
                    <button className="edit-btn" title="Download" onClick={() => window.open(item.url, "_blank")} style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'%3E%3C/path%3E%3Cpolyline points='7 10 12 15 17 10'%3E%3C/polyline%3E%3Cline x1='12' y1='15' x2='12' y2='3'%3E%3C/line%3E%3C/svg%3E" alt="Download" />
                    </button>
                    <button className="delete-btn" title="Delete" onClick={() => {
                      if (window.confirm(`Delete "${item.name}"?`)) {
                        handleDelete(item.id);
                      }
                    }} style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3 6 5 6 21 6'%3E%3C/polyline%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'%3E%3C/path%3E%3Cline x1='10' y1='11' x2='10' y2='17'%3E%3C/line%3E%3Cline x1='14' y1='11' x2='14' y2='17'%3E%3C/line%3E%3C/svg%3E" alt="Delete" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail or icon for documents */}
                {item.type !== 'document' && item.thumbnail ? (
                  <img 
                    src={item.thumbnail} 
                    alt={item.name}
                    onClick={() => window.open(item.url)}
                    style={{
                      width: '100%',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '6px',
                      cursor: 'pointer'
                    }}
                  />
                ) : item.type === 'document' ? (
                  <div onClick={() => window.open(item.url)} style={{
                    width: '100%',
                    height: '100px',
                    background: '#F3F4F6',
                    borderRadius: '4px',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #D1D5DB',
                    cursor: 'pointer'
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="#6B7280">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V9L14,2M18,20H6V9H18M16,13V8H8V13H16M10,9H8V11H10M14,9H12V11H14M16,9H14V11H16"/>
                    </svg>
                  </div>
                ) : null}

                {/* File info */}
                <div style={{ padding: '0 6px' }}>
                  <h3 style={{ 
                    margin: '0 0 2px 0', 
                    fontSize: '15px', 
                    fontWeight: '600', 
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.name}
                  </h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{
                      padding: '3px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: '500',
                      background: getTypeColor(item.type),
                      color: 'white'
                    }}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6B7280' }}>
                      Uploaded: {item.uploadedAt}
                    </span>
                    <span style={{ fontSize: '11px', color: '#374151' }}>
                      {item.size}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // List View
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleItemSelection(item.id)}
                  style={{
                    width: '16px',
                    height: '16px',
                    marginRight: '12px',
                    cursor: 'pointer'
                  }}
                />
                
                {/* File type icon */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '48px',
                  height: '48px',
                  marginRight: '12px',
                  padding: '8px',
                  background: getTypeColor(item.type),
                  borderRadius: '6px',
                  color: 'white',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  {getFileIcon(item.type, 20)}
                </div>

                {/* File info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6B7280' }}>
                    <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                    <span>{item.size}</span>
                    <span>{item.uploadedAt}</span>
                  </div>
                </div>

                {/* Action buttons outside color container */}
                <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                  <button className="edit-btn" title="Download" onClick={() => window.open(item.url, "_blank")} style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'%3E%3C/path%3E%3Cpolyline points='7 10 12 15 17 10'%3E%3C/polyline%3E%3Cline x1='12' y1='15' x2='12' y2='3'%3E%3C/line%3E%3C/svg%3E" alt="Download" />
                  </button>
                  <button className="delete-btn" title="Delete" onClick={() => {
                    if (window.confirm(`Delete "${item.name}"?`)) {
                      handleDelete(item.id);
                    }
                  }} style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23DC2626' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3 6 5 6 21 6'%3E%3C/polyline%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'%3E%3C/path%3E%3Cline x1='10' y1='11' x2='10' y2='17'%3E%3C/line%3E%3Cline x1='14' y1='11' x2='14' y2='17'%3E%3C/line%3E%3C/svg%3E" alt="Delete" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
          </div>
        );
      })()}

      {filteredItems.length === 0 && (
        <div style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: '60px 20px',
          background: '#F9FAFB',
          borderRadius: '12px',
          border: '2px dashed #D1D5DB'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            No media files found
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            {searchTerm ? 'Try adjusting your search terms' : 'No files have been uploaded yet'}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#3B82F6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Upload Your First File
          </button>
        </div>
      )}

      {/* Selection Controls - Bottom Right */}
      {selectedItems.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000
        }}>
          <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
            {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={selectAll}
              style={{
                padding: '6px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                background: 'white',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={deleteSelected}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                background: '#DC2626',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
