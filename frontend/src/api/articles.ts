import { apiClient } from './client';
import type {
  Article,
  ArticleCategory,
  ArticleGender,
  ArticleStatus,
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleListResponse,
  CategoryConstraints,
  CategoryInfo,
  PriceHint,
} from '@/types';

/**
 * API response types after Axios interceptor transforms keys to camelCase.
 */
interface ArticleApiResponse {
  id: string;
  lineNumber: number;
  category: string;
  subcategory: string | null;
  description: string;
  price: string; // Decimal serialized as string
  size: string | null;
  brand: string | null;
  color: string | null;
  gender: string | null;
  isLot: boolean;
  lotQuantity: number | null;
  status: string;
  conformityCertified: boolean;
  barcode: string | null;
  notes: string | null;
  itemListId: string;
  createdAt: string;
}

interface ArticleListApiResponse {
  items: ArticleApiResponse[];
  total: number;
  clothingCount: number;
  categoryCounts: Record<string, number>;
}

interface CategoryInfoApiResponse {
  id: string;
  name: string;
  nameFr: string;
  maxPerList: number | null;
  maxPrice: string | null;
  isClothing: boolean;
}

interface CategoryConstraintsApiResponse {
  categories: CategoryInfoApiResponse[];
  blacklisted: string[];
  maxArticlesPerList: number;
  maxClothingPerList: number;
  minPrice: string;
  maxPriceStroller: string;
  maxLotSize: number;
  maxLotAgeMonths: number;
}

interface PriceHintApiResponse {
  category: string;
  subcategory: string | null;
  target: string;
  minPrice: string;
  maxPrice: string;
}

interface PriceHintsApiResponse {
  hints: PriceHintApiResponse[];
}

/**
 * Transform API response to frontend Article type.
 */
function transformArticle(data: ArticleApiResponse): Article {
  return {
    id: data.id,
    lineNumber: data.lineNumber,
    category: data.category as ArticleCategory,
    subcategory: data.subcategory,
    description: data.description,
    price: parseFloat(data.price),
    size: data.size,
    brand: data.brand,
    color: data.color,
    gender: data.gender as ArticleGender | null,
    isLot: data.isLot,
    lotQuantity: data.lotQuantity,
    status: data.status as ArticleStatus,
    conformityCertified: data.conformityCertified,
    barcode: data.barcode,
    notes: data.notes,
    itemListId: data.itemListId,
    createdAt: data.createdAt,
  };
}

/**
 * Transform category info from API.
 */
function transformCategoryInfo(data: CategoryInfoApiResponse): CategoryInfo {
  return {
    id: data.id,
    name: data.name,
    nameFr: data.nameFr,
    maxPerList: data.maxPerList ?? undefined,
    maxPrice: data.maxPrice ? parseFloat(data.maxPrice) : undefined,
    isClothing: data.isClothing,
  };
}

/**
 * Articles API endpoints.
 */
export const articlesApi = {
  /**
   * Get all articles for a list.
   */
  getArticles: async (listId: string): Promise<ArticleListResponse> => {
    const response = await apiClient.get<ArticleListApiResponse>(
      `/v1/depositor/lists/${listId}/articles`
    );
    return {
      items: response.data.items.map(transformArticle),
      total: response.data.total,
      clothingCount: response.data.clothingCount,
      categoryCounts: response.data.categoryCounts,
    };
  },

  /**
   * Create a new article in a list.
   */
  createArticle: async (listId: string, data: CreateArticleRequest): Promise<Article> => {
    const response = await apiClient.post<ArticleApiResponse>(
      `/v1/depositor/lists/${listId}/articles`,
      {
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        price: data.price,
        size: data.size,
        brand: data.brand,
        color: data.color,
        gender: data.gender,
        is_lot: data.isLot,
        lot_quantity: data.lotQuantity,
        conformity_certified: data.conformityCertified,
      }
    );
    return transformArticle(response.data);
  },

  /**
   * Update an existing article.
   */
  updateArticle: async (
    listId: string,
    articleId: string,
    data: UpdateArticleRequest
  ): Promise<Article> => {
    const payload: Record<string, unknown> = {};

    if (data.category !== undefined) payload.category = data.category;
    if (data.subcategory !== undefined) payload.subcategory = data.subcategory;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price !== undefined) payload.price = data.price;
    if (data.size !== undefined) payload.size = data.size;
    if (data.brand !== undefined) payload.brand = data.brand;
    if (data.color !== undefined) payload.color = data.color;
    if (data.gender !== undefined) payload.gender = data.gender;
    if (data.isLot !== undefined) payload.is_lot = data.isLot;
    if (data.lotQuantity !== undefined) payload.lot_quantity = data.lotQuantity;
    if (data.conformityCertified !== undefined) payload.conformity_certified = data.conformityCertified;

    const response = await apiClient.put<ArticleApiResponse>(
      `/v1/depositor/lists/${listId}/articles/${articleId}`,
      payload
    );
    return transformArticle(response.data);
  },

  /**
   * Delete an article from a list.
   */
  deleteArticle: async (listId: string, articleId: string): Promise<void> => {
    await apiClient.delete(`/v1/depositor/lists/${listId}/articles/${articleId}`);
  },

  /**
   * Get category constraints for article declaration.
   */
  getCategoryConstraints: async (): Promise<CategoryConstraints> => {
    const response = await apiClient.get<CategoryConstraintsApiResponse>('/v1/categories');
    return {
      categories: response.data.categories.map(transformCategoryInfo),
      blacklisted: response.data.blacklisted,
      maxArticlesPerList: response.data.maxArticlesPerList,
      maxClothingPerList: response.data.maxClothingPerList,
      minPrice: parseFloat(response.data.minPrice),
      maxPriceStroller: parseFloat(response.data.maxPriceStroller),
      maxLotSize: response.data.maxLotSize,
      maxLotAgeMonths: response.data.maxLotAgeMonths,
    };
  },

  /**
   * Get price hints for article pricing.
   */
  getPriceHints: async (): Promise<PriceHint[]> => {
    const response = await apiClient.get<PriceHintsApiResponse>('/v1/price-hints');
    return response.data.hints.map((hint) => ({
      category: hint.category,
      subcategory: hint.subcategory,
      target: hint.target as 'adult' | 'child',
      minPrice: parseFloat(hint.minPrice),
      maxPrice: parseFloat(hint.maxPrice),
    }));
  },
};
