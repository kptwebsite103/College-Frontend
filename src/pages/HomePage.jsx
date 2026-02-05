import React from 'react';

const HomePage = () => {
  return (
    <div className="container">
      <h1>Welcome to KPT Mangalore</h1>
      <p>Excellence in Education since 1985</p>
      
      <section style={{ margin: '2rem 0' }}>
        <h2>About Our Institution</h2>
        <p>KPT Mangalore has been a beacon of educational excellence for over three decades. We provide quality education and foster holistic development for students.</p>
      </section>

      <section style={{ margin: '2rem 0' }}>
        <h2>Our Programs</h2>
        <p>We offer a wide range of undergraduate and postgraduate programs designed to meet the evolving needs of students and industry.</p>
      </section>

      <section style={{ margin: '2rem 0' }}>
        <h2>Campus Life</h2>
        <p>Experience vibrant campus life with numerous extracurricular activities, sports facilities, and cultural events throughout the year.</p>
      </section>

      <section style={{ margin: '2rem 0', minHeight: '400px' }}>
        <h2>Admissions</h2>
        <p>Join our community of learners. Admissions are now open for the upcoming academic year.</p>
      </section>
    </div>
  );
};

export default HomePage;
