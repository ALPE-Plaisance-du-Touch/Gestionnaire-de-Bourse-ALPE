import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { AuthProvider } from '@/contexts';
import { LoginPage, ActivatePage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth';

/**
 * Root layout that provides auth context to all routes.
 */
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

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

function EditionsPage() {
  return (
    <MainLayout>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Éditions</h1>
        <p className="text-gray-600">Liste des éditions à implémenter.</p>
      </div>
    </MainLayout>
  );
}

function ListsPage() {
  return (
    <MainLayout>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mes listes</h1>
        <p className="text-gray-600">Mes listes d'articles à implémenter.</p>
      </div>
    </MainLayout>
  );
}

function AdminPage() {
  return (
    <MainLayout>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Administration</h1>
        <p className="text-gray-600">Page d'administration à implémenter.</p>
      </div>
    </MainLayout>
  );
}

/**
 * Application router configuration.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/activate',
        element: <ActivatePage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },

      // Protected routes - any authenticated user
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/editions',
        element: (
          <ProtectedRoute>
            <EditionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/editions/:id',
        element: (
          <ProtectedRoute>
            <MainLayout>
              <div>Détail édition (à implémenter)</div>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/lists',
        element: (
          <ProtectedRoute>
            <ListsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/lists/:id',
        element: (
          <ProtectedRoute>
            <MainLayout>
              <div>Détail liste (à implémenter)</div>
            </MainLayout>
          </ProtectedRoute>
        ),
      },

      // Admin routes - manager or administrator only
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/*',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <div>Section admin (à implémenter)</div>
            </MainLayout>
          </ProtectedRoute>
        ),
      },

      // Error routes
      {
        path: '/404',
        element: <NotFoundPage />,
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);
