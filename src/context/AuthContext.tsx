import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, AuthTokens } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: (email?: string, name?: string) => Promise<void>;
  loginAsMock: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cosmos_token';
const USER_KEY = 'cosmos_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load existing session on initial load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load session from storage', e);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (tokens: AuthTokens, userData: User) => {
    setToken(tokens.access);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, tokens.access);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  // Google One-Click Login (Matches Real Cosmos Video)
  const loginWithGoogle = async (
    email: string = 'kuma1412002@gmail.com',
    name: string = 'Guest 470'
  ) => {
    setIsLoading(true);
    try {
      try {
        const response = await authApi.loginWithGoogle(email, name);
        saveSession(response.tokens, response.user);
      } catch {
        // Instant reliable fallback if backend server isn't running
        const fallbackUser: User = {
          id: 'usr-guest-470',
          name: name,
          email: email,
          role: 'Admin',
          status: 'online',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest470',
        };
        const fallbackTokens: AuthTokens = {
          access: `google-jwt-${Date.now()}`,
        };
        saveSession(fallbackTokens, fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real API Login with password
  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      saveSession(response.tokens, response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock Login helper to test roles
  const loginAsMock = (role: UserRole) => {
    const mockUsers: Record<UserRole, User> = {
      Admin: {
        id: 'usr-guest-470',
        name: 'Guest 470',
        email: 'kuma1412002@gmail.com',
        role: 'Admin',
        status: 'online',
      },
      Employee: {
        id: 'usr-emp-002',
        name: 'Alex Rivera (Engineer)',
        email: 'alex.rivera@billiontags.com',
        role: 'Employee',
        status: 'online',
      },
      Guest: {
        id: 'usr-gst-003',
        name: 'Guest Client',
        email: 'guest@external.com',
        role: 'Guest',
        status: 'online',
      },
    };

    const mockTokens: AuthTokens = {
      access: `mock-jwt-token-for-${role.toLowerCase()}`,
    };

    saveSession(mockTokens, mockUsers[role]);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithGoogle,
        loginAsMock,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
