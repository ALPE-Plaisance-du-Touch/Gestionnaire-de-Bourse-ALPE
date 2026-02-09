import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useIsAuthenticated, useUser } from '@/contexts';

export function Header() {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
                  <div className="relative" ref={adminMenuRef}>
                    <button
                      onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Administration
                      <svg
                        className={`w-4 h-4 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isAdminMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Tableau de bord
                          </Link>
                          <Link
                            to="/admin/invitations"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Invitations
                          </Link>
                          {user.role === 'administrator' && (
                            <Link
                              to="/admin/audit-logs"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsAdminMenuOpen(false)}
                            >
                              Journal d'audit
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Bonjour, <strong>{displayName}</strong>
                </Link>
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
