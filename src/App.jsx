import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import PublicLayout from './components/PublicLayout.jsx';
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
import DynamicPage from './pages/DynamicPage.jsx';
import HomePageManagement from './pages/HomePageManagement.jsx';
import UserManagement from './pages/UserManagement.jsx';
import MediaPage from './pages/MediaPage.jsx';

// Admin layout component
const AdminLayout = ({ children }) => (
  <Layout>
    {children}
  </Layout>
);

// Public layout component
const PublicLayoutWrapper = ({ children }) => (
  <PublicLayout>
    {children}
  </PublicLayout>
);

export default function App() {
  return (
    <Routes>
      {/* Public Routes with DynamicNavbar */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<PublicLayoutWrapper><HomePage /></PublicLayoutWrapper>} />
      
      {/* Auth Routes without DynamicNavbar */}
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
        path="/admin/homepage" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <HomePageManagement />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requiredPermission="canViewUserList">
            <AdminLayout>
              <UserManagement />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/media" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <MediaPage />
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

      {/* Dynamic Routes for Custom Navbar Pages */}
      <Route path="/:parentRoute/:childRoute" element={<PublicLayoutWrapper><DynamicPage /></PublicLayoutWrapper>} />
      <Route path="/:parentRoute/:childRoute/:grandChildRoute" element={<PublicLayoutWrapper><DynamicPage /></PublicLayoutWrapper>} />
      <Route path="/:route" element={<PublicLayoutWrapper><DynamicPage /></PublicLayoutWrapper>} />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
