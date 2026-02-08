import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { AuthProvider } from '@/contexts';
import { LoginPage, ActivatePage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth';
import { InvitationsPageWrapper, EditionsPageWrapper, EditionDetailPage, EditionDepositorsPage, LabelsManagementPage, LiveStatsPage, PayoutsManagementPage } from '@/pages/admin';
import { MyEditionsPage, MyListsPage, ListDetailPage } from '@/pages/depositor';
import { SalesPage } from '@/pages/volunteer/SalesPage';

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
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <EditionsPageWrapper />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/editions/:id',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <EditionDetailPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/editions/:id/depositors',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <EditionDepositorsPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/editions/:id/labels',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <LabelsManagementPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/editions/:id/sales',
        element: (
          <ProtectedRoute allowedRoles={['volunteer', 'manager', 'administrator']}>
            <MainLayout>
              <SalesPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/editions/:id/stats',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <LiveStatsPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/editions/:id/payouts',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <PayoutsManagementPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      // Depositor routes - article declaration
      {
        path: '/lists',
        element: (
          <ProtectedRoute>
            <MainLayout>
              <MyEditionsPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/depositor/editions/:editionId/lists',
        element: (
          <ProtectedRoute>
            <MainLayout>
              <MyListsPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/depositor/lists/:listId',
        element: (
          <ProtectedRoute>
            <MainLayout>
              <ListDetailPage />
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
        path: '/admin/invitations',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <InvitationsPageWrapper />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/editions',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <EditionsPageWrapper />
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
