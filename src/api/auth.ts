import apiClient from './client';
import type { AuthResponse, User } from '../types';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export const authApi = {
  // Google Sign-in with email and password
  loginWithGoogle: async (email: string, password?: string, name?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google/', { email, password, name });
    return response.data;
  },

  // Login with email and password
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login/', credentials);
    return response.data;
  },

  // Guest Instant Entry (No Sign In)
  guestLogin: async (name?: string, spaceId?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/guest-login/', { name, space_id: spaceId });
    return response.data;
  },

  // Search registered users for member invites
  searchUsers: async (q?: string): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/auth/users/', { params: { q } });
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
