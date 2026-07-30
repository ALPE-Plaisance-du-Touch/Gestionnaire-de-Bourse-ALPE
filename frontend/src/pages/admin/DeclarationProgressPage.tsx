import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { editionListsApi } from '@/api/edition-lists';
import { editionsApi } from '@/api';
import { ConfirmModal, TrainingBanner } from '@/components/ui';
import type { DeclarationListItem, DepositorDeclarationInfo, DepositorDeclarationStatus } from '@/api/edition-lists';

const LIST_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard',
  list_1000: 'Liste 1000',
  list_2000: 'Liste 2000',
};

// One style per step of the deposit progression: validated, checked_in and reviewed
// used to share a single one, so three consecutive states looked identical.
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-cream-dark text-bark' },
  not_finalized: { label: 'Non finalisée', className: 'bg-error-soft text-error-dark' },
  validated: { label: 'Validée', className: 'bg-warning-soft text-warning-strong' },
  checked_in: { label: 'Déposée', className: 'bg-info-soft text-primary-strong' },
  reviewed: { label: 'Vérifiée', className: 'bg-success-soft text-success-strong' },
};

const DECLARATION_STATUS_LABELS: Record<DepositorDeclarationStatus, { label: string; className: string }> = {
  none: { label: 'Sans liste', className: 'bg-cream-dark text-bark' },
  started: { label: 'En cours', className: 'bg-warning-soft text-warning-strong' },
  partial: { label: 'Partiel', className: 'bg-warning-deep text-warning-strong' },
  complete: { label: 'Complet', className: 'bg-success-soft text-success-strong' },
};

const MAX_LISTS: Record<string, number> = {
  standard: 2,
  list_1000: 2,
  list_2000: 4,
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type ViewMode = 'lists' | 'depositors';

export function DeclarationProgressPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('depositors');

  const { data: edition } = useQuery({
    queryKey: ['edition', editionId],
    queryFn: () => editionsApi.getEdition(editionId!),
    enabled: !!editionId,
  });

  const { data: summary } = useQuery({
    queryKey: ['declarations-summary', editionId],
    queryFn: () => editionListsApi.getSummary(editionId!),
    enabled: !!editionId,
    refetchInterval: 30000,
  });

  const hasDeadline = !!edition?.declarationDeadline;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/editions/${editionId}`}
          className="text-sm text-primary-strong hover:text-primary-strong mb-1 inline-block"
        >
          &larr; Retour à l'édition
        </Link>
        <h1 className="text-2xl font-bold text-bark">Suivi des déclarations</h1>
      </div>

      <TrainingBanner editionId={editionId!} />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-bark-muted">Déposants avec listes</p>
            <p className="text-2xl font-bold text-bark">
              {summary.depositorsWithLists}/{summary.totalDepositors}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-bark-muted">Listes créées</p>
            <p className="text-2xl font-bold text-primary">{summary.totalLists}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-bark-muted">Listes validées</p>
            <p className="text-2xl font-bold text-primary">{summary.validatedLists}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-bark-muted">Articles déclarés</p>
            <p className="text-2xl font-bold text-warning-strong">{summary.totalArticles}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {summary && summary.totalLists > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between text-sm text-bark-light mb-2">
            <span>Progression des validations</span>
            <span>
              {summary.validatedLists}/{summary.totalLists} listes validées —{' '}
              {formatPrice(summary.totalValue)}
            </span>
          </div>
          <div className="w-full bg-sand rounded-full h-3 flex overflow-hidden">
            <div
              className="bg-primary h-3"
              style={{
                width: `${(summary.validatedLists / summary.totalLists) * 100}%`,
              }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-bark-muted">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-primary rounded-full inline-block" /> Validées
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-sand rounded-full inline-block" /> Brouillons
            </span>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setViewMode('depositors')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'depositors'
              ? 'bg-primary-strong text-white'
              : 'bg-cream-dark text-bark-light hover:bg-sand'
          }`}
        >
          Par déposant
        </button>
        <button
          onClick={() => setViewMode('lists')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'lists'
              ? 'bg-primary-strong text-white'
              : 'bg-cream-dark text-bark-light hover:bg-sand'
          }`}
        >
          Par liste
        </button>
      </div>

      {viewMode === 'lists' ? (
        <ListsView editionId={editionId!} />
      ) : (
        <DepositorsView editionId={editionId!} hasDeadline={hasDeadline} />
      )}
    </div>
  );
}

function ListsView({ editionId }: { editionId: string }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: listsResponse, isLoading } = useQuery({
    queryKey: ['declarations-lists', editionId, statusFilter, typeFilter, page],
    queryFn: () =>
      editionListsApi.getLists(editionId, {
        status: statusFilter || undefined,
        listType: typeFilter || undefined,
        page,
        limit: 50,
      }),
    enabled: !!editionId,
  });

  const items = listsResponse?.items ?? [];
  const totalPages = listsResponse?.pages ?? 1;

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-medium text-bark-light">Filtrer :</label>
        <select
          className="rounded-lg border border-sand px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillons</option>
          <option value="not_finalized">Non finalisées</option>
          <option value="validated">Validées</option>
        </select>
        <select
          className="rounded-lg border border-sand px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les types</option>
          <option value="standard">Standard</option>
          <option value="list_1000">Liste 1000</option>
          <option value="list_2000">Liste 2000</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center text-bark-muted">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-bark-muted">Aucune liste trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">N°</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Déposant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Articles</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase">Valeur</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Créée le</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item: DeclarationListItem) => {
                  const statusInfo = STATUS_LABELS[item.status] ?? {
                    label: item.status,
                    className: 'bg-cream-dark text-bark',
                  };
                  const depositorName = item.depositor
                    ? `${item.depositor.firstName} ${item.depositor.lastName}`
                    : '—';

                  return (
                    <tr key={item.id} className="hover:bg-cream">
                      <td className="px-4 py-3 text-sm font-medium text-bark">{item.number}</td>
                      <td className="px-4 py-3 text-sm text-bark-light">{depositorName}</td>
                      <td className="px-4 py-3 text-sm text-bark-muted">
                        {LIST_TYPE_LABELS[item.listType] ?? item.listType}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-bark-light">{item.articleCount}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-bark">
                        {formatPrice(item.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-bark-muted">
                        {formatDate(item.createdAt)}
                        {item.validatedAt && (
                          <div className="text-xs text-primary-strong">
                            Validée le {formatDate(item.validatedAt)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-3 bg-cream border-t border-sand flex items-center justify-between">
            <p className="text-sm text-bark-muted">
              {listsResponse?.total ?? items.length} liste{(listsResponse?.total ?? items.length) > 1 ? 's' : ''} — Total :{' '}
              <span className="font-medium text-bark">
                {formatPrice(items.reduce((sum, a) => sum + a.totalValue, 0))}
              </span>
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="text-sm text-bark-light">Page {page}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function DepositorsView({ editionId, hasDeadline }: { editionId: string; hasDeadline: boolean }) {
  const [statusFilter, setStatusFilter] = useState<DepositorDeclarationStatus | ''>('');
  const [page, setPage] = useState(1);
  const [reminderTarget, setReminderTarget] = useState<DepositorDeclarationInfo | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: depositorsResponse, isLoading } = useQuery({
    queryKey: ['declarations-depositors', editionId, statusFilter, page],
    queryFn: () =>
      editionListsApi.getDepositors(editionId, {
        status: statusFilter || undefined,
        page,
        limit: 50,
      }),
    enabled: !!editionId,
  });

  const reminderMutation = useMutation({
    mutationFn: (depositorIds?: string[]) => editionListsApi.sendReminders(editionId, depositorIds),
    onSuccess: (data) => {
      setReminderTarget(null);
      setShowBulkConfirm(false);
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    },
    onError: () => {
      setReminderTarget(null);
      setShowBulkConfirm(false);
    },
  });

  const items = depositorsResponse?.items ?? [];
  const totalPages = depositorsResponse?.pages ?? 1;
  const incompleteCount = depositorsResponse
    ? depositorsResponse.countNone + depositorsResponse.countStarted + depositorsResponse.countPartial
    : 0;

  return (
    <>
      {/* Depositor status summary */}
      {depositorsResponse && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xs text-bark-muted">Sans liste</p>
            <p className="text-xl font-bold text-bark-light">{depositorsResponse.countNone}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xs text-bark-muted">En cours</p>
            <p className="text-xl font-bold text-warning-strong">{depositorsResponse.countStarted}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xs text-bark-muted">Partiels</p>
            <p className="text-xl font-bold text-warning-strong">{depositorsResponse.countPartial}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xs text-bark-muted">Complets</p>
            <p className="text-xl font-bold text-primary">{depositorsResponse.countComplete}</p>
          </div>
        </div>
      )}

      {/* Filters + bulk action */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-bark-light">Filtrer :</label>
          <select
            className="rounded-lg border border-sand px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as DepositorDeclarationStatus | '');
              setPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="none">Sans liste</option>
            <option value="started">En cours</option>
            <option value="partial">Partiels</option>
            <option value="complete">Complets</option>
          </select>
        </div>

        {hasDeadline && incompleteCount > 0 && (
          <button
            onClick={() => setShowBulkConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Relancer tous les incomplets ({incompleteCount})
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 text-sm text-primary-strong bg-info-soft border border-primary/40 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {reminderMutation.isError && (
        <div className="mb-4 text-sm text-error-dark bg-error-soft border border-error/40 px-4 py-3 rounded-lg">
          Erreur lors de l'envoi des rappels.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center text-bark-muted">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-bark-muted">Aucun déposant trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Listes</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Validées</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Articles</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase">Valeur</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((dep: DepositorDeclarationInfo) => {
                  const statusInfo = DECLARATION_STATUS_LABELS[dep.declarationStatus];
                  const maxLists = MAX_LISTS[dep.listType] ?? 2;

                  return (
                    <tr key={dep.id} className="hover:bg-cream">
                      <td className="px-4 py-3 text-sm font-medium text-bark">
                        {dep.firstName} {dep.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-bark-muted">{dep.email}</td>
                      <td className="px-4 py-3 text-sm text-bark-muted">
                        {LIST_TYPE_LABELS[dep.listType] ?? dep.listType}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-bark-light">
                        {dep.listsCount}/{maxLists}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-bark-light">
                        {dep.validatedCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-bark-light">
                        {dep.totalArticles}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-bark">
                        {formatPrice(dep.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {hasDeadline && dep.declarationStatus !== 'complete' && (
                          <button
                            onClick={() => setReminderTarget(dep)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-warning-strong bg-warning-deep rounded hover:bg-warning-deep transition-colors"
                            title={`Relancer ${dep.firstName} ${dep.lastName}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Relancer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 bg-cream border-t border-sand flex items-center justify-between">
            <p className="text-sm text-bark-muted">
              {depositorsResponse?.total ?? items.length} déposant{(depositorsResponse?.total ?? items.length) > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-sm text-bark-light">Page {page}/{totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Individual reminder modal */}
      <ConfirmModal
        isOpen={!!reminderTarget}
        onClose={() => setReminderTarget(null)}
        onConfirm={() => reminderTarget && reminderMutation.mutate([reminderTarget.id])}
        title="Relancer un déposant"
        confirmLabel="Envoyer"
        isLoading={reminderMutation.isPending}
      >
        {reminderTarget && (
          <p className="text-bark-light">
            Envoyer un rappel de déclaration à{' '}
            <span className="font-medium">{reminderTarget.firstName} {reminderTarget.lastName}</span>{' '}
            ({reminderTarget.email}) ?
          </p>
        )}
      </ConfirmModal>

      {/* Bulk reminder modal */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={() => reminderMutation.mutate()}
        title="Relancer les déposants"
        confirmLabel="Envoyer"
        isLoading={reminderMutation.isPending}
      >
        <p className="text-bark-light">
          Envoyer un rappel de déclaration à <span className="font-medium">{incompleteCount} déposant{incompleteCount > 1 ? 's' : ''}</span> qui
          n'ont pas encore finalisé toutes leurs listes ?
        </p>
      </ConfirmModal>
    </>
  );
}
