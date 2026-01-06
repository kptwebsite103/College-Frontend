import { apiRequest } from './http.js';

export function health() {
  return apiRequest('/health');
}

export function listPages() {
  return apiRequest('/api/pages');
}

export function listMenus() {
  return apiRequest('/api/menus');
}

export function listDepartments() {
  return apiRequest('/api/departments');
}

export function listUsers() {
  return apiRequest('/api/users');
}

export function createUser(userData) {
  return apiRequest('/api/users', {
    method: 'POST',
    body: userData // Don't stringify here, let http.js handle it
  });
}

export function deleteUser(userId) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'DELETE'
  });
}

export function updateUser(userId, userData) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'PUT',
    body: userData
  });
}

export function getUserCount() {
  const token = localStorage.getItem('accessToken');
  console.log('getUserCount - Token present:', !!token);
  console.log('getUserCount - Token value:', token ? 'Bearer ' + token.substring(0, 20) + '...' : 'No token');
  
  return apiRequest('/api/users/count');
}
