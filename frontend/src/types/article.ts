/**
 * Article types.
 */

export type ArticleCategory =
  | 'clothing'
  | 'shoes'
  | 'accessories'
  | 'toys'
  | 'games'
  | 'books'
  | 'nursery'
  | 'stroller'
  | 'car_seat'
  | 'other';

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
  description: string;
  category: ArticleCategory;
  size: string | null;
  brand: string | null;
  color: string | null;
  price: number;
  lineNumber: number;
  isLot: boolean;
  lotQuantity: number | null;
  status: ArticleStatus;
  conformityCertified: boolean;
  barcode: string | null;
  itemListId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleRequest {
  description: string;
  category: ArticleCategory;
  size?: string;
  brand?: string;
  color?: string;
  price: number;
  lineNumber: number;
  isLot?: boolean;
  lotQuantity?: number;
}

export interface UpdateArticleRequest {
  description?: string;
  category?: ArticleCategory;
  size?: string;
  brand?: string;
  color?: string;
  price?: number;
}
