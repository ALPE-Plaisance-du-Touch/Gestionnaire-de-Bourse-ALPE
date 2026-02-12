import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth, useUser, useIsAuthenticated } from './AuthContext';
import { authApi } from '@/api';
import type { ReactNode } from 'react';

// Mock the auth API
vi.mock('@/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    activateAccount: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('useAuth', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('provides initial unauthenticated state', async () => {
      vi.mocked(authApi.getProfile).mockRejectedValue(new Error('No token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('restores session from localStorage on mount', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'depositor' as const,
        is_active: true,
        is_verified: true,
      };

      localStorage.setItem('accessToken', 'valid-token');
      vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('stores tokens and sets user on successful login', async () => {
      const mockLoginResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          first_name: 'Jean',
          last_name: 'Dupont',
          role: 'depositor' as const,
          is_active: true,
          is_verified: true,
        },
        tokenType: 'bearer',
      };

      vi.mocked(authApi.getProfile).mockRejectedValue(new Error('No token'));
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(localStorage.getItem('accessToken')).toBe('access-token');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('throws error on login failure', async () => {
      vi.mocked(authApi.getProfile).mockRejectedValue(new Error('No token'));
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears tokens and resets state', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'depositor' as const,
        is_active: true,
        is_verified: true,
      };

      localStorage.setItem('accessToken', 'valid-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('clears tokens even if logout API fails', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'depositor' as const,
        is_active: true,
        is_verified: true,
      };

      localStorage.setItem('accessToken', 'valid-token');
      vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('useUser', () => {
    it('returns null when not authenticated', async () => {
      vi.mocked(authApi.getProfile).mockRejectedValue(new Error('No token'));

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeNull();
      });
    });

    it('returns user when authenticated', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'depositor' as const,
        is_active: true,
        is_verified: true,
      };

      localStorage.setItem('accessToken', 'valid-token');
      vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current).toEqual(mockUser);
      });
    });
  });

  describe('useIsAuthenticated', () => {
    it('returns false when not authenticated', async () => {
      vi.mocked(authApi.getProfile).mockRejectedValue(new Error('No token'));

      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('returns true when authenticated', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'depositor' as const,
        is_active: true,
        is_verified: true,
      };

      localStorage.setItem('accessToken', 'valid-token');
      vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });
});
