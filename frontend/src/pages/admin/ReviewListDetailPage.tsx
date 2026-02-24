import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '@/api/review';
import { labelsApi } from '@/api/labels';
import { articlesApi } from '@/api/articles';
import { Button, Modal, ConfirmModal } from '@/components/ui';
import { TrainingBanner } from '@/components/ui/TrainingBanner';
import { ArticleForm } from '@/components/articles/ArticleForm';
import type { Article, CreateArticleRequest, UpdateArticleRequest } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  clothing: 'Vetements',
  shoes: 'Chaussures',
  nursery: 'Puericulture',
  toys: 'Jouets',
  books: 'Livres',
  accessories: 'Accessoires',
  other: 'Autres',
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  validated: { label: 'En attente', className: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Accepte', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Refuse', className: 'bg-red-100 text-red-800' },
};

export function ReviewListDetailPage() {
  const { id: editionId, listId } = useParams<{ id: string; listId: string }>();
  const queryClient = useQueryClient();

  const [rejectingArticle, setRejectingArticle] = useState<Article | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const queryKey = ['review-list-detail', editionId, listId];

  const { data: listDetail, isLoading } = useQuery({
    queryKey,
    queryFn: () => reviewApi.getReviewListDetail(editionId!, listId!),
    enabled: !!editionId && !!listId,
  });

  const { data: constraints } = useQuery({
    queryKey: ['category-constraints'],
    queryFn: () => articlesApi.getCategoryConstraints(),
  });

  const { data: priceHints } = useQuery({
    queryKey: ['price-hints'],
    queryFn: () => articlesApi.getPriceHints(),
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['review-lists', editionId] });
    queryClient.invalidateQueries({ queryKey: ['review-summary', editionId] });
  };

  const acceptMutation = useMutation({
    mutationFn: (articleId: string) => reviewApi.acceptArticle(editionId!, articleId),
    onSuccess: () => {
      invalidateQueries();
      setSuccessMessage('Article accepte.');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ articleId, reason }: { articleId: string; reason?: string }) =>
      reviewApi.rejectArticle(editionId!, articleId, reason),
    onSuccess: () => {
      invalidateQueries();
      setRejectingArticle(null);
      setRejectionReason('');
      setSuccessMessage('Article refuse.');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ articleId, data }: { articleId: string; data: UpdateArticleRequest }) =>
      reviewApi.editArticle(editionId!, articleId, data),
    onSuccess: () => {
      invalidateQueries();
      setEditingArticle(null);
      setSuccessMessage('Article modifie.');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => reviewApi.finalizeReview(editionId!, listId!),
    onSuccess: () => {
      invalidateQueries();
      setShowFinalizeConfirm(false);
      setSuccessMessage('Revue finalisee avec succes.');
    },
    onError: (error: Error) => {
      setShowFinalizeConfirm(false);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const labelsMutation = useMutation({
    mutationFn: () =>
      labelsApi.generateLabels(editionId!, {
        mode: 'individual',
        depositorIds: [listDetail!.depositorId],
      }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Etiquettes_liste_${listDetail?.number ?? ''}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('Etiquettes generees.');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const handleReject = () => {
    if (!rejectingArticle) return;
    rejectMutation.mutate({
      articleId: rejectingArticle.id,
      reason: rejectionReason.trim() || undefined,
    });
  };

  const handleEditSubmit = (data: CreateArticleRequest) => {
    if (!editingArticle) return;
    const updateData: UpdateArticleRequest = {
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      price: data.price,
      size: data.size,
      brand: data.brand,
      color: data.color,
      gender: data.gender,
      isLot: data.isLot,
      lotQuantity: data.lotQuantity,
    };
    editMutation.mutate({ articleId: editingArticle.id, data: updateData });
  };

  const articles = listDetail?.articles ?? [];
  const pendingCount = listDetail?.reviewStats.pending ?? 0;
  const acceptedCount = listDetail?.reviewStats.accepted ?? 0;
  const rejectedCount = listDetail?.reviewStats.rejected ?? 0;
  const isReviewed = !!listDetail?.reviewedAt;
  const canFinalize = pendingCount === 0 && articles.length > 0 && !isReviewed;

  const clothingCount = articles.filter(
    (a) => ['clothing', 'shoes', 'accessories'].includes(a.category) && a.status !== 'rejected'
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/editions/${editionId}/review`}
          className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
        >
          &larr; Retour aux listes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Revue de la liste n&deg;{listDetail?.number}
        </h1>
        {listDetail && (
          <p className="text-sm text-gray-500 mt-1">
            {listDetail.depositorName} &middot;{' '}
            {listDetail.listType === 'standard' ? 'Standard' : `Liste ${listDetail.listType}`}
          </p>
        )}
      </div>

      <TrainingBanner editionId={editionId!} />

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Stats bar */}
      {listDetail && (
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-semibold text-amber-800">{pendingCount}</span>{' '}
            <span className="text-amber-600">en attente</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-semibold text-green-800">{acceptedCount}</span>{' '}
            <span className="text-green-600">accepte(s)</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-semibold text-red-800">{rejectedCount}</span>{' '}
            <span className="text-red-600">refuse(s)</span>
          </div>
          {isReviewed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 font-medium">
              Revue finalisee
            </div>
          )}
        </div>
      )}

      {/* Articles list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun article dans cette liste.</div>
        ) : (
          articles.map((article) => {
            const statusInfo = STATUS_STYLES[article.status] ?? STATUS_STYLES.validated;
            const isPending = article.status === 'validated';
            return (
              <div
                key={article.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                  article.status === 'accepted'
                    ? 'border-l-green-500'
                    : article.status === 'rejected'
                    ? 'border-l-red-500'
                    : 'border-l-amber-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Article info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-500">
                        #{article.lineNumber}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {CATEGORY_LABELS[article.category] ?? article.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium mt-1">{article.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span className="font-semibold text-gray-700">{article.price.toFixed(2)} &euro;</span>
                      {article.size && <span>Taille : {article.size}</span>}
                      {article.brand && <span>Marque : {article.brand}</span>}
                      {article.isLot && <span>Lot de {article.lotQuantity}</span>}
                    </div>
                    {article.status === 'rejected' && article.rejectionReason && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1 inline-block">
                        Motif : {article.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isPending && !isReviewed && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        className="!bg-green-600 hover:!bg-green-700"
                        onClick={() => acceptMutation.mutate(article.id)}
                        disabled={acceptMutation.isPending}
                      >
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setRejectingArticle(article);
                          setRejectionReason('');
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingArticle(article)}
                      >
                        Editer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Finalize button */}
      {!isReviewed && articles.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Finaliser la revue</h3>
              {canFinalize ? (
                <p className="text-sm text-gray-500 mt-1">
                  {acceptedCount} article(s) accepte(s), {rejectedCount} refuse(s). Tous les articles ont ete traites.
                </p>
              ) : (
                <p className="text-sm text-amber-600 mt-1">
                  {pendingCount} article(s) encore en attente de traitement.
                </p>
              )}
            </div>
            <Button
              variant="primary"
              disabled={!canFinalize}
              onClick={() => setShowFinalizeConfirm(true)}
            >
              Finaliser la revue
            </Button>
          </div>
        </div>
      )}

      {/* Generate labels button - shown after review is finalized */}
      {isReviewed && acceptedCount > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Etiquettes</h3>
              <p className="text-sm text-gray-500 mt-1">
                Generez les etiquettes PDF pour les {acceptedCount} article(s) accepte(s) de cette liste.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => labelsMutation.mutate()}
              isLoading={labelsMutation.isPending}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Imprimer les etiquettes
            </Button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      <Modal
        isOpen={!!rejectingArticle}
        onClose={() => setRejectingArticle(null)}
        title="Refuser l'article"
        size="md"
      >
        {rejectingArticle && (
          <div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{rejectingArticle.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {CATEGORY_LABELS[rejectingArticle.category]} &middot; {rejectingArticle.price.toFixed(2)} &euro;
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif du refus (optionnel)
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={200}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Article tache, trop use..."
              />
              <p className="text-xs text-gray-500 mt-1">{rejectionReason.length}/200 caracteres</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectingArticle(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={rejectMutation.isPending}
              >
                Confirmer le refus
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingArticle}
        onClose={() => setEditingArticle(null)}
        title="Modifier l'article"
        size="lg"
      >
        {editingArticle && (
          <ArticleForm
            article={editingArticle}
            constraints={constraints}
            priceHints={priceHints}
            clothingCount={clothingCount}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingArticle(null)}
            isSubmitting={editMutation.isPending}
          />
        )}
      </Modal>

      {/* Finalize confirm */}
      <ConfirmModal
        isOpen={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        onConfirm={() => finalizeMutation.mutate()}
        title="Finaliser la revue"
        message={`Vous allez finaliser la revue de cette liste : ${acceptedCount} article(s) accepte(s) et ${rejectedCount} refuse(s). Cette action est irreversible.`}
        confirmLabel="Finaliser"
        variant="warning"
        isLoading={finalizeMutation.isPending}
      />
    </div>
  );
}
