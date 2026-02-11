import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { AuthProvider } from '@/contexts';
import { LoginPage, ActivatePage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth';
import { InvitationsPageWrapper, EditionsPageWrapper, EditionDetailPage, EditionDepositorsPage, LabelsManagementPage, LiveStatsPage, PayoutsManagementPage, PayoutDashboardPage, InvitationStatsPage, AuditLogPage, SalesManagementPage, AdminDashboardPage } from '@/pages/admin';
import { MyEditionsPage, MyListsPage, ListDetailPage } from '@/pages/depositor';
import { SalesPage } from '@/pages/volunteer/SalesPage';
import { ProfilePage, PrivacyPolicyPage } from '@/pages/account';
import { HelpPage } from '@/pages/help';
import { HomePage } from '@/pages/home';

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
      {
        path: '/privacy',
        element: (
          <MainLayout>
            <PrivacyPolicyPage />
          </MainLayout>
        ),
      },
      {
        path: '/aide',
        element: (
          <MainLayout>
            <HelpPage />
          </MainLayout>
        ),
      },

      // Homepage - public (auth-aware, shows different content)
      {
        path: '/',
        element: <HomePage />,
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
        path: '/editions/:id/sales/manage',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <SalesManagementPage />
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
        path: '/editions/:id/payouts/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <PayoutDashboardPage />
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

      // Account routes - any authenticated user
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },

      // Admin routes - manager or administrator only
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <AdminDashboardPage />
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/invitations/stats',
        element: (
          <ProtectedRoute allowedRoles={['manager', 'administrator']}>
            <MainLayout>
              <InvitationStatsPage />
            </MainLayout>
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
      {
        path: '/admin/audit-logs',
        element: (
          <ProtectedRoute allowedRoles={['administrator']}>
            <MainLayout>
              <AuditLogPage />
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
