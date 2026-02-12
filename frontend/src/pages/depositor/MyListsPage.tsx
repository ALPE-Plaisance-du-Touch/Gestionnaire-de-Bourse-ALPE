import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositorListsApi } from '@/api';
import { Button, ConfirmModal } from '@/components/ui';
import type { ItemListSummary, ListType } from '@/types';

const LIST_TYPE_LABELS: Record<ListType, string> = {
  standard: 'Standard',
  list_1000: 'Liste 1000',
  list_2000: 'Liste 2000',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-yellow-100 text-yellow-800' },
  validated: { label: 'Validée', className: 'bg-green-100 text-green-800' },
  checked_in: { label: 'Déposée', className: 'bg-blue-100 text-blue-800' },
  retrieved: { label: 'Récupérée', className: 'bg-gray-100 text-gray-800' },
  payout_pending: { label: 'Paiement en attente', className: 'bg-orange-100 text-orange-800' },
  payout_completed: { label: 'Paiement effectué', className: 'bg-green-100 text-green-800' },
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

export function MyListsPage() {
  const { editionId } = useParams<{ editionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listToDelete, setListToDelete] = useState<ItemListSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch edition info (for deadline and list type)
  const { data: editionsResponse } = useQuery({
    queryKey: ['my-editions'],
    queryFn: () => depositorListsApi.getMyEditions(),
  });

  const edition = editionsResponse?.editions.find((e) => e.id === editionId);

  // Fetch lists
  const {
    data: listsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['depositor-lists', editionId],
    queryFn: () => depositorListsApi.getMyLists(editionId!),
    enabled: !!editionId,
  });

  // Create list mutation
  const createMutation = useMutation({
    mutationFn: () => depositorListsApi.createList(editionId!, { listType: edition?.listType || 'standard' }),
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['depositor-lists', editionId] });
      setIsCreating(false);
      // Navigate to the new list
      navigate(`/depositor/lists/${newList.id}`);
    },
    onError: () => {
      setIsCreating(false);
    },
  });

  // Delete list mutation
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

  const handleDeleteClick = (list: ItemListSummary) => {
    setListToDelete(list);
  };

  const handleDeleteConfirm = () => {
    if (listToDelete) {
      deleteMutation.mutate(listToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setListToDelete(null);
  };

  const handleViewList = (list: ItemListSummary) => {
    navigate(`/depositor/lists/${list.id}`);
  };

  if (!editionId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Aucune édition sélectionnée.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors du chargement de vos listes. Veuillez réessayer.
        </div>
      </div>
    );
  }

  const lists = listsResponse?.lists ?? [];
  const maxLists = listsResponse?.maxLists ?? 2;
  const canCreateMore = listsResponse?.canCreateMore ?? false;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes listes d'articles</h1>
        <p className="mt-1 text-gray-600">
          Gérez vos listes d'articles à déposer pour cette édition.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Listes créées</p>
          <p className="text-2xl font-bold text-gray-900">
            {lists.length} / {maxLists}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Articles totaux</p>
          <p className="text-2xl font-bold text-blue-600">
            {lists.reduce((sum, l) => sum + l.articleCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Vêtements</p>
          <p className="text-2xl font-bold text-purple-600">
            {lists.reduce((sum, l) => sum + l.clothingCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Valeur totale</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPrice(lists.reduce((sum, l) => sum + l.totalValue, 0))}
          </p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={handleCreateList}
          disabled={!canCreateMore || isCreating || createMutation.isPending}
        >
          {createMutation.isPending ? 'Création...' : 'Nouvelle liste'}
        </Button>
      </div>

      {/* Deadline banner */}
      {edition?.declarationDeadline && <DeadlineBanner deadline={edition.declarationDeadline} />}

      {/* Info messages */}
      {!canCreateMore && lists.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          Vous avez atteint le nombre maximum de listes ({maxLists}).
        </div>
      )}

      {createMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors de la création de la liste. Veuillez réessayer.
        </div>
      )}

      {deleteMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors de la suppression de la liste. Veuillez réessayer.
        </div>
      )}

      {/* Lists */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="p-8 text-center">
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">Vous n'avez pas encore créé de liste.</p>
            <Button onClick={handleCreateList} disabled={createMutation.isPending}>
              Créer ma première liste
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {lists.map((list) => {
              const statusInfo = STATUS_LABELS[list.status] || {
                label: list.status,
                className: 'bg-gray-100 text-gray-800',
              };
              const canDelete = list.status === 'draft' && list.articleCount === 0;

              return (
                <div
                  key={list.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  onClick={() => handleViewList(list)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewList(list);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Liste n°{list.number}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {LIST_TYPE_LABELS[list.listType]}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span>{list.articleCount} article{list.articleCount > 1 ? 's' : ''}</span>
                        <span>{list.clothingCount} vêtement{list.clothingCount > 1 ? 's' : ''}</span>
                        <span className="font-medium text-gray-700">
                          {formatPrice(list.totalValue)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Créée le {formatDate(list.createdAt)}
                        {list.validatedAt && (
                          <span> - Validée le {formatDate(list.validatedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewList(list)}
                      >
                        {list.status === 'draft' ? 'Modifier' : 'Voir'}
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(list)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Comment ça marche ?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Créez une liste et ajoutez vos articles (max 24 articles, dont 12 vêtements)</li>
          <li>2. Validez votre liste une fois tous les articles saisis</li>
          <li>3. Imprimez vos étiquettes et fixez-les sur chaque article</li>
          <li>4. Déposez vos articles lors des créneaux de dépôt</li>
        </ul>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!listToDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        variant="danger"
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
      >
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer la{' '}
          <span className="font-medium">Liste n°{listToDelete?.number}</span> ?
        </p>
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
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
      <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
        La date limite de declaration est depassee ({formatDate(deadline)}).
        Vous ne pouvez plus modifier vos listes.
      </div>
    );
  }

  if (diffDays <= 3) {
    return (
      <div className="mb-4 bg-orange-50 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg">
        Il vous reste {diffDays} jour{diffDays > 1 ? 's' : ''} pour finaliser vos articles
        (date limite : {formatDate(deadline)}).
      </div>
    );
  }

  return null;
}
