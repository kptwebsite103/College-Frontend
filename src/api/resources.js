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
