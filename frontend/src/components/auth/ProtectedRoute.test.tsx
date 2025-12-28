import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/test-utils';
import { ProtectedRoute } from './ProtectedRoute';
import { authApi } from '@/api';

// Mock the auth API
vi.mock('@/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    activateAccount: vi.fn(),
  },
}));

function TestComponent() {
  return <div>Protected Content</div>;
}

function renderWithRoute(allowedRoles?: ('depositor' | 'volunteer' | 'manager' | 'administrator')[]) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={allowedRoles}>
            <TestComponent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows loading spinner while checking auth', () => {
    vi.mocked(authApi.getProfile).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    localStorage.setItem('accessToken', 'token');

    renderWithRoute();

    expect(screen.getByRole('status', { hidden: true }) || document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('redirects to login when not authenticated', async () => {
    vi.mocked(authApi.getProfile).mockRejectedValue(new Error('No token'));

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders protected content when authenticated', async () => {
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

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('shows forbidden page when user lacks required role', async () => {
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

    renderWithRoute(['administrator']);

    await waitFor(() => {
      expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
    });
  });

  it('allows access when user has required role', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'administrator' as const,
      is_active: true,
      is_verified: true,
    };
    localStorage.setItem('accessToken', 'valid-token');
    vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

    renderWithRoute(['administrator', 'manager']);

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('allows any authenticated user when no roles specified', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Jean',
      last_name: 'Dupont',
      role: 'volunteer' as const,
      is_active: true,
      is_verified: true,
    };
    localStorage.setItem('accessToken', 'valid-token');
    vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
