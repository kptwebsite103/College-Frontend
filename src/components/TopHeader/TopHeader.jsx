import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TopHeader.css';

const TopHeader = () => {
  const { isSignedIn, currentUser, logout } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Check if we're on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
  };

  const handleLoginClick = () => {
    if (isSignedIn) {
      // User is logged in, go to admin dashboard
      navigate('/admin');
    } else {
      // User is not logged in, go to login page
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  // Don't render header on auth pages
  if (isAuthPage) {
    return null;
  }

  return (
    <header className="top-header">
      <div className="top-header-container">
        <div className="top-header-left">
          {isSignedIn ? (
            <div className="user-info">
                <button className="login-button logged-in" onClick={handleLoginClick}>
                <svg 
                  className="login-icon" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {currentUser?.firstName || currentUser?.username || 'Admin'}
              </button>
              <button className="logout-button" onClick={handleLogout}>
                {t('admin.logout')}
              </button>
            </div>
          ) : null}
        </div>
        
        <div className="top-header-right">
          <div className="language-selector">
            <button 
              className={`language-button ${currentLanguage === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
              title="English"
            >
              EN
            </button>
            <button 
              className={`language-button ${currentLanguage === 'kn' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('kn')}
              title="ಕನ್ನಡ (Kannada)"
            >
              KN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
