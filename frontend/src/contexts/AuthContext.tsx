import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi } from '@/api';
import type { User, LoginRequest, ActivateAccountRequest } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  activateAccount: (data: ActivateAccountRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await authApi.getProfile();
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, [clearTokens]);

  const login = useCallback(
    async (data: LoginRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await authApi.login(data);
        setTokens(response.accessToken, response.refreshToken);
        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [setTokens]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens();
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, [clearTokens]);

  const activateAccount = useCallback(
    async (data: ActivateAccountRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const user = await authApi.activateAccount(data);
        setState({
          user: user as unknown as User,
          isAuthenticated: false, // User needs to login after activation
          isLoading: false,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    []
  );

  // Check authentication on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        activateAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
