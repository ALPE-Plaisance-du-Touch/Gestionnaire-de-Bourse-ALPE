import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useIsAuthenticated, useUser } from '@/contexts';

export function Header() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user
    ? user.first_name || user.email.split('@')[0]
    : '';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">
              Bourse ALPE
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/editions"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Éditions
                </Link>
                <Link
                  to="/lists"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Mes listes
                </Link>
                {user && (user.role === 'administrator' || user.role === 'manager') && (
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Administration
                  </Link>
                )}
              </>
            ) : null}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  Bonjour, <strong>{displayName}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
