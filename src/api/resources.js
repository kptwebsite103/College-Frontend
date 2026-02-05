import { apiRequest } from './http.js';

export function health() {
  return apiRequest('/health');
}

export function listPages() {
  return apiRequest('/api/pages');
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
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    timeout = 30000, // 30 seconds
    maxRetries = 3,
    chunkSize = 1024 * 1024 // 1MB chunks for large files
  } = options;

  console.log('🚀 ImageKit Upload Started:', {
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    fileType: file.type,
    timestamp: new Date().toISOString()
  });

  // Validate file
  if (file.size > maxFileSize) {
    console.log('❌ Upload Failed - File too large:', formatFileSize(file.size));
    return Promise.reject(new Error(`File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`));
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type) && !file.type.includes('image/') && !file.type.includes('video/')) {
    console.log('❌ Upload Failed - Unsupported file type:', file.type);
    return Promise.reject(new Error('File type not supported'));
  }

  console.log('✅ File validation passed, creating ImageKit upload request...');

  // ImageKit Direct Upload Configuration
  const imageKitPublicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || 'your_public_key';
  const imageKitUrlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/kpt103';
  const imageKitAuthenticationEndpoint = import.meta.env.VITE_API_BASE_URL + '/api/upload/auth-params' || '/api/upload/auth-params';
  
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    
    const attemptUpload = () => {
      console.log(`📤 ImageKit upload attempt ${retryCount + 1}/${maxRetries + 1} for file: ${file.name}`);
      
      // Get authentication parameters from your backend
      fetch(imageKitAuthenticationEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kpt_access_token')}`
        }
      })
      .then(authResponse => {
        if (!authResponse.ok) {
          throw new Error('Failed to get ImageKit authentication');
        }
        return authResponse.json();
      })
      .then(authResult => {
        if (!authResult.success) {
          throw new Error(authResult.error || 'Authentication failed');
        }
        
        const authData = authResult.data;
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = authData.expire ? authData.expire - currentTime : 'unknown';
        
        console.log('🔐 ImageKit auth obtained:', { 
          token: authData.token ? 'received' : 'missing', 
          expire: authData.expire,
          signature: authData.signature ? 'received' : 'missing',
          publicKey: authData.publicKey ? 'received' : 'missing',
          currentTime: currentTime,
          timeUntilExpiry: timeUntilExpiry
        });
        
        // Check if token is expired or about to expire (less than 30 seconds)
        if (timeUntilExpiry !== 'unknown' && timeUntilExpiry < 30) {
          console.log('⚠️ ImageKit token expired or too old, requesting fresh token...');
          throw new Error('Authentication token expired');
        }
        
        // Create FormData for ImageKit
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('useUniqueFileName', 'true');
        formData.append('folder', 'media');
        
        // Add ImageKit authentication parameters in correct order
        if (authData.token) {
          formData.append('publicKey', authData.publicKey);
          formData.append('signature', authData.signature);
          formData.append('expire', authData.expire.toString());
          formData.append('token', authData.token);
        }
        
        const xhr = new XMLHttpRequest();
        let timeoutId;
        
        // Set timeout
        timeoutId = setTimeout(() => {
          console.log('⏰ ImageKit upload timeout for file:', file.name);
          xhr.abort();
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`ImageKit timeout, retrying... (${retryCount}/${maxRetries})`);
            setTimeout(attemptUpload, 1000 * retryCount);
          } else {
            console.log('❌ ImageKit upload failed after timeout retries:', file.name);
            reject(new Error('ImageKit upload timeout after multiple retries'));
          }
        }, timeout);
        
        // Optimized progress tracking - throttle updates
        let lastProgressUpdate = 0;
        const progressThrottle = 100; // Update every 100ms
        
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const now = Date.now();
              if (now - lastProgressUpdate > progressThrottle) {
                const percentComplete = (event.loaded / event.total) * 100;
                console.log(`📊 ImageKit Upload Progress: ${percentComplete.toFixed(1)}% - ${formatFileSize(event.loaded)} / ${formatFileSize(event.total)}`);
                onProgress(percentComplete);
                lastProgressUpdate = now;
              }
            }
          });
        }
        
        xhr.addEventListener('load', () => {
          clearTimeout(timeoutId);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('✅ ImageKit Upload Completed Successfully:', {
                fileName: file.name,
                fileId: response.fileId,
                url: response.url,
                size: formatFileSize(file.size),
                timestamp: new Date().toISOString()
              });
              resolve(response);
            } catch (error) {
              console.log('❌ ImageKit Upload Failed - Invalid response:', error);
              reject(new Error('Invalid response from ImageKit'));
            }
          } else {
            // Log detailed error for debugging
            const responseText = xhr.responseText;
            console.log('❌ ImageKit Upload Failed - Detailed Error:', {
              status: xhr.status,
              statusText: xhr.statusText,
              responseText: responseText,
              fileName: file.name,
              formData: Object.fromEntries(formData.entries())
            });
            
            // Retry on authentication errors (403) and server errors (5xx)
            if ((xhr.status === 403 || xhr.status >= 500) && retryCount < maxRetries) {
              retryCount++;
              console.log(`ImageKit auth/server error, retrying... (${retryCount}/${maxRetries})`);
              setTimeout(attemptUpload, 1000 * retryCount);
            } else {
              try {
                const errorResponse = JSON.parse(responseText);
                console.log('❌ ImageKit Upload Failed - Server Error:', {
                  status: xhr.status,
                  error: errorResponse.message || errorResponse.error || 'Unknown ImageKit server error',
                  fileName: file.name
                });
                reject(new Error(errorResponse.message || errorResponse.error || `ImageKit upload failed with status ${xhr.status}`));
              } catch {
                console.log('❌ ImageKit Upload Failed - Server Error:', {
                  status: xhr.status,
                  responseText: responseText,
                  fileName: file.name
                });
                reject(new Error(`ImageKit upload failed with status ${xhr.status}: ${responseText}`));
              }
            }
          }
        });
        
        xhr.addEventListener('error', () => {
          clearTimeout(timeoutId);
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`ImageKit network error, retrying... (${retryCount}/${maxRetries})`);
            setTimeout(attemptUpload, 1000 * retryCount);
          } else {
            console.log('❌ ImageKit Upload Failed - Network Error:', file.name);
            reject(new Error('Network error during ImageKit upload'));
          }
        });
        
        // Upload directly to ImageKit
        xhr.open('POST', `https://upload.imagekit.io/api/v1/files/upload`);
        
        // Optimize for large files
        if (file.size > 10 * 1024 * 1024) { // Files larger than 10MB
          console.log('📦 Large file detected, adding optimization headers:', formatFileSize(file.size));
        }
        
        console.log('🌐 Sending upload request to ImageKit...');
        xhr.send(formData);
      })
      .catch(error => {
        console.log('❌ Failed to get ImageKit authentication:', error);
        
        // Fallback to backend upload if ImageKit auth fails
        if (retryCount < maxRetries) {
          retryCount++;
          console.log('🔄 Retrying ImageKit authentication...');
          setTimeout(attemptUpload, 1000);
        } else {
          console.log('🔄 All ImageKit attempts failed, falling back to backend upload...');
          uploadToBackend()
            .then(resolve)
            .catch(reject);
        }
      });
    };
    
    const uploadToBackend = () => {
      // Fallback to original backend upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'media');
      
      const token = localStorage.getItem('kpt_access_token');
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL || ''}/api/media/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject(new Error('Backend upload failed'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Backend network error'));
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
