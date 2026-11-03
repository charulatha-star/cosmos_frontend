import apiClient from './client';
import type { AuthResponse, User } from '../types';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export const authApi = {
  // Login with email and password
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login/', credentials);
    return response.data;
  },

  // Fetch currently authenticated user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me/');
    return response.data;
  },

  // Logout (optional token revocation)
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout/');
    } catch {
      // Ignore network errors on logout
    }
  },
};

export default authApi;
