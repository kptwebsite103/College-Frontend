import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TopHeader from './TopHeader/TopHeader';
import DynamicNavbar from './DynamicNavbar/DynamicNavbar';
import Footer from './Footer/Footer';
import './TopHeader/TopHeader.css';

const PublicLayout = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top when route changes in public pages
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app">
      <TopHeader />
      <div className="navbar-space">
        <DynamicNavbar />
      </div>
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
