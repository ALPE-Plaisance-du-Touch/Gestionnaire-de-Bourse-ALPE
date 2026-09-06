import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/test-utils';
import { ProtectedRoute } from './ProtectedRoute';
import { authApi } from '@/api';
import { baseUser } from '@/test/fixtures';

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

    // The spinner has class animate-spin
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('redirects to login when not authenticated', async () => {
    vi.mocked(authApi.getProfile).mockRejectedValue(new Error('No token'));

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders protected content when authenticated', async () => {
    const mockUser = { ...baseUser, role: 'depositor' as const };
    localStorage.setItem('accessToken', 'valid-token');
    vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('shows forbidden page when user lacks required role', async () => {
    const mockUser = { ...baseUser, role: 'depositor' as const };
    localStorage.setItem('accessToken', 'valid-token');
    vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

    renderWithRoute(['administrator']);

    await waitFor(() => {
      expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
    });
  });

  it('allows access when user has required role', async () => {
    const mockUser = { ...baseUser, email: 'admin@example.com', firstName: 'Admin', lastName: 'User', role: 'administrator' as const };
    localStorage.setItem('accessToken', 'valid-token');
    vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

    renderWithRoute(['administrator', 'manager']);

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('allows any authenticated user when no roles specified', async () => {
    const mockUser = { ...baseUser, role: 'volunteer' as const };
    localStorage.setItem('accessToken', 'valid-token');
    vi.mocked(authApi.getProfile).mockResolvedValue(mockUser);

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
