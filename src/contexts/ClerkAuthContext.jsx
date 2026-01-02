import { createContext, useContext } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const ClerkAuthContext = createContext();

export function useClerkAuth() {
  return useContext(ClerkAuthContext);
}

export function ClerkAuthProvider({ children }) {
  // Handle the case where Clerk might not be properly initialized
  let authData;
  let userData;
  try {
    authData = useAuth();
    userData = useUser();
  } catch (error) {
    console.warn('Clerk not properly initialized:', error);
    // Fallback values when Clerk is not available
    authData = {
      isLoaded: true,
      isSignedIn: false,
      signOut: async () => {},
    };
    userData = {
      isLoaded: true,
      user: null,
    };
  }

  const { isLoaded: authLoaded, isSignedIn, signOut } = authData;
  const { isLoaded: userLoaded, user } = userData;
  const isLoaded = authLoaded && userLoaded;

  const login = async (email, password) => {
    // Clerk handles login through their components, so this is just a placeholder
    // Actual login will be handled by Clerk's SignIn component
    return { success: false, error: 'Please use the Clerk sign-in component' };
  };

  const register = async (userData) => {
    // Clerk handles registration through their components, so this is just a placeholder
    // Actual registration will be handled by Clerk's SignUp component
    return { success: false, error: 'Please use the Clerk sign-up component' };
  };

  const logout = async () => {
    try {
      await signOut();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  };

  // Check if user is admin based on Clerk metadata
  const isAdmin = user?.publicMetadata?.role === 'admin' || 
                 user?.privateMetadata?.role === 'admin' ||
                 user?.emailAddresses?.[0]?.emailAddress?.includes('admin') ||
                 (user?.firstName && user.firstName.toLowerCase().includes('admin'));

  // Debug logging for admin detection
  console.log('Admin Detection Debug:', {
    authLoaded,
    userLoaded,
    isLoaded,
    isSignedIn,
    user,
    publicMetadata: user?.publicMetadata,
    privateMetadata: user?.privateMetadata,
    userEmail: user?.emailAddresses?.[0]?.emailAddress,
    userName: user?.firstName,
    isAdmin,
    checks: {
      publicRole: user?.publicMetadata?.role === 'admin',
      privateRole: user?.privateMetadata?.role === 'admin',
      emailAdmin: user?.emailAddresses?.[0]?.emailAddress?.includes('admin'),
      nameAdmin: user?.firstName && user.firstName.toLowerCase().includes('admin')
    }
  });

  const value = {
    isLoaded,
    isSignedIn,
    currentUser: user,
    isAdmin,
    login,
    register,
    logout,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
}

export default ClerkAuthProvider;
