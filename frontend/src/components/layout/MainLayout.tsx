import { useState, createContext, useContext, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useIsAuthenticated, useUser } from '@/contexts';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface SidebarContextType {
  openMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ openMobileSidebar: () => {} });

export function useSidebarContext() {
  return useContext(SidebarContext);
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const isManagerOrAdmin = isAuthenticated && user && (user.role === 'administrator' || user.role === 'manager');

  const mobileSidebarTrigger = (
    <button
      onClick={() => setIsMobileSidebarOpen(true)}
      className="lg:hidden p-2 text-bark-muted hover:text-bark hover:bg-cream-dark rounded-xl transition-colors"
      aria-label="Ouvrir le menu"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );

  return (
    <SidebarContext.Provider value={{ openMobileSidebar: () => setIsMobileSidebarOpen(true) }}>
      <div className="min-h-screen flex flex-col bg-cream">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:font-medium focus:rounded-xl focus:shadow-lg focus:ring-2 focus:ring-primary"
        >
          Aller au contenu principal
        </a>

        {isManagerOrAdmin ? (
          <div className="flex flex-1 min-h-screen">
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              isMobileOpen={isMobileSidebarOpen}
              onMobileClose={() => setIsMobileSidebarOpen(false)}
            />
            <div className="flex flex-col flex-1 min-w-0">
              <Header sidebarTrigger={mobileSidebarTrigger} />
              <main id="main-content" className="flex-1">
                <div className="px-4 lg:px-8 py-6 lg:py-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
        ) : (
          <>
            <Header />
            <main id="main-content" className="flex-1">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {children}
              </div>
            </main>
            <footer className="border-t border-sand bg-white/50">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-sm text-bark-muted">
                  <span>
                    &copy; {new Date().getFullYear()} ALPE Plaisance du Touch
                  </span>
                  <Link to="/aide" className="hover:text-bark underline py-2 transition-colors">
                    Aide
                  </Link>
                  <Link to="/privacy" className="hover:text-bark underline py-2 transition-colors">
                    Confidentialité
                  </Link>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
    </SidebarContext.Provider>
  );
}
