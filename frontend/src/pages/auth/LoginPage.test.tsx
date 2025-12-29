import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { LoginPage } from './LoginPage';
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/login' }),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(authApi.getProfile).mockRejectedValue(new Error('No token'));
  });

  it('renders login form', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bourse alpe/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('disables submit button when fields are empty', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeDisabled();
    });
  });

  it('enables submit button when fields are filled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');

    expect(screen.getByRole('button', { name: /se connecter/i })).toBeEnabled();
  });

  it('shows loading state during login', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');

    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument();
    });
  });

  it('navigates to home on successful login', async () => {
    const user = userEvent.setup();
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
    vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse);

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    const { ApiException } = await import('@/api/client');
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiException('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect', 401)
    );

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrong');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/identifiants incorrects/i);
    });
  });

  it('shows forgot password link', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /mot de passe oublié/i })).toBeInTheDocument();
    });
  });

  it('shows activate account link', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /activer mon compte/i })).toBeInTheDocument();
    });
  });
});
