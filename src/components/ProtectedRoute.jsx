import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAccessToken } from '../state/auth.js';

export default function ProtectedRoute({ children }) {
  const token = getAccessToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
