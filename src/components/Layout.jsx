import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getAccessToken, getStoredUser } from '../state/auth.js';

export default function Layout({ children }) {
  const nav = useNavigate();
  const token = getAccessToken();
  const user = getStoredUser();

  const navLinkClassName = ({ isActive }) => (isActive ? 'active' : undefined);

  return (
    <div>
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div className="container">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>KPT Website</div>
              <div className="muted" style={{ fontSize: 12 }}>Frontend connected to backend</div>
            </div>

            <div className="nav">
              <NavLink to="/" end className={navLinkClassName}>Dashboard</NavLink>
              <NavLink to="/health" className={navLinkClassName}>Health</NavLink>
              <NavLink to="/pages" className={navLinkClassName}>Pages</NavLink>
              <NavLink to="/menus" className={navLinkClassName}>Menus</NavLink>
              <NavLink to="/departments" className={navLinkClassName}>Departments</NavLink>
              <NavLink to="/me" className={navLinkClassName}>Me</NavLink>
              {!token ? (
                <>
                  <NavLink to="/login" className={navLinkClassName}>Login</NavLink>
                  <NavLink to="/register" className={navLinkClassName}>Register</NavLink>
                </>
              ) : (
                <button
                  className="secondary"
                  onClick={() => {
                    clearAuth();
                    nav('/login');
                  }}
                >
                  Logout{user && user.email ? ` (${user.email})` : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {children}
      </div>
    </div>
  );
}
