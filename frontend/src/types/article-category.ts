import type { ArticleCategory } from './article';

/**
 * Single source of truth for how an article category is displayed.
 *
 * The table was duplicated between ArticleList and ReviewListDetailPage and the two
 * copies had drifted: the same category rendered in different colours depending on
 * which page you were on.
 *
 * Seven categories, seven distinct styles. Two pairs used to share one — shoes with
 * books, clothing with accessories — and nursery used bg-pink-100, a Tailwind colour
 * with no place in the brand palette. Every pairing here clears AA at small sizes.
 */
export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  clothing: 'Vêtements',
  shoes: 'Chaussures',
  nursery: 'Puériculture',
  toys: 'Jouets',
  books: 'Livres',
  accessories: 'Accessoires',
  other: 'Autres',
};

export const ARTICLE_CATEGORY_COLORS: Record<ArticleCategory, string> = {
  clothing: 'bg-warning-soft text-warning-strong',
  shoes: 'bg-info-soft text-primary-strong',
  nursery: 'bg-error-soft text-error-dark',
  toys: 'bg-warning-deep text-warning-strong',
  books: 'bg-success-soft text-success-strong',
  accessories: 'bg-chart-4 text-ink',
  other: 'bg-cream-dark text-bark',
};
