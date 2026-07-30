import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositorListsApi } from '@/api';
import { Button, ConfirmModal, TrainingBanner } from '@/components/ui';
import { Card, StatCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ItemListSummary, ListType } from '@/types';

const LIST_TYPE_LABELS: Record<ListType, string> = {
  standard: 'Standard',
  list_1000: 'Liste 1000',
  list_2000: 'Liste 2000',
};

type SimplifiedStatus = 'in_progress' | 'ready' | 'done';

function getSimplifiedStatus(status: string): { simplified: SimplifiedStatus; label: string; variant: 'warning' | 'success' | 'muted' } {
  switch (status) {
    case 'draft':
    case 'not_finalized':
      return { simplified: 'in_progress', label: 'En cours', variant: 'warning' };
    case 'validated':
    case 'checked_in':
    case 'reviewed':
      return { simplified: 'ready', label: 'Prête', variant: 'success' };
    default:
      return { simplified: 'done', label: 'Terminée', variant: 'muted' };
  }
}

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

export function MyListsPage() {
  const { editionId } = useParams<{ editionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listToDelete, setListToDelete] = useState<ItemListSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: editionsResponse } = useQuery({
    queryKey: ['my-editions'],
    queryFn: () => depositorListsApi.getMyEditions(),
  });

  const edition = editionsResponse?.editions.find((e) => e.id === editionId);

  const {
    data: listsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['depositor-lists', editionId],
    queryFn: () => depositorListsApi.getMyLists(editionId!),
    enabled: !!editionId,
  });

  const createMutation = useMutation({
    mutationFn: () => depositorListsApi.createList(editionId!, { listType: edition?.listType || 'standard' }),
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['depositor-lists', editionId] });
      setIsCreating(false);
      navigate(`/depositor/lists/${newList.id}`);
    },
    onError: () => {
      setIsCreating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (listId: string) => depositorListsApi.deleteList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depositor-lists', editionId] });
      setListToDelete(null);
    },
    onError: () => {
      setListToDelete(null);
    },
  });

  const handleCreateList = () => {
    setIsCreating(true);
    createMutation.mutate();
  };

  const handleViewList = (list: ItemListSummary) => {
    navigate(`/depositor/lists/${list.id}`);
  };

  if (!editionId) {
    return (
      <div className="p-6">
        <Card variant="default" padding="md">
          <p className="text-error-dark">Aucune édition sélectionnée.</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card variant="default" padding="md">
          <p className="text-error-dark">Erreur lors du chargement de vos listes. Veuillez réessayer.</p>
        </Card>
      </div>
    );
  }

  const lists = listsResponse?.lists ?? [];
  const maxLists = listsResponse?.maxLists ?? 2;
  const canCreateMore = listsResponse?.canCreateMore ?? false;
  const totalArticles = lists.reduce((sum, l) => sum + l.articleCount, 0);
  const totalClothing = lists.reduce((sum, l) => sum + l.clothingCount, 0);
  const totalValue = lists.reduce((sum, l) => sum + l.totalValue, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bark">Mes listes d'articles</h1>
          <p className="mt-1 text-bark-muted">
            Gérez vos listes d'articles à déposer pour cette édition.
          </p>
        </div>
        <Button
          onClick={handleCreateList}
          disabled={!canCreateMore || isCreating || createMutation.isPending}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          {createMutation.isPending ? 'Création...' : 'Nouvelle liste'}
        </Button>
      </div>

      <TrainingBanner editionId={editionId!} />

      {/* Deadline banner */}
      {edition?.declarationDeadline && <DeadlineBanner deadline={edition.declarationDeadline} />}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Listes créées"
          value={`${lists.length} / ${maxLists}`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="Articles"
          value={totalArticles}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
        />
        <StatCard
          label="Vêtements"
          value={totalClothing}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l4 4m0 0l4-4m-4 4v14m8-10h4m-4 4h4m-4 4h4" /></svg>}
        />
        <StatCard
          label="Valeur totale"
          value={formatPrice(totalValue)}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Info messages */}
      {!canCreateMore && lists.length >= maxLists && (
        <div className="mb-4 bg-info-soft border border-primary/40 text-primary-strong px-4 py-3 rounded-xl text-sm">
          Vous avez atteint le nombre maximum de listes ({maxLists}).
        </div>
      )}

      {createMutation.isError && (
        <div className="mb-4 bg-error-soft border border-error/40 text-error-dark px-4 py-3 rounded-xl text-sm">
          Erreur lors de la création de la liste. Veuillez réessayer.
        </div>
      )}

      {deleteMutation.isError && (
        <div className="mb-4 bg-error-soft border border-error/40 text-error-dark px-4 py-3 rounded-xl text-sm">
          Erreur lors de la suppression de la liste. Veuillez réessayer.
        </div>
      )}

      {/* Lists */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-3 text-bark-muted">Chargement...</p>
        </div>
      ) : lists.length === 0 ? (
        <Card variant="default" padding="lg" className="text-center">
          <div className="text-bark-muted mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-bark-muted mb-4">Vous n'avez pas encore créé de liste.</p>
          <Button onClick={handleCreateList} disabled={!canCreateMore || createMutation.isPending}>
            Créer ma première liste
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => {
            const statusInfo = getSimplifiedStatus(list.status);
            const canDelete = list.status === 'draft' && list.articleCount === 0;
            const maxArticles = 24;
            const progressPercent = Math.min((list.articleCount / maxArticles) * 100, 100);

            return (
              <Card
                key={list.id}
                hover
                padding="none"
                className="overflow-hidden"
                onClick={() => handleViewList(list)}
                role="link"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleViewList(list);
                  }
                }}
              >
                {/* Progress bar at top */}
                <div className="h-1 bg-sand">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-r-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-bark">
                          Liste n°{list.number}
                        </h3>
                        <StatusBadge variant={statusInfo.variant} dot>
                          {statusInfo.label}
                        </StatusBadge>
                        <span className="text-xs text-bark-muted">
                          {LIST_TYPE_LABELS[list.listType]}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-bark-muted">
                        <span>{list.articleCount}/{maxArticles} articles</span>
                        <span>{list.clothingCount}/12 vêtements</span>
                        <span className="font-medium text-bark">
                          {formatPrice(list.totalValue)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => handleViewList(list)}>
                        {list.status === 'draft' ? 'Modifier' : 'Voir'}
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setListToDelete(list)}
                          disabled={deleteMutation.isPending}
                          className="text-error-dark hover:bg-error-soft"
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help section */}
      <Card variant="default" padding="md" className="mt-6">
        <h4 className="font-medium text-bark mb-2">Comment ça marche ?</h4>
        <ol className="text-sm text-bark-light space-y-1.5 list-decimal list-inside">
          <li>Créez une liste et ajoutez vos articles (max 24 articles, dont 12 vêtements)</li>
          <li>Validez votre liste une fois tous les articles saisis</li>
          <li>Déposez vos articles lors des créneaux de dépôt</li>
          <li>Les bénévoles s'occupent de la vente de vos articles</li>
          <li>Récupérez vos invendus puis recevez le paiement de vos ventes</li>
        </ol>
        <p className="mt-3 text-xs text-bark-muted">
          {/* inline-block + padding lifts the tap target to the 24px WCAG 2.5.8 floor;
              at 16px it was hard to hit on a phone, which is how this page is read. */}
          <Link
            to="/aide#cycle-de-vie"
            className="inline-block py-1 underline font-medium hover:text-bark transition-colors"
          >
            Voir le détail du cycle de vie
          </Link>
        </p>
      </Card>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!listToDelete}
        onClose={() => setListToDelete(null)}
        onConfirm={() => listToDelete && deleteMutation.mutate(listToDelete.id)}
        title="Confirmer la suppression"
        variant="danger"
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
      >
        <p className="text-bark-light">
          Êtes-vous sûr de vouloir supprimer la{' '}
          <span className="font-medium text-bark">Liste n°{listToDelete?.number}</span> ?
        </p>
        <p className="text-sm text-error-dark bg-error-soft p-3 rounded-xl mt-3">
          Cette action est irréversible.
        </p>
      </ConfirmModal>
    </div>
  );
}

function DeadlineBanner({ deadline }: { deadline: string }) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <div className="mb-4 bg-error-soft border border-error/40 text-error-dark px-4 py-3 rounded-xl text-sm font-medium">
        La date limite de déclaration est dépassée ({formatDate(deadline)}).
        Vos listes sont consultables en lecture seule.
      </div>
    );
  }

  if (diffDays <= 3) {
    return (
      <div className="mb-4 bg-warning-soft border border-secondary/40 text-warning-strong px-4 py-3 rounded-xl text-sm font-medium">
        Il vous reste {diffDays} jour{diffDays > 1 ? 's' : ''} pour finaliser vos articles
        (date limite : {formatDate(deadline)}).
      </div>
    );
  }

  return null;
}
