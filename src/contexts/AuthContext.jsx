import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

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
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
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
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } else {
            // No refresh token, clear expired access token
            localStorage.removeItem('accessToken');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially corrupted tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setIsLoaded(true);
    };

    initializeAuth();
  }, []);

  const refreshAccessToken = async (refreshToken) => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!res.ok) {
        return { success: false, error: 'Token refresh failed' };
      }
      
      const data = await res.json();
      
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        
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
      const res = await fetch('/api/auth/login', {
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
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
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
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => {});
    } catch (e) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
