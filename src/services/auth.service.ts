import api from './api';
import type { LoginCredentials, SignupCredentials, AuthResponse, ApiResponse, User } from '@/types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );
    return response.data.data;
  },

  signup: async (credentials: SignupCredentials): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/auth/signup',
      credentials
    );
    return { message: response.data.message || 'Account created successfully' };
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      { email }
    );
    return { message: response.data.message || 'If an account exists, a reset email has been sent.' };
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean; email?: string }> => {
    const response = await api.get<ApiResponse<{ valid: boolean; email?: string }>>(
      `/auth/verify-reset-token/${token}`
    );
    return response.data.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      { token, password }
    );
    return { message: response.data.message || 'Password reset successfully.' };
  },

  verifyEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.get<{ success: boolean; message: string }>(
      `/auth/verify-email/${token}`
    );
    return response.data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/auth/resend-verification',
      { email }
    );
    return { message: response.data.message || 'Verification email sent.' };
  },
};

export default authService;
