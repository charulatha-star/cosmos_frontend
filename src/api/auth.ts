import apiClient from './client';
import type { AuthResponse, User } from '../types';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export const authApi = {
  // Google One-Click Login (Matches real Cosmos Video)
  loginWithGoogle: async (email: string = 'kuma1412002@gmail.com', name: string = 'Guest 470'): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google/', { email, name });
    return response.data;
  },

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

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout/');
    } catch {
      // Ignore
    }
  },
};

export default authApi;
