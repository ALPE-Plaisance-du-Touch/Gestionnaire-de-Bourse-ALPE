import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';

// Lazy load pages
// import { lazy } from 'react';
// const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
// const EditionListPage = lazy(() => import('@/features/editions/EditionListPage'));

/**
 * Placeholder pages (to be replaced with actual components).
 */
function HomePage() {
  return (
    <MainLayout>
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Bienvenue sur la Bourse ALPE
        </h1>
        <p className="text-lg text-gray-600">
          Gérez vos ventes de vêtements et jouets d'occasion.
        </p>
      </div>
    </MainLayout>
  );
}

function LoginPage() {
  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Connexion</h1>
        <p className="text-gray-600">Page de connexion à implémenter.</p>
      </div>
    </MainLayout>
  );
}

function NotFoundPage() {
  return (
    <MainLayout>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">Page non trouvée.</p>
        <a href="/" className="text-blue-600 hover:text-blue-700">
          Retour à l'accueil
        </a>
      </div>
    </MainLayout>
  );
}

/**
 * Application router configuration.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/activate',
    element: <div>Activation page</div>,
  },
  {
    path: '/editions',
    element: <div>Editions list</div>,
  },
  {
    path: '/editions/:id',
    element: <div>Edition detail</div>,
  },
  {
    path: '/lists',
    element: <div>My lists</div>,
  },
  {
    path: '/lists/:id',
    element: <div>List detail</div>,
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
