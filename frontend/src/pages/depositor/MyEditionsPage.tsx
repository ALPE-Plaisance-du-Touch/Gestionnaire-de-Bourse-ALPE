import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { depositorListsApi } from '@/api';
import type { MyEditionSummary } from '@/api/depositor-lists';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
  configured: { label: 'Configuré', className: 'bg-blue-100 text-blue-800' },
  registrations_open: { label: 'Inscriptions ouvertes', className: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'En cours', className: 'bg-green-100 text-green-800' },
  closed: { label: 'Clôturé', className: 'bg-orange-100 text-orange-800' },
  archived: { label: 'Archivé', className: 'bg-gray-100 text-gray-500' },
};

const LIST_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard',
  list_1000: 'Liste 1000',
  list_2000: 'Liste 2000',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function isDeclarationOpen(edition: MyEditionSummary): boolean {
  const allowedStatuses = ['configured', 'registrations_open', 'in_progress'];
  if (!allowedStatuses.includes(edition.status)) {
    return false;
  }
  if (edition.declarationDeadline) {
    return new Date(edition.declarationDeadline) > new Date();
  }
  return true;
}

export function MyEditionsPage() {
  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['my-editions'],
    queryFn: () => depositorListsApi.getMyEditions(),
  });

  const editions = response?.editions ?? [];

  // If only one active edition, redirect directly
  const activeEditions = editions.filter(isDeclarationOpen);
  if (activeEditions.length === 1 && !isLoading) {
    navigate(`/depositor/editions/${activeEditions[0].id}/lists`, { replace: true });
    return null;
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors du chargement de vos éditions. Veuillez réessayer.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes éditions</h1>
        <p className="mt-1 text-gray-600">
          Sélectionnez une édition pour gérer vos listes d'articles.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement...</p>
        </div>
      ) : editions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">Vous n'êtes inscrit à aucune édition.</p>
          <p className="text-sm text-gray-400">
            Contactez l'organisation pour vous inscrire à une bourse aux vêtements.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {editions.map((edition) => {
            const statusInfo = STATUS_LABELS[edition.status] || {
              label: edition.status,
              className: 'bg-gray-100 text-gray-800',
            };
            const canDeclare = isDeclarationOpen(edition);
            const deadlinePassed = edition.declarationDeadline && new Date(edition.declarationDeadline) < new Date();

            return (
              <div
                key={edition.id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  canDeclare ? 'hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg' : 'opacity-75'
                }`}
                onClick={() => canDeclare && navigate(`/depositor/editions/${edition.id}/lists`)}
                role={canDeclare ? 'link' : undefined}
                tabIndex={canDeclare ? 0 : undefined}
                onKeyDown={canDeclare ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/depositor/editions/${edition.id}/lists`);
                  }
                } : undefined}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {edition.name}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Du {formatDate(edition.startDatetime)} au {formatDate(edition.endDatetime)}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Type de liste : <span className="font-medium">{LIST_TYPE_LABELS[edition.listType] || edition.listType}</span>
                      </p>
                      {edition.declarationDeadline && (
                        <p className={`mt-2 text-sm ${deadlinePassed ? 'text-red-600' : 'text-orange-600'}`}>
                          {deadlinePassed ? (
                            <>Date limite de déclaration dépassée ({formatDate(edition.declarationDeadline)})</>
                          ) : (
                            <>Date limite de déclaration : {formatDate(edition.declarationDeadline)}</>
                          )}
                        </p>
                      )}
                    </div>
                    {canDeclare && (
                      <div className="ml-4">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {canDeclare && (
                  <div className="bg-blue-50 px-5 py-3 border-t border-blue-100">
                    <p className="text-sm text-blue-700">
                      Cliquez pour gérer vos listes d'articles
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
