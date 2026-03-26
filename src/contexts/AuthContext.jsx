import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const ACCESS_TOKEN_KEY = 'kpt_access_token';
const REFRESH_TOKEN_KEY = 'kpt_refresh_token';
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken';
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken';

function joinUrl(base, path) {
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function getStoredAccessToken() {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
  );
}

function getStoredRefreshToken() {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY)
  );
}

function setStoredTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken);
  }
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(b64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getStoredAccessToken();
        const refreshToken = getStoredRefreshToken();
        
        if (token) {
          const decoded = decodeJwt(token);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded && decoded.exp && decoded.exp > currentTime) {
            // Token is still valid
            const userId = decoded.userId || decoded.sub;
            setAccessToken(token);
            setIsSignedIn(true);
            setCurrentUser({ 
              id: userId, 
              username: decoded.username || null, 
              email: decoded.email || null, 
              roles: decoded.roles || ['user'],
              firstName: decoded.firstName || null,
              lastName: decoded.lastName || null,
              publicMetadata: decoded.publicMetadata || {},
              privateMetadata: decoded.privateMetadata || {}
            });
          } else if (refreshToken) {
            // Token expired, try to refresh
            const refreshResult = await refreshAccessToken(refreshToken);
            if (!refreshResult.success) {
              // Refresh failed, clear tokens
              clearStoredTokens();
            }
          } else {
            // No refresh token, clear expired access token
            clearStoredTokens();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially corrupted tokens
        clearStoredTokens();
      }
      setIsLoaded(true);
    };

    initializeAuth();
  }, []);

  const refreshAccessToken = async (refreshToken) => {
    try {
      const res = await fetch(joinUrl(API_BASE, '/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!res.ok) {
        return { success: false, error: 'Token refresh failed' };
      }
      
      const data = await res.json();
      
      if (data.accessToken) {
        setStoredTokens(data.accessToken, data.refreshToken);
        
        const decoded = decodeJwt(data.accessToken);
        const userId = decoded.userId || decoded.sub;
        setAccessToken(data.accessToken);
        setIsSignedIn(true);
        setCurrentUser({ 
          id: userId, 
          username: decoded.username || null, 
          email: decoded.email || null, 
          roles: decoded.roles || ['user'],
          firstName: decoded.firstName || null,
          lastName: decoded.lastName || null,
          publicMetadata: decoded.publicMetadata || {},
          privateMetadata: decoded.privateMetadata || {}
        });
        return { success: true };
      }
      return { success: false, error: 'Invalid refresh response' };
    } catch (err) {
      return { success: false, error: err.message || 'Token refresh failed' };
    }
  };

  const login = async (username, email, password) => {
    try {
      const res = await fetch(joinUrl(API_BASE, '/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.message || 'Login failed' };
      }
      const data = await res.json();
      if (data.accessToken) {
        setStoredTokens(data.accessToken, data.refreshToken);
        const decoded = decodeJwt(data.accessToken);
        const userId = decoded.userId || decoded.sub;
        setAccessToken(data.accessToken);
        setIsSignedIn(true);
        setCurrentUser({ 
          id: userId, 
          username: decoded.username || null, 
          email: decoded.email || null, 
          roles: decoded.roles || ['user'],
          firstName: decoded.firstName || null,
          lastName: decoded.lastName || null,
          publicMetadata: decoded.publicMetadata || {},
          privateMetadata: decoded.privateMetadata || {}
        });
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await fetch(joinUrl(API_BASE, '/api/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
    } catch (e) {}
    clearStoredTokens();
    setAccessToken(null);
    setIsSignedIn(false);
    setCurrentUser(null);
    navigate('/');
    return { success: true };
  };

  const value = {
    isLoaded,
    isSignedIn,
    currentUser,
    accessToken,
    login,
    logout,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
