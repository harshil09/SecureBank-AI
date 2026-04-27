// src/config/env.js

/**
 * Environment configuration
 * Centralizes all environment variables for easy management
 */

export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    GOOGLE_LOGIN: `${API_BASE_URL}/auth/google/login`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/auth/google/callback`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  USER: {
    PROFILE: `${API_BASE_URL}/user/profile`,
    TRANSACTIONS: `${API_BASE_URL}/user/transactions`,
  },
};

// Export for debugging (remove in production)
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;