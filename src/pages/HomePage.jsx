import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import TopHeader from '../components/TopHeader/TopHeader';
import '../components/Navbar/Navbar.css';
import '../components/TopHeader/TopHeader.css';

const HomePage = () => {
  return (
    <div className="app">
      <TopHeader />
      <Navbar />
      <main className="main-content">
        <section className="hero">
          <div className="container">
            <h1>Welcome to KPT College</h1>
            <p>Excellence in Education Since [Year]</p>
          </div>
        </section>
        {/* Add more sections as needed */}
      </main>
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} KPT College. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
