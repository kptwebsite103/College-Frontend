// Development helper - create mock admin authentication
export function createDevAuth() {
  const mockUser = {
    id: 'dev-admin-1',
    email: 'dev@admin.com',
    role: 'admin',
    name: 'Development Admin'
  };

  const mockToken = 'dev-mock-jwt-token-for-development';
  
  localStorage.setItem('kpt_access_token', mockToken);
  localStorage.setItem('kpt_refresh_token', mockToken);
  localStorage.setItem('kpt_user', JSON.stringify(mockUser));
  
  console.log('Development auth created - Admin user logged in');
  return mockUser;
}

// Check if development auth exists
export function hasDevAuth() {
  return !!localStorage.getItem('kpt_access_token');
}

// Clear development auth
export function clearDevAuth() {
  localStorage.removeItem('kpt_access_token');
  localStorage.removeItem('kpt_refresh_token');
  localStorage.removeItem('kpt_user');
  console.log('Development auth cleared');
}

// Auto-create dev auth if none exists (for development)
export function ensureDevAuth() {
  if (!hasDevAuth()) {
    return createDevAuth();
  }
  return JSON.parse(localStorage.getItem('kpt_user'));
}
