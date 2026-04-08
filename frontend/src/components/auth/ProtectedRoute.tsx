import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useIsAuthenticated } from '@/contexts';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required roles to access this route. If empty, any authenticated user can access. */
  allowedRoles?: UserRole[];
}

/**
 * Wrapper component that protects routes requiring authentication.
 * Redirects to login if not authenticated, or shows forbidden if role doesn't match.
 */
export function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Chargement">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role);
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="max-w-md w-full text-center px-4">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-bark mb-2">Accès refusé</h1>
            <p className="text-bark-light mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
