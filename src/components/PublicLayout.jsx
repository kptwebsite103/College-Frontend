import React from 'react';
import TopHeader from './TopHeader/TopHeader';
import DynamicNavbar from './DynamicNavbar/DynamicNavbar';
import './TopHeader/TopHeader.css';

const PublicLayout = ({ children }) => {
  return (
    <div className="app">
      <TopHeader />
      <div className="navbar-space">
        <DynamicNavbar />
      </div>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
