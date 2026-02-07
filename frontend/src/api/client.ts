import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

/**
 * Convert camelCase to snake_case.
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase.
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively convert object keys to snake_case.
 */
function keysToSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(keysToSnakeCase);
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        toSnakeCase(key),
        keysToSnakeCase(value),
      ])
    );
  }
  return obj;
}

/**
 * Recursively convert object keys to camelCase.
 */
function keysToCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase);
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        toCamelCase(key),
        keysToCamelCase(value),
      ])
    );
  }
  return obj;
}

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

  // Request interceptor - add auth token and transform data to snake_case
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Transform request data: camelCase -> snake_case
      // Skip FormData objects (file uploads)
      if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.data = keysToSnakeCase(config.data);
      }
      // Remove Content-Type for FormData so browser sets it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - transform data to camelCase and handle errors
  client.interceptors.response.use(
    (response) => {
      // Transform response data: snake_case -> camelCase
      // Skip Blob/ArrayBuffer responses (e.g. PDF downloads)
      if (response.data && typeof response.data === 'object'
          && !(response.data instanceof Blob)
          && !(response.data instanceof ArrayBuffer)) {
        response.data = keysToCamelCase(response.data);
      }
      return response;
    },
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

        // FastAPI returns errors in 'detail' field, not 'message'
        const errorMessage = data?.message || data?.detail || 'Une erreur est survenue';
        throw new ApiException(
          data?.code || 'UNKNOWN_ERROR',
          typeof errorMessage === 'string' ? errorMessage : 'Une erreur est survenue',
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
