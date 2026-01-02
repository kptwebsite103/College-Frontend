import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HealthPage from './pages/HealthPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import MePage from './pages/MePage.jsx';
import PagesPage from './pages/PagesPage.jsx';
import MenusPage from './pages/MenusPage.jsx';
import DepartmentsPage from './pages/DepartmentsPage.jsx';

// Admin layout component
const AdminLayout = ({ children }) => (
  <Layout>
    {children}
  </Layout>
);

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/health" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <HealthPage />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/pages" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <PagesPage />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/menus" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <MenusPage />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/departments" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <DepartmentsPage />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/me" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <MePage />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
