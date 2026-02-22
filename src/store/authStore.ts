import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User, OrganizationType } from '@/types';

const API_URL = import.meta.env.VITE_API_URL;

// Decode JWT to extract organizationType without a library
const decodeJwtPayload = (token: string): { organizationType?: OrganizationType } => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  organizationType: OrganizationType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      organizationType: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setTokens: (token, refreshToken) => {
        const decoded = decodeJwtPayload(token);
        set({
          token,
          refreshToken,
          organizationType: decoded.organizationType || null,
        });
      },

      login: (user, token, refreshToken) => {
        const decoded = decodeJwtPayload(token);
        set({
          user,
          token,
          refreshToken,
          organizationType: decoded.organizationType || null,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          organizationType: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { token: newToken, refreshToken: newRefreshToken, user } = response.data.data;
          const decoded = decodeJwtPayload(newToken);
          set({
            token: newToken,
            refreshToken: newRefreshToken,
            user,
            organizationType: decoded.organizationType || null,
          });
        } catch {
          // ignore — session stays as-is
        }
      },

      initializeAuth: async () => {
        const { refreshToken, isInitialized } = get();

        // Only initialize once
        if (isInitialized) {
          return;
        }

        // If no refresh token, just mark as initialized
        if (!refreshToken) {
          set({ isLoading: false, isInitialized: true, isAuthenticated: false });
          return;
        }

        try {
          // Try to refresh the tokens to ensure user stays logged in
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token: newToken, refreshToken: newRefreshToken, user } = response.data.data;
          const decoded = decodeJwtPayload(newToken);

          set({
            token: newToken,
            refreshToken: newRefreshToken,
            user,
            organizationType: decoded.organizationType || null,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } catch {
          // Refresh token expired or invalid - log out user
          set({
            user: null,
            token: null,
            refreshToken: null,
            organizationType: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        organizationType: state.organizationType,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
