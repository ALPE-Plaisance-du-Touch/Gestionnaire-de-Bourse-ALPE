import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { editionListsApi } from '@/api/edition-lists';
import { TrainingBanner } from '@/components/ui/TrainingBanner';
import type { DeclarationListItem } from '@/api/edition-lists';

const LIST_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard',
  list_1000: 'Liste 1000',
  list_2000: 'Liste 2000',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-yellow-100 text-yellow-800' },
  validated: { label: 'Validée', className: 'bg-green-100 text-green-800' },
  checked_in: { label: 'Déposée', className: 'bg-blue-100 text-blue-800' },
  reviewed: { label: 'Vérifiée', className: 'bg-teal-100 text-teal-800' },
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

export function DeclarationProgressPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: summary } = useQuery({
    queryKey: ['declarations-summary', editionId],
    queryFn: () => editionListsApi.getSummary(editionId!),
    enabled: !!editionId,
    refetchInterval: 30000,
  });

  const { data: listsResponse, isLoading } = useQuery({
    queryKey: ['declarations-lists', editionId, statusFilter, typeFilter, page],
    queryFn: () =>
      editionListsApi.getLists(editionId!, {
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/editions/${editionId}`}
          className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
        >
          &larr; Retour à l'édition
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Suivi des déclarations</h1>
      </div>

      <TrainingBanner editionId={editionId!} />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Déposants avec listes</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.depositorsWithLists}/{summary.totalDepositors}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Listes créées</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalLists}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Listes validées</p>
            <p className="text-2xl font-bold text-green-600">{summary.validatedLists}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Articles déclarés</p>
            <p className="text-2xl font-bold text-purple-600">{summary.totalArticles}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {summary && summary.totalLists > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progression des validations</span>
            <span>
              {summary.validatedLists}/{summary.totalLists} listes validées —{' '}
              {formatPrice(summary.totalValue)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
            <div
              className="bg-green-500 h-3"
              style={{
                width: `${(summary.validatedLists / summary.totalLists) * 100}%`,
              }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> Validées
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-200 rounded-full inline-block" /> Brouillons
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-medium text-gray-700">Filtrer :</label>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillons</option>
          <option value="validated">Validées</option>
        </select>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune liste trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    N°
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Déposant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Articles
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valeur
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Créée le
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item: DeclarationListItem) => {
                  const statusInfo = STATUS_LABELS[item.status] ?? {
                    label: item.status,
                    className: 'bg-gray-100 text-gray-800',
                  };
                  const depositorName = item.depositor
                    ? `${item.depositor.firstName} ${item.depositor.lastName}`
                    : '—';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{depositorName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {LIST_TYPE_LABELS[item.listType] ?? item.listType}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">
                        {item.articleCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatPrice(item.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                        {item.validatedAt && (
                          <div className="text-xs text-green-600">
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

        {/* Footer with total */}
        {items.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {listsResponse?.total ?? items.length} liste{(listsResponse?.total ?? items.length) > 1 ? 's' : ''} — Total :{' '}
              <span className="font-medium text-gray-900">
                {formatPrice(items.reduce((sum, a) => sum + a.totalValue, 0))}
              </span>
            </p>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-600">
                  Page {page}/{totalPages}
                </span>
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
    </div>
  );
}
