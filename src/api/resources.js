import { apiRequest } from './http.js';
import { getAccessToken } from '../state/auth.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function joinUrl(base, path) {
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export function health() {
  return apiRequest('/health');
}

export function listPages() {
  return apiRequest('/api/pages');
}

export function listHomeSections(params = {}) {
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : '';
  return apiRequest(`/api/home-sections${suffix}`);
}

export function listActiveHomeSections(params = {}) {
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : '';
  return apiRequest(`/api/home-sections/active${suffix}`);
}

export function createHomeSection(sectionData) {
  return apiRequest('/api/home-sections', {
    method: 'POST',
    body: sectionData
  });
}

export function updateHomeSection(sectionId, sectionData) {
  return apiRequest(`/api/home-sections/${sectionId}`, {
    method: 'PUT',
    body: sectionData
  });
}

export function deleteHomeSection(sectionId) {
  return apiRequest(`/api/home-sections/${sectionId}`, {
    method: 'DELETE'
  });
}

export function getPageBySlug(slug) {
  return apiRequest(`/api/pages/slug/${slug}`);
}

export function createPage(pageData) {
  return apiRequest('/api/pages', {
    method: 'POST',
    body: pageData
  });
}

export function updatePage(pageId, pageData) {
  return apiRequest(`/api/pages/${pageId}`, {
    method: 'PUT',
    body: pageData
  });
}

export function deletePage(pageId) {
  return apiRequest(`/api/pages/${pageId}`, {
    method: 'DELETE'
  });
}

export function approvePage(pageId) {
  return apiRequest(`/api/pages/${pageId}/publish`, {
    method: 'POST'
  });
}

export function rejectPage(pageId) {
  return apiRequest(`/api/pages/${pageId}/reject`, {
    method: 'POST'
  });
}

export function getPageById(pageId) {
  return apiRequest(`/api/pages/${pageId}`);
}

export function listMenus() {
  return apiRequest('/api/menus');
}

export function createMenu(menuData) {
  return apiRequest('/api/menus', {
    method: 'POST',
    body: menuData
  });
}

export function updateMenu(menuId, menuData) {
  return apiRequest(`/api/menus/${menuId}`, {
    method: 'PUT',
    body: menuData
  });
}

export function deleteMenu(menuId) {
  return apiRequest(`/api/menus/${menuId}`, {
    method: 'DELETE'
  });
}

export function getTheme(type) {
  return apiRequest(`/api/themes/${type}`);
}

export function updateTheme(type, themeData) {
  return apiRequest(`/api/themes/${type}`, {
    method: 'PUT',
    body: themeData
  });
}

export function createTheme(themeData) {
  return apiRequest('/api/themes', {
    method: 'POST',
    body: themeData
  });
}

export function listDepartments() {
  return apiRequest('/api/departments');
}

export function listUsers() {
  return apiRequest('/api/users');
}

export function createUser(userData) {
  return apiRequest('/api/users', {
    method: 'POST',
    body: userData // Don't stringify here, let http.js handle it
  });
}

export function deleteUser(userId) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'DELETE'
  });
}

export function updateUser(userId, userData) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'PUT',
    body: userData
  });
}

export function getUserCount() {
  const token = localStorage.getItem('accessToken');
  console.log('getUserCount - Token present:', !!token);
  console.log('getUserCount - Token value:', token ? 'Bearer ' + token.substring(0, 20) + '...' : 'No token');
  
  return apiRequest('/api/users/count');
}

// Image compression utility
export function compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // Skip compression for very small images or if already compressed
    if (file.size < 100 * 1024) { // Files smaller than 100KB
      console.log('📏 Small image detected, skipping compression:', formatFileSize(file.size));
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const originalWidth = width;
      const originalHeight = height;
      
      // Only resize if image is larger than max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
        console.log(`📐 Resizing image from ${originalWidth}x${originalHeight} to ${Math.round(width)}x${Math.round(height)}`);
      } else {
        console.log(`📏 Image dimensions acceptable (${originalWidth}x${originalHeight}), no resizing needed`);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        
        // Only use compressed version if it's actually smaller
        if (compressedFile.size < file.size) {
          const savings = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
          console.log(`✅ Compression successful: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)} (${savings}% smaller)`);
          resolve(compressedFile);
        } else {
          console.log(`⚠️ Compression would increase size, using original: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`);
          resolve(file);
        }
      }, file.type, quality);
    };
    
    img.onerror = () => {
      console.log('❌ Failed to load image for compression, using original');
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// Helper function to format file size for logging
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Media upload functions
export function uploadFile(file, onProgress, options = {}) {
  const {
    maxFileSize = 50 * 1024 * 1024,
    timeout = 60000,
    maxRetries = 2,
    folder = 'media',
    title,
    tags,
    departmentId
  } = options;

  if (!file) {
    return Promise.reject(new Error('No file selected'));
  }

  if (file.size > maxFileSize) {
    return Promise.reject(new Error(`File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`));
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-m4a',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ];

  if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
    return Promise.reject(new Error('File type not supported'));
  }

  return new Promise((resolve, reject) => {
    let retryCount = 0;

    const attemptUpload = () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (title) formData.append('title', title);
      if (departmentId) formData.append('departmentId', departmentId);
      if (tags && Array.isArray(tags)) formData.append('tags', JSON.stringify(tags));

      const xhr = new XMLHttpRequest();
      const url = joinUrl(API_BASE, '/api/media/upload');
      const token = getAccessToken();

      xhr.open('POST', url);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.timeout = timeout;

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response from upload'));
          }
          return;
        }

        if ((xhr.status >= 500 || xhr.status === 429) && retryCount < maxRetries) {
          retryCount += 1;
          setTimeout(attemptUpload, 1000 * retryCount);
          return;
        }

        let message = `Upload failed with status ${xhr.status}`;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse && errorResponse.message) {
            message = errorResponse.message;
          }
        } catch (_) {
          // ignore parse errors
        }
        reject(new Error(message));
      };

      xhr.onerror = () => {
        if (retryCount < maxRetries) {
          retryCount += 1;
          setTimeout(attemptUpload, 1000 * retryCount);
          return;
        }
        reject(new Error('Network error during upload'));
      };

      xhr.ontimeout = () => {
        if (retryCount < maxRetries) {
          retryCount += 1;
          setTimeout(attemptUpload, 1000 * retryCount);
          return;
        }
        reject(new Error('Upload timeout'));
      };

      xhr.send(formData);
    };

    attemptUpload();
  });
}

export function listMedia() {
  return apiRequest('/api/media');
}

export function deleteMedia(mediaId) {
  return apiRequest(`/api/media/${mediaId}`, {
    method: 'DELETE'
  });
}

export function updateMedia(mediaId, payload) {
  return apiRequest(`/api/media/${mediaId}`, {
    method: 'PUT',
    body: payload
  });
}
