import type { Article, ArticleCategory } from '@/types';

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  clothing: 'Vêtements',
  shoes: 'Chaussures',
  nursery: 'Puériculture',
  toys: 'Jouets',
  books: 'Livres',
  accessories: 'Accessoires',
  other: 'Autres',
};

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  clothing: 'bg-purple-100 text-purple-800',
  shoes: 'bg-blue-100 text-blue-800',
  nursery: 'bg-pink-100 text-pink-800',
  toys: 'bg-yellow-100 text-yellow-800',
  books: 'bg-green-100 text-green-800',
  accessories: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="text-gray-500">Aucun article dans cette liste.</p>
        {isDraft && (
          <p className="text-sm text-gray-400 mt-1">
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
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Article
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Détails
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Certifié
              </th>
              {isDraft && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {article.lineNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {article.description}
                  </div>
                  {article.isLot && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      Lot de {article.lotQuantity}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      CATEGORY_COLORS[article.category]
                    }`}
                  >
                    {CATEGORY_LABELS[article.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div className="space-y-0.5">
                    {article.size && <div>Taille: {article.size}</div>}
                    {article.brand && <div>Marque: {article.brand}</div>}
                    {article.color && <div>Couleur: {article.color}</div>}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {formatPrice(article.price)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {article.conformityCertified ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </td>
                {isDraft && (
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-1">
                    <button
                      onClick={() => onEdit(article)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDuplicate(article)}
                      disabled={!canAddMore}
                      className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!canAddMore ? 'Liste complète' : 'Dupliquer'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(article)}
                      disabled={isDeleting}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
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
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          {articles.length} article{articles.length > 1 ? 's' : ''} - Total:{' '}
          <span className="font-medium text-gray-900">
            {formatPrice(articles.reduce((sum, a) => sum + a.price, 0))}
          </span>
        </p>
      </div>
    </div>
  );
}
