import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '@/api/review';
import { Button } from '@/components/ui';
import { TrainingBanner } from '@/components/ui/TrainingBanner';
import type { ReviewListItem } from '@/types';

const REVIEW_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'A traiter', className: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'En cours', className: 'bg-amber-100 text-amber-800' },
  reviewed: { label: 'Terminee', className: 'bg-green-100 text-green-800' },
};

function getListReviewStatus(item: ReviewListItem): string {
  if (item.reviewedAt) return 'reviewed';
  const { pending, accepted, rejected } = item.reviewStats;
  if (accepted > 0 || rejected > 0) {
    return pending > 0 ? 'in_progress' : 'reviewed';
  }
  return 'pending';
}

export function ReviewListsPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: lists, isLoading } = useQuery({
    queryKey: ['review-lists', editionId, statusFilter],
    queryFn: () => reviewApi.getReviewLists(editionId!, statusFilter || undefined),
    enabled: !!editionId,
  });

  const { data: summary } = useQuery({
    queryKey: ['review-summary', editionId],
    queryFn: () => reviewApi.getReviewSummary(editionId!),
    enabled: !!editionId,
    refetchInterval: 15000,
  });

  const items = lists ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to={`/editions/${editionId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
          >
            &larr; Retour a l'edition
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Revue des listes au depot</h1>
        </div>
      </div>

      <TrainingBanner editionId={editionId!} />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Listes traitees</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.reviewedLists}/{summary.totalLists}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Articles acceptes</p>
            <p className="text-2xl font-bold text-green-600">{summary.acceptedArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Articles refuses</p>
            <p className="text-2xl font-bold text-red-600">{summary.rejectedArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{summary.pendingArticles}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {summary && summary.totalArticles > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progression de la revue</span>
            <span>
              {summary.acceptedArticles + summary.rejectedArticles}/{summary.totalArticles} articles traites
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
            <div
              className="bg-green-500 h-3"
              style={{
                width: `${(summary.acceptedArticles / summary.totalArticles) * 100}%`,
              }}
            />
            <div
              className="bg-red-500 h-3"
              style={{
                width: `${(summary.rejectedArticles / summary.totalArticles) * 100}%`,
              }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> Acceptes
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-full inline-block" /> Refuses
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-200 rounded-full inline-block" /> En attente
            </span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filtrer :</label>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Toutes les listes</option>
          <option value="pending">A traiter</option>
          <option value="in_progress">En cours</option>
          <option value="reviewed">Terminees</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune liste trouvee.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N&deg;</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deposant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Articles</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acceptes</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Refuses</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">En attente</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const reviewStatus = getListReviewStatus(item);
                  const statusInfo = REVIEW_STATUS_LABELS[reviewStatus] ?? REVIEW_STATUS_LABELS.pending;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.number}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.depositorName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.listType === 'standard' ? 'Standard' : `Liste ${item.listType}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">{item.articleCount}</td>
                      <td className="px-4 py-3 text-sm text-center text-green-700 font-medium">
                        {item.reviewStats.accepted}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-red-700 font-medium">
                        {item.reviewStats.rejected}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-amber-700 font-medium">
                        {item.reviewStats.pending}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Link to={`/editions/${editionId}/review/${item.id}`}>
                          <Button variant="outline" size="sm">
                            {reviewStatus === 'reviewed' ? 'Voir' : 'Revoir'}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
