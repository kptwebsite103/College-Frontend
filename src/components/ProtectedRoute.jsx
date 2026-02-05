import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getHighestRole, hasPermission } from '../utils/rolePermissions';

export default function ProtectedRoute({ children, adminOnly = false, requiredPermission = null }) {
  const { isLoaded, isSignedIn, currentUser } = useAuth();
  const highestRole = getHighestRole(currentUser);
  const isAdmin = ['admin', 'super-admin', 'creator'].includes(highestRole);
  const location = useLocation();

  // Show loading state while auth is loading
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('ProtectedRoute Debug:', { 
      isLoaded, 
      isSignedIn, 
      currentUser, 
      highestRole, 
      isAdmin, 
      adminOnly, 
      requiredPermission,
      path: location.pathname 
    });
  }

  // If user is not signed in, redirect to login page
  if (!isSignedIn) {
    console.log('User not signed in, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the route requires admin access and the user is not an admin
  if (adminOnly && !isAdmin) {
    console.log('User is not admin, redirecting to home. Admin check failed.');
    return <Navigate to="/" replace />;
  }

  // If specific permission is required and user doesn't have it
  if (requiredPermission && !hasPermission(currentUser, requiredPermission)) {
    console.log(`User lacks required permission: ${requiredPermission}`);
    return <Navigate to="/" replace />;
  }

  console.log('Access granted, rendering protected content');
  return children;
}
