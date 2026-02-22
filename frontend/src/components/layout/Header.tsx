import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useIsAuthenticated, useUser } from '@/contexts';

export function Header() {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const adminButtonRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

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

  // Focus first menu item when menu opens
  useEffect(() => {
    if (isAdminMenuOpen) {
      const firstItem = menuItemsRef.current[0];
      if (firstItem) firstItem.focus();
    }
  }, [isAdminMenuOpen]);

  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const { logout } = useAuth();

  const isManagerOrAdmin = user && (user.role === 'administrator' || user.role === 'manager');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user
    ? user.firstName || user.email.split('@')[0]
    : '';

  const handleAdminButtonKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isAdminMenuOpen) {
      setIsAdminMenuOpen(false);
      adminButtonRef.current?.focus();
    } else if (e.key === 'ArrowDown' && !isAdminMenuOpen) {
      e.preventDefault();
      setIsAdminMenuOpen(true);
    }
  }, [isAdminMenuOpen]);

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = menuItemsRef.current.filter(Boolean) as HTMLAnchorElement[];
    const currentIndex = items.indexOf(document.activeElement as HTMLAnchorElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          items[currentIndex + 1].focus();
        } else {
          items[0].focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          items[currentIndex - 1].focus();
        } else {
          items[items.length - 1].focus();
        }
        break;
      case 'Escape':
        setIsAdminMenuOpen(false);
        adminButtonRef.current?.focus();
        break;
      case 'Tab':
        setIsAdminMenuOpen(false);
        break;
    }
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Block body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  return (
    <>
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">
              Bourse ALPE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
            {isAuthenticated ? (
              <>
                {isManagerOrAdmin && (
                  <Link
                    to="/editions"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Éditions
                  </Link>
                )}
                <Link
                  to="/lists"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Mes listes
                </Link>
                {isManagerOrAdmin && (
                  <div className="relative" ref={adminMenuRef}>
                    <button
                      ref={adminButtonRef}
                      onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                      onKeyDown={handleAdminButtonKeyDown}
                      aria-expanded={isAdminMenuOpen}
                      aria-haspopup="true"
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Administration
                      <svg
                        className={`w-4 h-4 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isAdminMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                        role="menu"
                        aria-label="Menu administration"
                        onKeyDown={handleMenuKeyDown}
                      >
                        <div className="py-1">
                          <Link
                            ref={(el) => { menuItemsRef.current[0] = el; }}
                            to="/admin"
                            role="menuitem"
                            tabIndex={-1}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Tableau de bord
                          </Link>
                          <Link
                            ref={(el) => { menuItemsRef.current[1] = el; }}
                            to="/admin/invitations"
                            role="menuitem"
                            tabIndex={-1}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Invitations
                          </Link>
                          {user.role === 'administrator' && (
                            <>
                              <Link
                                ref={(el) => { menuItemsRef.current[2] = el; }}
                                to="/admin/users"
                                role="menuitem"
                                tabIndex={-1}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                onClick={() => setIsAdminMenuOpen(false)}
                              >
                                Utilisateurs
                              </Link>
                              <Link
                                ref={(el) => { menuItemsRef.current[3] = el; }}
                                to="/admin/audit-logs"
                                role="menuitem"
                                tabIndex={-1}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                onClick={() => setIsAdminMenuOpen(false)}
                              >
                                Journal d'audit
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </nav>

          {/* Mobile hamburger + User menu */}
          <div className="flex items-center gap-2">
            {/* Hamburger button - mobile only */}
            {isAuthenticated && (
              <button
                type="button"
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}

            {/* Desktop user menu */}
            <div className="hidden md:flex items-center gap-4">
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

            {/* Mobile login link */}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="md:hidden text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Mobile menu backdrop */}
    {isMobileMenuOpen && isAuthenticated && (
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />
    )}

    {/* Mobile menu drawer */}
    {isAuthenticated && (
      <div
        id="mobile-menu"
        className={`fixed inset-y-0 right-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Menu</span>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-md"
            aria-label="Fermer le menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-4 py-4 space-y-1 overflow-y-auto" aria-label="Navigation mobile">
          {isManagerOrAdmin && (
            <Link
              to="/editions"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={closeMobileMenu}
            >
              Éditions
            </Link>
          )}
          <Link
            to="/lists"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            onClick={closeMobileMenu}
          >
            Mes listes
          </Link>

          {isManagerOrAdmin && (
            <>
              <div className="border-t border-gray-200 my-2" />
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </p>
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                Tableau de bord
              </Link>
              <Link
                to="/admin/invitations"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                Invitations
              </Link>
              {user?.role === 'administrator' && (
                <>
                  <Link
                    to="/admin/users"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={closeMobileMenu}
                  >
                    Utilisateurs
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={closeMobileMenu}
                  >
                    Journal d'audit
                  </Link>
                </>
              )}
            </>
          )}

          <div className="border-t border-gray-200 my-2" />
          <Link
            to="/profile"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            onClick={closeMobileMenu}
          >
            Mon profil
          </Link>
          <button
            onClick={() => { closeMobileMenu(); handleLogout(); }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Déconnexion
          </button>
        </nav>
      </div>
    )}
    </>
  );
}
