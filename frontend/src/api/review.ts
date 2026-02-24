import { apiClient } from './client';
import type {
  Article,
  UpdateArticleRequest,
  ReviewListItem,
  ReviewListDetail,
  ReviewSummary,
} from '@/types';

/**
 * API response types (after Axios camelCase transform).
 * Articles come with price as string (Decimal), need manual transform.
 */
interface ArticleApiResponse {
  id: string;
  lineNumber: number;
  category: string;
  subcategory: string | null;
  description: string;
  price: string;
  size: string | null;
  brand: string | null;
  color: string | null;
  gender: string | null;
  isLot: boolean;
  lotQuantity: number | null;
  status: string;
  barcode: string | null;
  notes: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
  reviewedAt: string | null;
  itemListId: string;
  createdAt: string;
}

interface ReviewListItemApiResponse {
  id: string;
  number: number;
  listType: string;
  status: string;
  depositorName: string;
  articleCount: number;
  reviewStats: { pending: number; accepted: number; rejected: number };
  reviewedAt: string | null;
  reviewedByName: string | null;
}

interface ReviewListDetailApiResponse {
  id: string;
  number: number;
  listType: string;
  status: string;
  depositorName: string;
  articles: ArticleApiResponse[];
  reviewStats: { pending: number; accepted: number; rejected: number };
  reviewedAt: string | null;
}

function transformArticle(data: ArticleApiResponse): Article {
  return {
    ...data,
    price: parseFloat(data.price),
  } as unknown as Article;
}

function transformReviewListItem(data: ReviewListItemApiResponse): ReviewListItem {
  return {
    id: data.id,
    number: data.number,
    listType: data.listType,
    status: data.status,
    depositorName: data.depositorName,
    articleCount: data.articleCount,
    reviewStats: data.reviewStats,
    reviewedAt: data.reviewedAt,
    reviewedByName: data.reviewedByName,
  };
}

function transformReviewListDetail(data: ReviewListDetailApiResponse): ReviewListDetail {
  return {
    id: data.id,
    number: data.number,
    listType: data.listType,
    status: data.status,
    depositorName: data.depositorName,
    articles: data.articles.map(transformArticle),
    reviewStats: data.reviewStats,
    reviewedAt: data.reviewedAt,
  };
}

export const reviewApi = {
  getReviewLists: async (
    editionId: string,
    statusFilter?: string
  ): Promise<ReviewListItem[]> => {
    const params = statusFilter ? { status: statusFilter } : undefined;
    const response = await apiClient.get<ReviewListItemApiResponse[]>(
      `/v1/editions/${editionId}/review/lists`,
      { params }
    );
    return response.data.map(transformReviewListItem);
  },

  getReviewListDetail: async (
    editionId: string,
    listId: string
  ): Promise<ReviewListDetail> => {
    const response = await apiClient.get<ReviewListDetailApiResponse>(
      `/v1/editions/${editionId}/review/lists/${listId}`
    );
    return transformReviewListDetail(response.data);
  },

  acceptArticle: async (editionId: string, articleId: string): Promise<Article> => {
    const response = await apiClient.post<ArticleApiResponse>(
      `/v1/editions/${editionId}/review/articles/${articleId}/accept`
    );
    return transformArticle(response.data);
  },

  rejectArticle: async (
    editionId: string,
    articleId: string,
    reason?: string
  ): Promise<Article> => {
    const body = reason ? { rejection_reason: reason } : undefined;
    const response = await apiClient.post<ArticleApiResponse>(
      `/v1/editions/${editionId}/review/articles/${articleId}/reject`,
      body
    );
    return transformArticle(response.data);
  },

  editArticle: async (
    editionId: string,
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
    const response = await apiClient.put<ArticleApiResponse>(
      `/v1/editions/${editionId}/review/articles/${articleId}`,
      payload
    );
    return transformArticle(response.data);
  },

  finalizeReview: async (
    editionId: string,
    listId: string
  ): Promise<ReviewListItem> => {
    const response = await apiClient.post<ReviewListItemApiResponse>(
      `/v1/editions/${editionId}/review/lists/${listId}/finalize`
    );
    return transformReviewListItem(response.data);
  },

  getReviewSummary: async (editionId: string): Promise<ReviewSummary> => {
    const response = await apiClient.get<ReviewSummary>(
      `/v1/editions/${editionId}/review/summary`
    );
    return response.data;
  },
};
