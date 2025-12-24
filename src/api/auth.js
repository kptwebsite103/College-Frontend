import { apiRequest } from './http.js';

export function login({ email, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function register({ email, password, firstName, lastName }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: { email, password, firstName, lastName },
  });
}

export function me() {
  return apiRequest('/api/me');
}
