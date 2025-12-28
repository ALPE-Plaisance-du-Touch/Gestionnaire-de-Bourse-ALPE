import axios, { type AxiosError, type AxiosInstance } from 'axios';
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

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      if (error.response) {
        const { data, status } = error.response;

        // Handle 401 - try to refresh token
        if (status === 401) {
          // TODO: Implement token refresh logic
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
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
