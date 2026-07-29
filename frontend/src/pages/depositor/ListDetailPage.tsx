import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositorListsApi, articlesApi } from '@/api';
import { Button, ConfirmModal } from '@/components/ui';
import { ArticleForm } from '@/components/articles/ArticleForm';
import { ArticleList } from '@/components/articles/ArticleList';
import type { Article, CreateArticleRequest, UpdateArticleRequest } from '@/types';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-accent/15 text-accent-dark' },
  not_finalized: { label: 'Non finalisée', className: 'bg-error/10 text-error' },
  validated: { label: 'Validée', className: 'bg-primary/10 text-primary-dark' },
  checked_in: { label: 'Déposée', className: 'bg-primary/10 text-primary-dark' },
  reviewed: { label: 'Vérifiée', className: 'bg-primary/10 text-primary-dark' },
  retrieved: { label: 'Récupérée', className: 'bg-cream-dark text-bark' },
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
  const [pdfError, setPdfError] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

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
      setShowArticleForm(false);
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
    setArticleToDelete(article);
  };

  const handleDeleteArticleConfirm = () => {
    if (articleToDelete) {
      deleteMutation.mutate(articleToDelete.id);
      setArticleToDelete(null);
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
    setPdfError(false);
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
      setPdfError(true);
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
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
          Liste non trouvée.
        </div>
      </div>
    );
  }

  if (listError || articlesError) {
    return (
      <div className="p-6">
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
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
  const canValidate = isDraft && articles.length > 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-bark-muted">Chargement...</span>
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
          className="text-bark-muted hover:text-bark mb-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-bark">
              Liste n°{list?.number}
            </h1>
            {list && (
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  STATUS_LABELS[list.status]?.className ?? 'bg-cream-dark text-bark'
                }`}
              >
                {STATUS_LABELS[list.status]?.label ?? list.status}
              </span>
            )}
            <Link to="/aide#guide-deposant" className="text-xs text-bark-muted hover:text-primary mt-1 inline-block">
              Besoin d'aide ?
            </Link>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || articles.length === 0}
            >
              {isDownloadingPdf ? 'Téléchargement...' : 'Télécharger PDF'}
            </Button>
            {isDraft && canValidate && (
              <Button onClick={handleValidateList} disabled={validateMutation.isPending}>
                Valider la liste
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF error */}
      {pdfError && (
        <div className="mb-4 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg" role="alert">
          Erreur lors du téléchargement du PDF. Veuillez réessayer.
        </div>
      )}

      {/* Deadline banner */}
      {edition?.declarationDeadline && (
        <DeadlineBanner deadline={edition.declarationDeadline} />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-bark-muted">Articles</p>
          <p className="text-2xl font-bold text-bark">
            {articles.length} / {constraints?.maxArticlesPerList ?? 24}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-bark-muted">Vêtements</p>
          <p className="text-2xl font-bold text-secondary-dark">
            {clothingCount} / {constraints?.maxClothingPerList ?? 12}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-bark-muted">Valeur totale</p>
          <p className="text-2xl font-bold text-primary">{formatPrice(totalValue)}</p>
        </div>
      </div>

      {/* Warnings */}
      {!canAddMoreClothing && isDraft && (
        <div className="mb-4 bg-secondary/10 border border-secondary/30 text-secondary-dark px-4 py-3 rounded-lg">
          Vous avez atteint le maximum de vêtements ({constraints?.maxClothingPerList ?? 12}).
        </div>
      )}

      {/* Error messages */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <div className="mb-4 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
          Une erreur est survenue. Veuillez réessayer.
        </div>
      )}

      {/* Article Form or List */}
      {showArticleForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-bark mb-4">
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
                <span className="ml-2 text-sm text-bark-muted">
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

      {/* Rejected articles section - visible to depositor after review */}
      {!showArticleForm && articles.some((a) => a.status === 'rejected') && (
        <div className="mt-6 bg-error/10 border border-error/30 rounded-lg p-4">
          <h4 className="font-medium text-error mb-3">
            Articles refuses ({articles.filter((a) => a.status === 'rejected').length})
          </h4>
          <div className="space-y-2">
            {articles
              .filter((a) => a.status === 'rejected')
              .map((article) => (
                <div
                  key={article.id}
                  className="bg-white border border-error/30 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-bark">{article.description}</p>
                      <p className="text-xs text-bark-muted mt-0.5">
                        {formatPrice(article.price)}
                        {article.size ? ` - Taille ${article.size}` : ''}
                      </p>
                    </div>
                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-error/10 text-error">
                      Refuse
                    </span>
                  </div>
                  {article.rejectionReason && (
                    <p className="mt-2 text-xs text-error">
                      Motif : {article.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Help text for draft lists */}
      {isDraft && !showArticleForm && (
        <div className="mt-6 bg-primary/10 border border-primary/30 rounded-lg p-4">
          <h4 className="font-medium text-primary-dark mb-2">Conseils</h4>
          <ul className="text-sm text-primary-dark space-y-1">
            <li>- Maximum 24 articles par liste, dont 12 vêtements</li>
            <li>- Prix minimum : 1€ (150€ max pour les poussettes)</li>
            <li>- Une fois validée, la liste ne peut plus être modifiée</li>
          </ul>
        </div>
      )}

      {/* Delete article confirmation modal */}
      <ConfirmModal
        isOpen={!!articleToDelete}
        onClose={() => setArticleToDelete(null)}
        onConfirm={handleDeleteArticleConfirm}
        title="Supprimer l'article"
        message={`Supprimer l'article « ${articleToDelete?.description} » ?`}
        variant="danger"
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
      />

      {/* Validate modal */}
      <ConfirmModal
        isOpen={showValidateModal}
        onClose={() => {
          setShowValidateModal(false);
          setConfirmationAccepted(false);
        }}
        onConfirm={handleConfirmValidation}
        title="Valider la liste"
        variant="warning"
        confirmLabel="Valider ma liste"
        isLoading={validateMutation.isPending}
        confirmDisabled={!confirmationAccepted}
      >
        <p className="text-bark-light">
          Vous êtes sur le point de valider votre liste de {articles.length} article
          {articles.length > 1 ? 's' : ''} pour un total de {formatPrice(totalValue)}.
        </p>
        <div className="bg-accent/10 border border-accent/40 rounded-lg p-4">
          <p className="text-sm text-accent-dark">
            <strong>Attention :</strong> Une fois validée, vous ne pourrez plus modifier
            votre liste. Assurez-vous que tous les articles sont correctement saisis.
          </p>
        </div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={confirmationAccepted}
            onChange={(e) => setConfirmationAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary border-sand rounded focus:ring-primary"
          />
          <span className="text-sm text-bark-light">
            Je certifie que tous mes articles sont propres, en bon état, et conformes aux
            conditions de vente de la bourse aux vêtements.
          </span>
        </label>
        {validateMutation.isError && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg text-sm" role="alert">
            Erreur lors de la validation. Veuillez réessayer.
          </div>
        )}
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
      <div className="mb-4 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
        La date limite de déclaration est dépassée. Cette liste est en lecture seule.
      </div>
    );
  }

  if (diffDays <= 3) {
    return (
      <div className="mb-4 bg-secondary/10 border border-secondary/30 text-secondary-dark px-4 py-3 rounded-lg">
        Il vous reste {diffDays} jour{diffDays > 1 ? 's' : ''} pour finaliser vos articles.
      </div>
    );
  }

  return null;
}
