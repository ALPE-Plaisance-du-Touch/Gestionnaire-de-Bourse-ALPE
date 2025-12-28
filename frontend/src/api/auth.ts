import { apiClient } from './client';
import type { LoginRequest, LoginResponse, ActivateAccountRequest, User } from '@/types';

/**
 * Authentication API endpoints.
 */
export const authApi = {
  /**
   * Login with email and password.
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/v1/auth/login', data);
    return response.data;
  },

  /**
   * Logout current user.
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/v1/auth/logout');
  },

  /**
   * Refresh access token.
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/v1/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Get current user profile.
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/v1/auth/me');
    return response.data;
  },

  /**
   * Activate account with invitation token.
   */
  activateAccount: async (data: ActivateAccountRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/v1/auth/activate', data);
    return response.data;
  },

  /**
   * Request password reset.
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/v1/auth/password-reset/request', { email });
  },

  /**
   * Reset password with token.
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/v1/auth/password-reset/confirm', { token, password });
  },
};
