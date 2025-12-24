import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getAccessToken, getStoredUser } from '../state/auth.js';

export default function Layout({ children }) {
  const nav = useNavigate();
  const token = getAccessToken();
  const user = getStoredUser();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">KPT</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">KPT Website</div>
            <div className="sidebar-brand-subtitle">Admin Panel</div>
          </div>
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-avatar" aria-hidden="true">
            {user && (user.name || user.email) ? String(user.name || user.email).slice(0, 1).toUpperCase() : 'A'}
          </div>
          <div>
            <div className="sidebar-profile-name">{user && (user.name || user.email) ? user.name || user.email : 'Admin'}</div>
            <div className="sidebar-profile-role">{token ? 'Signed in' : 'Guest'}</div>
          </div>
        </div>

        <div className="sidebar-actions">
          {token ? (
            <button
              className="sidebar-logout"
              onClick={() => {
                clearAuth();
                nav('/login');
              }}
            >
              Logout
            </button>
          ) : (
            <div className="sidebar-auth-links">
              <NavLink to="/login" className="sidebar-logout">Login</NavLink>
              <NavLink to="/register" className="sidebar-logout secondary">Register</NavLink>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Main Menu</div>
          <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/pages" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>Pages</NavLink>
          <NavLink to="/menus" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>Menus</NavLink>
          <NavLink to="/departments" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>Departments</NavLink>
          <NavLink to="/me" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>Me</NavLink>
          <NavLink to="/health" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>Health</NavLink>
        </nav>

        <div className="sidebar-footer">© KPT Website</div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <NavLink to="/pages" className={({ isActive }) => `topbar-pill${isActive ? ' active' : ''}`}>Media</NavLink>
            <NavLink to="/departments" className={({ isActive }) => `topbar-pill${isActive ? ' active' : ''}`}>Department Settings</NavLink>
            <NavLink to="/menus" className={({ isActive }) => `topbar-pill${isActive ? ' active' : ''}`}>Home Page Section show/hide</NavLink>
          </div>
          <div className="topbar-right">
            <button className="topbar-visit" onClick={() => nav('/')}>Visit Site</button>
          </div>
        </div>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
