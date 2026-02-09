import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositorListsApi, articlesApi } from '@/api';
import { Button } from '@/components/ui';
import { ArticleForm } from '@/components/articles/ArticleForm';
import { ArticleList } from '@/components/articles/ArticleList';
import type { Article, CreateArticleRequest, UpdateArticleRequest } from '@/types';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-yellow-100 text-yellow-800' },
  validated: { label: 'Validée', className: 'bg-green-100 text-green-800' },
  checked_in: { label: 'Déposée', className: 'bg-blue-100 text-blue-800' },
  retrieved: { label: 'Récupérée', className: 'bg-gray-100 text-gray-800' },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [duplicatingArticle, setDuplicatingArticle] = useState<Article | null>(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [confirmationAccepted, setConfirmationAccepted] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Fetch list details
  const {
    data: list,
    isLoading: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ['depositor-list', listId],
    queryFn: () => depositorListsApi.getList(listId!),
    enabled: !!listId,
  });

  // Fetch articles
  const {
    data: articlesResponse,
    isLoading: articlesLoading,
    error: articlesError,
  } = useQuery({
    queryKey: ['list-articles', listId],
    queryFn: () => articlesApi.getArticles(listId!),
    enabled: !!listId,
  });

  // Fetch edition info (for deadline banner)
  const { data: editionsResponse } = useQuery({
    queryKey: ['my-editions'],
    queryFn: () => depositorListsApi.getMyEditions(),
  });

  const edition = editionsResponse?.editions.find((e) => e.id === list?.editionId);

  // Fetch category constraints
  const { data: constraints } = useQuery({
    queryKey: ['category-constraints'],
    queryFn: () => articlesApi.getCategoryConstraints(),
  });

  // Fetch price hints
  const { data: priceHints } = useQuery({
    queryKey: ['price-hints'],
    queryFn: () => articlesApi.getPriceHints(),
  });

  // Create article mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateArticleRequest) => articlesApi.createArticle(listId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-articles', listId] });
      queryClient.invalidateQueries({ queryKey: ['depositor-list', listId] });
      setShowArticleForm(false);
    },
  });

  // Update article mutation
  const updateMutation = useMutation({
    mutationFn: ({ articleId, data }: { articleId: string; data: UpdateArticleRequest }) =>
      articlesApi.updateArticle(listId!, articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-articles', listId] });
      queryClient.invalidateQueries({ queryKey: ['depositor-list', listId] });
      setEditingArticle(null);
    },
  });

  // Delete article mutation
  const deleteMutation = useMutation({
    mutationFn: (articleId: string) => articlesApi.deleteArticle(listId!, articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-articles', listId] });
      queryClient.invalidateQueries({ queryKey: ['depositor-list', listId] });
    },
  });

  // Validate list mutation
  const validateMutation = useMutation({
    mutationFn: () => depositorListsApi.validateList(listId!, { confirmationAccepted: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depositor-list', listId] });
      setShowValidateModal(false);
      setConfirmationAccepted(false);
    },
  });

  const handleAddArticle = () => {
    setEditingArticle(null);
    setShowArticleForm(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setDuplicatingArticle(null);
    setShowArticleForm(true);
  };

  const handleDuplicateArticle = (article: Article) => {
    setEditingArticle(null);
    setDuplicatingArticle(article);
    setShowArticleForm(true);
  };

  const handleDeleteArticle = (article: Article) => {
    if (confirm(`Supprimer l'article "${article.description}" ?`)) {
      deleteMutation.mutate(article.id);
    }
  };

  const handleArticleSubmit = (data: CreateArticleRequest) => {
    if (editingArticle) {
      updateMutation.mutate({
        articleId: editingArticle.id,
        data: data as UpdateArticleRequest,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancelForm = () => {
    setShowArticleForm(false);
    setEditingArticle(null);
    setDuplicatingArticle(null);
  };

  const handleDownloadPdf = async () => {
    if (!listId) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await depositorListsApi.downloadListPdf(listId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liste-${list?.number ?? listId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Error handled silently - user sees nothing downloaded
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleValidateList = () => {
    setShowValidateModal(true);
  };

  const handleConfirmValidation = () => {
    if (confirmationAccepted) {
      validateMutation.mutate();
    }
  };

  if (!listId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Liste non trouvée.
        </div>
      </div>
    );
  }

  if (listError || articlesError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors du chargement de la liste. Veuillez réessayer.
        </div>
      </div>
    );
  }

  const isLoading = listLoading || articlesLoading;
  const articles = articlesResponse?.items ?? [];
  const isDraft = list?.status === 'draft';
  const canAddMore = isDraft && articles.length < (constraints?.maxArticlesPerList ?? 24);
  const clothingCount = articlesResponse?.clothingCount ?? 0;
  const canAddMoreClothing = clothingCount < (constraints?.maxClothingPerList ?? 12);
  const totalValue = articles.reduce((sum, a) => sum + a.price, 0);
  const canValidate = isDraft && articles.length > 0 && articles.every((a) => a.conformityCertified);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-500">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Liste n°{list?.number}
            </h1>
            {list && (
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  STATUS_LABELS[list.status]?.className ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {STATUS_LABELS[list.status]?.label ?? list.status}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || articles.length === 0}
            >
              {isDownloadingPdf ? 'Telechargement...' : 'Telecharger PDF'}
            </Button>
            {isDraft && canValidate && (
              <Button onClick={handleValidateList} disabled={validateMutation.isPending}>
                Valider la liste
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Deadline banner */}
      {edition?.declarationDeadline && isDraft && (
        <DeadlineBanner deadline={edition.declarationDeadline} />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Articles</p>
          <p className="text-2xl font-bold text-gray-900">
            {articles.length} / {constraints?.maxArticlesPerList ?? 24}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Vêtements</p>
          <p className="text-2xl font-bold text-purple-600">
            {clothingCount} / {constraints?.maxClothingPerList ?? 12}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Valeur totale</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(totalValue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Certifiés</p>
          <p className="text-2xl font-bold text-blue-600">
            {articles.filter((a) => a.conformityCertified).length} / {articles.length}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {!canAddMoreClothing && isDraft && (
        <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg">
          Vous avez atteint le maximum de vêtements ({constraints?.maxClothingPerList ?? 12}).
        </div>
      )}

      {!canValidate && isDraft && articles.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          Tous les articles doivent être certifiés conformes avant de pouvoir valider la liste.
        </div>
      )}

      {/* Error messages */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Une erreur est survenue. Veuillez réessayer.
        </div>
      )}

      {/* Article Form or List */}
      {showArticleForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingArticle
              ? 'Modifier l\'article'
              : duplicatingArticle
              ? 'Dupliquer l\'article'
              : 'Ajouter un article'}
          </h2>
          <ArticleForm
            article={editingArticle}
            duplicateFrom={duplicatingArticle}
            constraints={constraints}
            priceHints={priceHints}
            clothingCount={clothingCount}
            onSubmit={handleArticleSubmit}
            onCancel={handleCancelForm}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      ) : (
        <>
          {/* Add article button */}
          {isDraft && (
            <div className="mb-4">
              <Button onClick={handleAddArticle} disabled={!canAddMore}>
                Ajouter un article
              </Button>
              {!canAddMore && (
                <span className="ml-2 text-sm text-gray-500">
                  Maximum d'articles atteint
                </span>
              )}
            </div>
          )}

          {/* Articles list */}
          <ArticleList
            articles={articles}
            isDraft={isDraft}
            onEdit={handleEditArticle}
            onDelete={handleDeleteArticle}
            onDuplicate={handleDuplicateArticle}
            isDeleting={deleteMutation.isPending}
            canAddMore={canAddMore}
          />
        </>
      )}

      {/* Help text for draft lists */}
      {isDraft && !showArticleForm && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Conseils</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>- Maximum 24 articles par liste, dont 12 vêtements</li>
            <li>- Prix minimum : 1€ (150€ max pour les poussettes)</li>
            <li>- Certifiez chaque article propre et en bon état</li>
            <li>- Une fois validée, la liste ne peut plus être modifiée</li>
          </ul>
        </div>
      )}

      {/* Validate modal */}
      {showValidateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Valider la liste
            </h3>
            <p className="text-gray-600 mb-4">
              Vous êtes sur le point de valider votre liste de {articles.length} article
              {articles.length > 1 ? 's' : ''} pour un total de {formatPrice(totalValue)}.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Attention :</strong> Une fois validée, vous ne pourrez plus modifier
                votre liste. Assurez-vous que tous les articles sont correctement saisis.
              </p>
            </div>
            <label className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                checked={confirmationAccepted}
                onChange={(e) => setConfirmationAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Je certifie que tous mes articles sont propres, en bon état, et conformes aux
                conditions de vente de la bourse aux vêtements.
              </span>
            </label>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowValidateModal(false);
                  setConfirmationAccepted(false);
                }}
                disabled={validateMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmValidation}
                disabled={!confirmationAccepted || validateMutation.isPending}
              >
                {validateMutation.isPending ? 'Validation...' : 'Valider ma liste'}
              </Button>
            </div>
            {validateMutation.isError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                Erreur lors de la validation. Veuillez réessayer.
              </div>
            )}
          </div>
        </div>
      )}
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
        La date limite de declaration est depassee. Vous ne pouvez plus modifier vos listes.
      </div>
    );
  }

  if (diffDays <= 3) {
    return (
      <div className="mb-4 bg-orange-50 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg">
        Il vous reste {diffDays} jour{diffDays > 1 ? 's' : ''} pour finaliser vos articles.
      </div>
    );
  }

  return null;
}
