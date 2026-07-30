import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '@/api/review';
import { Button } from '@/components/ui';
import { TrainingBanner } from '@/components/ui/TrainingBanner';
import type { ReviewListItem } from '@/types';

const REVIEW_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'À traiter', className: 'bg-cream-dark text-bark' },
  in_progress: { label: 'En cours', className: 'bg-warning-soft text-warning-strong' },
  reviewed: { label: 'Terminée', className: 'bg-success-soft text-success-strong' },
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
            className="text-sm text-primary-strong hover:text-primary-strong mb-1 inline-block"
          >
            &larr; Retour à l'édition
          </Link>
          <h1 className="text-2xl font-bold text-bark">Revue des listes au dépôt</h1>
        </div>
      </div>

      <TrainingBanner editionId={editionId!} />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-bark-muted">Listes traitées</p>
            <p className="text-2xl font-bold text-bark">
              {summary.reviewedLists}/{summary.totalLists}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-bark-muted">Articles acceptés</p>
            <p className="text-2xl font-bold text-primary">{summary.acceptedArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-bark-muted">Articles refusés</p>
            <p className="text-2xl font-bold text-error-dark">{summary.rejectedArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-bark-muted">En attente</p>
            <p className="text-2xl font-bold text-warning-strong">{summary.pendingArticles}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {summary && summary.totalArticles > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between text-sm text-bark-light mb-2">
            <span>Progression de la revue</span>
            <span>
              {summary.acceptedArticles + summary.rejectedArticles}/{summary.totalArticles} articles traités
            </span>
          </div>
          <div className="w-full bg-sand rounded-full h-3 flex overflow-hidden">
            <div
              className="bg-success h-3"
              style={{
                width: `${(summary.acceptedArticles / summary.totalArticles) * 100}%`,
              }}
            />
            <div
              className="bg-error h-3"
              style={{
                width: `${(summary.rejectedArticles / summary.totalArticles) * 100}%`,
              }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-bark-muted">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-success rounded-full inline-block" /> Acceptés
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-error rounded-full inline-block" /> Refusés
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-sand rounded-full inline-block" /> En attente
            </span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-bark-light">Filtrer :</label>
        <select
          className="rounded-lg border border-sand px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Toutes les listes</option>
          <option value="pending">À traiter</option>
          <option value="in_progress">En cours</option>
          <option value="reviewed">Terminées</option>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">N&deg;</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Déposant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Articles</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Acceptés</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Refusés</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">En attente</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-bark-muted uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const reviewStatus = getListReviewStatus(item);
                  const statusInfo = REVIEW_STATUS_LABELS[reviewStatus] ?? REVIEW_STATUS_LABELS.pending;
                  return (
                    <tr key={item.id} className="hover:bg-cream">
                      <td className="px-4 py-3 text-sm font-medium text-bark">{item.number}</td>
                      <td className="px-4 py-3 text-sm text-bark-light">{item.depositorName}</td>
                      <td className="px-4 py-3 text-sm text-bark-muted">
                        {item.listType === 'standard' ? 'Standard' : `Liste ${item.listType}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-bark-light">{item.articleCount}</td>
                      <td className="px-4 py-3 text-sm text-center text-primary-strong font-medium">
                        {item.reviewStats.accepted}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-error-dark font-medium">
                        {item.reviewStats.rejected}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-warning-strong font-medium">
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
                            {reviewStatus === 'reviewed' ? 'Voir' : 'Vérifier'}
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
