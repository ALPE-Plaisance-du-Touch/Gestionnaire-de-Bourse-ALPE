import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { depositorListsApi } from '@/api';
import type { MyEditionSummary } from '@/api/depositor-lists';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-cream-dark text-bark' },
  registrations_open: { label: 'Inscriptions ouvertes', className: 'bg-warning-deep text-warning-strong' },
  deposit: { label: 'Dépôt', className: 'bg-info-soft text-primary-strong' },
  sale: { label: 'Vente', className: 'bg-info-soft text-primary-strong' },
  settlement: { label: 'Bilan', className: 'bg-warning-soft text-warning-strong' },
  closed: { label: 'Clôturée', className: 'bg-warning-deep text-warning-strong' },
  archived: { label: 'Archivé', className: 'bg-cream-dark text-bark-muted' },
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
  const allowedStatuses = ['registrations_open', 'deposit', 'sale'];
  if (!allowedStatuses.includes(edition.status)) {
    return false;
  }
  if (edition.declarationDeadline) {
    return new Date(edition.declarationDeadline) > new Date();
  }
  return true;
}

function canAccessEdition(edition: MyEditionSummary): boolean {
  const allowedStatuses = ['registrations_open', 'deposit', 'sale', 'settlement', 'closed'];
  return allowedStatuses.includes(edition.status);
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

  // If only one accessible edition, redirect directly
  const accessibleEditions = editions.filter(canAccessEdition);
  if (accessibleEditions.length === 1 && !isLoading) {
    navigate(`/depositor/editions/${accessibleEditions[0].id}/lists`, { replace: true });
    return null;
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-error-soft border border-error/40 text-error-dark px-4 py-3 rounded-lg">
          Erreur lors du chargement de vos éditions. Veuillez réessayer.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-bark">Mes éditions</h1>
        <p className="mt-1 text-bark-light">
          Sélectionnez une édition pour gérer vos listes d'articles.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-bark-muted">Chargement...</p>
        </div>
      ) : editions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-bark-muted mb-4">
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
          <p className="text-bark-muted mb-2">Vous n'êtes inscrit à aucune édition.</p>
          <p className="text-sm text-bark-muted">
            Contactez l'organisation pour vous inscrire à une bourse aux vêtements.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {editions.map((edition) => {
            const statusInfo = STATUS_LABELS[edition.status] || {
              label: edition.status,
              className: 'bg-cream-dark text-bark',
            };
            const canDeclare = isDeclarationOpen(edition);
            const canAccess = canAccessEdition(edition);
            const deadlinePassed = edition.declarationDeadline && new Date(edition.declarationDeadline) < new Date();

            return (
              <div
                key={edition.id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  canAccess ? 'hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg' : 'opacity-75'
                }`}
                onClick={() => canAccess && navigate(`/depositor/editions/${edition.id}/lists`)}
                role={canAccess ? 'link' : undefined}
                tabIndex={canAccess ? 0 : undefined}
                onKeyDown={canAccess ? (e) => {
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
                        <h3 className="text-lg font-semibold text-bark">
                          {edition.name}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-bark-muted">
                        Du {formatDate(edition.startDatetime)} au {formatDate(edition.endDatetime)}
                      </p>
                      <p className="mt-1 text-sm text-bark-light">
                        Type de liste : <span className="font-medium">{LIST_TYPE_LABELS[edition.listType] || edition.listType}</span>
                      </p>
                      {edition.declarationDeadline && (
                        <p className={`mt-2 text-sm ${deadlinePassed ? 'text-error-dark' : 'text-warning-strong'}`}>
                          {deadlinePassed ? (
                            <>Date limite de déclaration dépassée ({formatDate(edition.declarationDeadline)})</>
                          ) : (
                            <>Date limite de déclaration : {formatDate(edition.declarationDeadline)}</>
                          )}
                        </p>
                      )}
                    </div>
                    {canAccess && (
                      <div className="ml-4">
                        <svg
                          className="w-6 h-6 text-bark-muted"
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
                {canAccess && (
                  <div className={`px-5 py-3 border-t ${canDeclare ? 'bg-info-soft border-primary/40' : 'bg-cream border-sand'}`}>
                    <p className={`text-sm ${canDeclare ? 'text-primary-strong' : 'text-bark-light'}`}>
                      {canDeclare ? 'Cliquez pour gérer vos listes d\'articles' : 'Cliquez pour consulter vos listes (lecture seule)'}
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
