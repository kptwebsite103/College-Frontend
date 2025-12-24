import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import HealthPage from './pages/HealthPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import MePage from './pages/MePage.jsx';
import PagesPage from './pages/PagesPage.jsx';
import MenusPage from './pages/MenusPage.jsx';
import DepartmentsPage from './pages/DepartmentsPage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/pages" element={<PagesPage />} />
        <Route path="/menus" element={<MenusPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />

        <Route
          path="/me"
          element={
            <ProtectedRoute>
              <MePage />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="*" element={<div className="card">Not Found</div>} />
      </Routes>
    </Layout>
  );
}
