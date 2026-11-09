import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to inject the Auth token into requests 
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('cosmos_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized gracefully without reloading loops
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Clean up expired or invalid token if backend returns 401
    if (error.response?.status === 401) {
      console.warn('API 401 Unauthorized:', error.config?.url);
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/google')) {
        localStorage.removeItem('cosmos_token');
        localStorage.removeItem('cosmos_user');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
