import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

/**
 * Custom API exception class.
 */
export class ApiException extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public field?: string
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * Attempt to refresh the access token using the refresh token.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || '/api'}/v1/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { access_token, refresh_token: newRefreshToken } = response.data;
    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', newRefreshToken);

    return access_token;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Create and configure the API client.
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response) {
        const { data, status } = error.response;

        // Handle 401 - try to refresh token
        if (status === 401 && !originalRequest._retry) {
          // Don't try to refresh if this is already a refresh request or login request
          const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
                               originalRequest.url?.includes('/auth/refresh');

          if (!isAuthRequest) {
            if (isRefreshing) {
              // Wait for the ongoing refresh to complete
              return new Promise((resolve, reject) => {
                subscribeTokenRefresh((token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(client(originalRequest));
                });
                // Timeout after 10 seconds
                setTimeout(() => {
                  reject(new ApiException('REFRESH_TIMEOUT', 'Token refresh timed out', 401));
                }, 10000);
              });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
              const newToken = await refreshAccessToken();
              isRefreshing = false;

              if (newToken) {
                onTokenRefreshed(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return client(originalRequest);
              } else {
                // Refresh failed, redirect to login
                window.location.href = '/login';
                throw new ApiException('SESSION_EXPIRED', 'Votre session a expiré', 401);
              }
            } catch (refreshError) {
              isRefreshing = false;
              clearTokens();
              window.location.href = '/login';
              throw refreshError;
            }
          } else {
            // Auth request failed, clear tokens
            clearTokens();
          }
        }

        throw new ApiException(
          data?.code || 'UNKNOWN_ERROR',
          data?.message || 'Une erreur est survenue',
          status,
          data?.field
        );
      }

      // Network error
      throw new ApiException(
        'NETWORK_ERROR',
        'Impossible de contacter le serveur',
        0
      );
    }
  );

  return client;
}

export const apiClient = createApiClient();
