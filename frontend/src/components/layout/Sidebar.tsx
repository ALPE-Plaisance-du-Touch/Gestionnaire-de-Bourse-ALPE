import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/contexts';
import { editionsApi } from '@/api/editions';
import { ticketsApi } from '@/api/tickets';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const user = useUser();
  const isAdmin = user?.role === 'administrator';

  const { data: activeEditionData } = useQuery({
    queryKey: ['active-edition'],
    queryFn: () => editionsApi.getActiveEdition(),
    staleTime: 60000,
  });

  const activeEdition = activeEditionData?.edition ?? activeEditionData?.trainingEdition;
  const activeEditionId = activeEdition?.id;

  const canAccessTickets = user && user.role !== 'volunteer';

  const { data: unreadData } = useQuery({
    queryKey: ['tickets-unread', activeEditionId],
    queryFn: () => ticketsApi.getUnreadCount(activeEditionId!),
    enabled: !!activeEditionId && !!canAccessTickets,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.unreadCount ?? 0;

  const sections: NavSection[] = [
    {
      items: [
        {
          label: 'Tableau de bord',
          path: '/admin',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Édition active',
      items: [
        ...(activeEditionId ? [
          {
            label: 'Configuration',
            path: `/editions/${activeEditionId}`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
          },
          {
            label: 'Déposants',
            path: `/editions/${activeEditionId}/depositors`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            label: 'Déclarations',
            path: `/editions/${activeEditionId}/declarations`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            ),
          },
          ...(activeEdition?.labelsEnabled ? [{
            label: 'Étiquettes',
            path: `/editions/${activeEditionId}/labels`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            ),
          }] : []),
          ...(activeEdition?.salesEnabled ? [{
            label: 'Statistiques',
            path: `/editions/${activeEditionId}/stats`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          }] : []),
        ] : []),
      ],
    },
    {
      title: 'Ventes',
      items: [
        ...(activeEditionId && activeEdition?.salesEnabled ? [
          {
            label: 'Caisse',
            path: `/editions/${activeEditionId}/sales`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            ),
          },
          {
            label: 'Gestion des ventes',
            path: `/editions/${activeEditionId}/sales/manage`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
          },
        ] : []),
        ...(activeEditionId && activeEdition?.payoutsEnabled ? [
          {
            label: 'Reversements',
            path: `/editions/${activeEditionId}/payouts`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
        ] : []),
      ],
    },
    {
      title: 'Gestion',
      items: [
        {
          label: 'Éditions',
          path: '/editions',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          label: 'Invitations',
          path: '/admin/invitations',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
        },
        ...(activeEditionId && canAccessTickets && activeEdition?.ticketsEnabled ? [
          {
            label: 'Messages',
            path: `/editions/${activeEditionId}/tickets`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            ),
            badge: unreadCount > 0 ? unreadCount : undefined,
          },
        ] : []),
      ],
    },
    ...(isAdmin ? [{
      title: 'Administration',
      items: [
        {
          label: 'Utilisateurs',
          path: '/admin/users',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          label: 'Journal d\'audit',
          path: '/admin/audit-logs',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          label: 'Paramètres',
          path: '/admin/settings',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          ),
        },
      ],
    }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const renderNav = (mobile = false) => (
    <nav className={`flex-1 overflow-y-auto ${mobile ? 'px-3 py-4' : 'px-3 py-4'}`} aria-label="Navigation administration">
      {sections.map((section, sIndex) => {
        if (section.items.length === 0) return null;
        return (
          <div key={sIndex} className={sIndex > 0 ? 'mt-6' : ''}>
            {section.title && !isCollapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-bark-muted uppercase tracking-wider">
                {section.title}
              </p>
            )}
            {section.title && isCollapsed && !mobile && (
              <div className="mx-3 mb-2 border-t border-sand" />
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onMobileClose()}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150
                      ${active
                        ? 'bg-info-soft text-primary-strong'
                        : 'text-bark-light hover:bg-cream-dark hover:text-bark'
                      }
                      ${isCollapsed && !mobile ? 'justify-center' : ''}
                    `}
                  >
                    <span className={`shrink-0 ${active ? 'text-primary-strong' : ''}`}>
                      {item.icon}
                    </span>
                    {(!isCollapsed || mobile) && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-secondary rounded-full">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && !mobile && item.badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar. Sticky and viewport-tall: on a long document the nav
          scrolled away with the page, leaving no way back without scrolling up. */}
      <aside
        className={`
          hidden lg:flex flex-col
          sticky top-0 h-screen overflow-y-auto
          bg-white border-r border-sand
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
          shrink-0
        `}
      >
        {/* Logo + collapse toggle */}
        <div className={`flex items-center h-16 border-b border-sand ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!isCollapsed && (
            <Link to="/" className="text-lg font-bold text-primary-strong">
              Bourse ALPE
            </Link>
          )}
          <button
            onClick={onToggle}
            className="p-2 text-bark-muted hover:text-bark hover:bg-cream-dark rounded-xl transition-colors"
            aria-label={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          >
            <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {renderNav()}
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-40 lg:hidden"
          onClick={() => onMobileClose()}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sand">
          <Link to="/" className="text-lg font-bold text-primary-strong" onClick={() => onMobileClose()}>
            Bourse ALPE
          </Link>
          <button
            onClick={() => onMobileClose()}
            className="p-2 text-bark-muted hover:text-bark rounded-xl"
            aria-label="Fermer le menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {renderNav(true)}
      </div>
    </>
  );
}
