import type { Article } from '@/types';
import { ARTICLE_CATEGORY_COLORS, ARTICLE_CATEGORY_LABELS } from '@/types';


function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

interface ArticleListProps {
  articles: Article[];
  isDraft: boolean;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onDuplicate: (article: Article) => void;
  isDeleting: boolean;
  canAddMore: boolean;
}

export function ArticleList({
  articles,
  isDraft,
  onEdit,
  onDelete,
  onDuplicate,
  isDeleting,
  canAddMore,
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="text-bark-muted">Aucun article dans cette liste.</p>
        {isDraft && (
          <p className="text-sm text-bark-muted mt-1">
            Cliquez sur "Ajouter un article" pour commencer.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-cream">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase tracking-wider">
                Article
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase tracking-wider">
                Détails
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase tracking-wider">
                Prix
              </th>
              {isDraft && (
                <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-cream">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-bark-muted">
                  {article.lineNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-bark">
                    {article.description}
                  </div>
                  {article.isLot && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info-soft text-primary-strong mt-1">
                      Lot de {article.lotQuantity}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ARTICLE_CATEGORY_COLORS[article.category]
                    }`}
                  >
                    {ARTICLE_CATEGORY_LABELS[article.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-bark-muted">
                  <div className="space-y-0.5">
                    {article.size && <div>Taille: {article.size}</div>}
                    {article.brand && <div>Marque: {article.brand}</div>}
                    {article.color && <div>Couleur: {article.color}</div>}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-bark">
                  {formatPrice(article.price)}
                </td>
                {isDraft && (
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-1">
                    <button
                      onClick={() => onEdit(article)}
                      className="p-1.5 text-bark-muted hover:text-primary-strong hover:bg-info-soft rounded"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDuplicate(article)}
                      disabled={!canAddMore}
                      className="p-1.5 text-bark-muted hover:text-primary-strong hover:bg-info-soft rounded disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!canAddMore ? 'Liste complète' : 'Dupliquer'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(article)}
                      disabled={isDeleting}
                      className="p-1.5 text-bark-muted hover:text-error-dark hover:bg-error-soft rounded disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-cream border-t border-sand">
        <p className="text-sm text-bark-muted">
          {articles.length} article{articles.length > 1 ? 's' : ''} - Total:{' '}
          <span className="font-medium text-bark">
            {formatPrice(articles.reduce((sum, a) => sum + a.price, 0))}
          </span>
        </p>
      </div>
    </div>
  );
}
