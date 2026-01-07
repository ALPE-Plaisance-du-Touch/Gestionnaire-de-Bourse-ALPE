/**
 * Article types.
 */

export type ArticleCategory =
  | 'clothing'
  | 'shoes'
  | 'nursery'
  | 'toys'
  | 'books'
  | 'accessories'
  | 'other';

export type ArticleGender =
  | 'girl'
  | 'boy'
  | 'unisex'
  | 'adult_male'
  | 'adult_female'
  | 'adult_unisex';

export type ArticleStatus =
  | 'draft'
  | 'validated'
  | 'on_sale'
  | 'sold'
  | 'unsold'
  | 'retrieved'
  | 'donated';

export interface Article {
  id: string;
  lineNumber: number;
  category: ArticleCategory;
  subcategory: string | null;
  description: string;
  price: number;
  size: string | null;
  brand: string | null;
  color: string | null;
  gender: ArticleGender | null;
  isLot: boolean;
  lotQuantity: number | null;
  status: ArticleStatus;
  conformityCertified: boolean;
  barcode: string | null;
  notes: string | null;
  itemListId: string;
  createdAt: string;
}

export interface CreateArticleRequest {
  category: ArticleCategory;
  subcategory?: string;
  description: string;
  price: number;
  size?: string;
  brand?: string;
  color?: string;
  gender?: ArticleGender;
  isLot?: boolean;
  lotQuantity?: number;
  conformityCertified: boolean;
}

export interface UpdateArticleRequest {
  description?: string;
  price?: number;
  size?: string;
  brand?: string;
  color?: string;
  gender?: ArticleGender;
  isLot?: boolean;
  lotQuantity?: number;
  conformityCertified?: boolean;
}

/**
 * Category info for frontend display.
 */
export interface CategoryInfo {
  id: string;
  name: string;
  nameFr: string;
  maxPerList?: number;
  maxPrice?: number;
  isClothing: boolean;
}

/**
 * Category constraints from backend.
 */
export interface CategoryConstraints {
  categories: CategoryInfo[];
  blacklisted: string[];
  maxArticlesPerList: number;
  maxClothingPerList: number;
  minPrice: number;
  maxPriceStroller: number;
  maxLotSize: number;
  maxLotAgeMonths: number;
}

/**
 * Price hint for a category.
 */
export interface PriceHint {
  category: string;
  subcategory: string | null;
  target: 'adult' | 'child';
  minPrice: number;
  maxPrice: number;
}

/**
 * Response for article list with summary.
 */
export interface ArticleListResponse {
  items: Article[];
  total: number;
  clothingCount: number;
  categoryCounts: Record<string, number>;
}
