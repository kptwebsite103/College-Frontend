import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoaded, isSignedIn, currentUser } = useAuth();
  const isAdmin = Array.isArray(currentUser?.roles) ? currentUser.roles.map(r => String(r).toLowerCase()).includes('admin') : false;
  const location = useLocation();

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('ProtectedRoute Debug:', { isLoaded, isSignedIn, currentUser, isAdmin, adminOnly, path: location.pathname });
  }

  // If user is not signed in, redirect to login page
  if (!isSignedIn) {
    console.log('User not signed in, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the route requires admin access and the user is not an admin
  if (adminOnly && !isAdmin) {
    console.log('User is not admin, redirecting to home. Admin check failed.');
    
    // Show debug info for non-admin users in development
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ 
          padding: '2rem', 
          maxWidth: '800px', 
          margin: '2rem auto',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <h2>Authentication Debug Info</h2>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Is Signed In:</strong> {isSignedIn ? '✅ Yes' : '❌ No'}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Admin Required:</strong> {adminOnly ? '✅ Yes' : '❌ No'}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>User Email:</strong> {currentUser?.emailAddresses?.[0]?.emailAddress || 'N/A'}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>User Name:</strong> {currentUser?.firstName || 'N/A'} {currentUser?.lastName || ''}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Public Metadata:</strong>
            <pre style={{ 
              backgroundColor: '#e9ecef', 
              padding: '0.5rem', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(currentUser?.publicMetadata, null, 2) || 'null'}
            </pre>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Private Metadata:</strong>
            <pre style={{ 
              backgroundColor: '#e9ecef', 
              padding: '0.5rem', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(currentUser?.privateMetadata, null, 2) || 'null'}
            </pre>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Full User Object:</strong>
            <pre style={{ 
              backgroundColor: '#e9ecef', 
              padding: '0.5rem', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
              maxHeight: '200px'
            }}>
              {JSON.stringify(currentUser, null, 2) || 'null'}
            </pre>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            Go to Homepage
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    
    return <Navigate to="/" replace />;
  }

  console.log('Access granted, rendering protected content');
  return children;
}
