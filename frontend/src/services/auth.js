// frontend/src/services/auth.js
import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/register', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/token', 
      new URLSearchParams(credentials),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },

  async googleLogin(credential) {
    const response = await api.post('/auth/google', { credential });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  getCurrentUser() {
    return api.get('/users/me');
  },
};

export const accountService = {
  async getAccounts() {
    const response = await api.get('/accounts');
    return response.data;
  },

  async getBalance(accountId) {
    const response = await api.get(`/accounts/${accountId}/balance`);
    return response.data;
  },

  async getTransactions(accountId, limit = 20) {
    const response = await api.get(`/accounts/${accountId}/transactions?limit=${limit}`);
    return response.data;
  },

  async transfer(transferData) {
    const response = await api.post('/transfer', transferData);
    return response.data;
  },
};