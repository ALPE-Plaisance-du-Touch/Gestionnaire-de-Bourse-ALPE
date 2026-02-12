import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { editionsApi } from '@/api';
import { useAuth } from '@/contexts';
import { MainLayout } from '@/components/layout';
import type { Edition } from '@/types';
import type { UserRole } from '@/types/user';

const STATUS_LABELS: Record<string, string> = {
  configured: 'Configurée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function EditionCard({ edition, showStatus = true }: { edition: Edition; showStatus?: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{edition.name}</h3>
        {showStatus && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {STATUS_LABELS[edition.status] || edition.status}
          </span>
        )}
      </div>
      {edition.location && (
        <p className="text-gray-600 mb-3">{edition.location}</p>
      )}
      <div className="space-y-2 text-sm text-gray-700">
        {edition.startDatetime && edition.endDatetime && (
          <p>
            <span className="font-medium">Vente :</span>{' '}
            {formatDate(edition.startDatetime)} — {formatDateShort(edition.endDatetime)}
          </p>
        )}
        {edition.depositStartDatetime && edition.depositEndDatetime && (
          <p>
            <span className="font-medium">Dépôt :</span>{' '}
            {formatDate(edition.depositStartDatetime)} — {formatDateShort(edition.depositEndDatetime)}
          </p>
        )}
        {edition.declarationDeadline && (
          <p>
            <span className="font-medium">Date limite de déclaration :</span>{' '}
            {formatDateShort(edition.declarationDeadline)}
          </p>
        )}
      </div>
    </div>
  );
}

function RoleLinks({ role, editionId }: { role: UserRole; editionId: string }) {
  const links: { label: string; to: string; roles: UserRole[] }[] = [
    { label: 'Mes listes', to: `/depositor/editions/${editionId}/lists`, roles: ['depositor', 'volunteer', 'manager', 'administrator'] },
    { label: 'Caisse', to: `/editions/${editionId}/sales`, roles: ['volunteer', 'manager', 'administrator'] },
    { label: 'Invitations', to: '/admin/invitations', roles: ['manager', 'administrator'] },
    { label: 'Étiquettes', to: `/editions/${editionId}/labels`, roles: ['manager', 'administrator'] },
    { label: 'Reversements', to: `/editions/${editionId}/payouts`, roles: ['manager', 'administrator'] },
    { label: 'Gestion des ventes', to: `/editions/${editionId}/sales/manage`, roles: ['manager', 'administrator'] },
    { label: 'Statistiques', to: `/editions/${editionId}/stats`, roles: ['manager', 'administrator'] },
    { label: 'Gestion des éditions', to: '/editions', roles: ['administrator'] },
  ];

  const visibleLinks = links.filter((l) => l.roles.includes(role));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors text-gray-700 font-medium"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function VisitorHomePage({ edition }: { edition: Edition | null }) {
  return (
    <>
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Bourse aux vêtements ALPE
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          L'association ALPE Plaisance du Touch organise des bourses aux vêtements et articles de puériculture d'occasion.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Comment ça marche ?</h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Déposez vos articles lors des créneaux prévus</li>
          <li>Nos bénévoles assurent la vente au public</li>
          <li>Récupérez vos invendus et votre reversement</li>
        </ol>
        <p className="mt-3 text-sm text-blue-700">
          Une commission de 20% est prélevée au profit de l'association.
        </p>
      </div>

      {edition ? (
        <div className="max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Prochaine bourse</h2>
          <EditionCard edition={edition} />
        </div>
      ) : (
        <div className="text-center py-8 mb-8">
          <p className="text-gray-500 text-lg">
            Aucune bourse n'est programmée pour le moment.
          </p>
        </div>
      )}

      <div className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          Se connecter
        </Link>
      </div>
    </>
  );
}

function AuthenticatedHomePage({
  edition,
  firstName,
  role,
}: {
  edition: Edition | null;
  firstName: string;
  role: UserRole;
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Bonjour {firstName} !
        </h1>
      </div>

      {edition ? (
        <>
          <div className="mb-8">
            <EditionCard edition={edition} showStatus={role === 'manager' || role === 'administrator'} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accès rapide</h2>
            <RoleLinks role={role} editionId={edition.id} />
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            Aucune bourse n'est en cours actuellement.
          </p>
          {role === 'administrator' && (
            <Link
              to="/editions"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              Créer une nouvelle édition
            </Link>
          )}
        </div>
      )}
    </>
  );
}

export function HomePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data: edition,
    isLoading: editionLoading,
  } = useQuery({
    queryKey: ['active-edition'],
    queryFn: () => editionsApi.getActiveEdition(),
  });

  const isLoading = authLoading || editionLoading;

  return (
    <MainLayout>
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      ) : isAuthenticated && user ? (
        <AuthenticatedHomePage
          edition={edition ?? null}
          firstName={user.firstName}
          role={user.role}
        />
      ) : (
        <VisitorHomePage edition={edition ?? null} />
      )}
    </MainLayout>
  );
}
