import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useIsAuthenticated, useUser } from '@/contexts';
import { editionsApi } from '@/api/editions';
import { ticketsApi } from '@/api/tickets';

interface HeaderProps {
  sidebarTrigger?: React.ReactNode;
}

export function Header({ sidebarTrigger }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const { logout } = useAuth();

  const isManagerOrAdmin = user && (user.role === 'administrator' || user.role === 'manager');
  const canAccessTickets = user && user.role !== 'volunteer';

  const { data: activeEditionData } = useQuery({
    queryKey: ['active-edition'],
    queryFn: () => editionsApi.getActiveEdition(),
    enabled: isAuthenticated,
    staleTime: 60000,
  });

  const activeEditionId = activeEditionData?.edition?.id ?? activeEditionData?.trainingEdition?.id;

  const { data: unreadData } = useQuery({
    queryKey: ['tickets-unread', activeEditionId],
    queryFn: () => ticketsApi.getUnreadCount(activeEditionId!),
    enabled: isAuthenticated && !!activeEditionId && !!canAccessTickets,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.unreadCount ?? 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user
    ? user.firstName || user.email.split('@')[0]
    : '';

  const initials = user
    ? `${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}`
    : '';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-sand shadow-soft h-16 shrink-0">
      <div className={`h-full flex items-center justify-between ${isManagerOrAdmin ? 'px-4 lg:px-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        {/* Left side */}
        <div className="flex items-center gap-3">
          {sidebarTrigger}
          {!isManagerOrAdmin && (
            <Link to="/" className="text-lg font-bold text-primary-strong">
              Bourse ALPE
            </Link>
          )}
        </div>

        {/* Center nav - depositor/volunteer only (no sidebar) */}
        {isAuthenticated && !isManagerOrAdmin && (
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
            <Link
              to="/lists"
              className="px-4 py-2 rounded-xl text-sm font-medium text-bark-light hover:bg-cream-dark hover:text-bark transition-colors"
            >
              Mon espace
            </Link>
            {activeEditionId && canAccessTickets && (
              <Link
                to={`/editions/${activeEditionId}/tickets`}
                className="px-4 py-2 rounded-xl text-sm font-medium text-bark-light hover:bg-cream-dark hover:text-bark transition-colors inline-flex items-center gap-2"
              >
                Messages
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-secondary rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/aide"
              className="px-4 py-2 rounded-xl text-sm font-medium text-bark-light hover:bg-cream-dark hover:text-bark transition-colors"
            >
              Aide
            </Link>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-cream-dark transition-colors"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                {/* Avatar circle */}
                <div className="w-8 h-8 rounded-full bg-info-soft text-primary-strong flex items-center justify-center text-sm font-semibold">
                  {initials}
                </div>
                <span className="hidden md:block text-sm font-medium text-bark">
                  {displayName}
                </span>
                <svg
                  className={`hidden md:block w-4 h-4 text-bark-muted transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-sand z-50 py-1">
                  <div className="px-4 py-3 border-b border-sand">
                    <p className="text-sm font-medium text-bark">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-bark-muted truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-bark-light hover:bg-cream-dark hover:text-bark transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mon profil
                  </Link>
                  <Link
                    to="/aide"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-bark-light hover:bg-cream-dark hover:text-bark transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Aide
                  </Link>
                  {/* Mobile-only nav links */}
                  {!isManagerOrAdmin && (
                    <div className="md:hidden border-t border-sand mt-1 pt-1">
                      <Link
                        to="/lists"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-bark-light hover:bg-cream-dark hover:text-bark transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Mon espace
                      </Link>
                      {activeEditionId && canAccessTickets && (
                        <Link
                          to={`/editions/${activeEditionId}/tickets`}
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-bark-light hover:bg-cream-dark hover:text-bark transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span className="flex items-center gap-3">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Messages
                          </span>
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-secondary rounded-full">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      )}
                    </div>
                  )}
                  <div className="border-t border-sand mt-1 pt-1">
                    <button
                      onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error-dark hover:bg-cream-dark transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-primary-strong hover:text-primary-strong px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
