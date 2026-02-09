import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
            <span>
              &copy; {new Date().getFullYear()} ALPE Plaisance du Touch.
              Tous droits réservés.
            </span>
            <Link to="/privacy" className="hover:text-gray-700 underline">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
