import { getAccessToken } from '../state/auth.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function joinUrl(base, path) {
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, { method = 'GET', body, headers } = {}) {
  let token = getAccessToken(); // Use the proper auth function
  
  const res = await fetch(joinUrl(API_BASE, path), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await parseJsonSafe(res);

  // Handle 401 Unauthorized - try to refresh token
  if (res.status === 401 && data?.message?.includes('token')) {
    console.log('Token expired, attempting refresh...');
    
    const refreshToken = localStorage.getItem('kpt_refresh_token'); // Use correct key
    if (refreshToken) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });
        
        const refreshData = await parseJsonSafe(refreshResponse);
        
        if (refreshResponse.ok && refreshData.accessToken) {
          // Store new tokens
          localStorage.setItem('kpt_access_token', refreshData.accessToken); // Use correct key
          if (refreshData.refreshToken) {
            localStorage.setItem('kpt_refresh_token', refreshData.refreshToken); // Use correct key
          }
          
          // Retry original request with new token
          const newToken = refreshData.accessToken;
          const finalHeaders = {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
            ...(headers || {}),
          };
          
          const retryRes = await fetch(joinUrl(API_BASE, path), {
            method,
            headers: finalHeaders,
            body: body ? JSON.stringify(body) : undefined,
          });
          
          const retryData = await parseJsonSafe(retryRes);
          if (!retryRes.ok) {
            const message = retryData && typeof retryData === 'object' && retryData.message ? retryData.message : `Request failed (${retryRes.status})`;
            const err = new Error(message);
            err.status = retryRes.status;
            err.data = retryData;
            throw err;
          }
          
          return retryData;
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem('kpt_access_token'); // Use correct key
        localStorage.removeItem('kpt_refresh_token'); // Use correct key
        window.location.href = '/login';
      }
    }
  }

  if (!res.ok) {
    const message = data && typeof data === 'object' && data.message ? data.message : `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
