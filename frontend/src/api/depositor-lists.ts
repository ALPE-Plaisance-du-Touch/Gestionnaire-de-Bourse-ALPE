import { apiClient } from './client';
import type {
  ItemList,
  ItemListDetail,
  ItemListSummary,
  CreateItemListRequest,
  ValidateItemListRequest,
  DepositorListsResponse,
  ListType,
  ListStatus,
} from '@/types';

/**
 * Edition summary for depositor.
 */
export interface MyEditionSummary {
  id: string;
  name: string;
  status: string;
  listType: string;
  startDatetime: string;
  endDatetime: string;
  declarationDeadline: string | null;
}

export interface MyEditionsResponse {
  editions: MyEditionSummary[];
}

/**
 * API response types after Axios interceptor transforms keys to camelCase.
 */
interface ItemListApiResponse {
  id: string;
  number: number;
  listType: string;
  labelColor: string | null;
  status: string;
  isValidated: boolean;
  validatedAt: string | null;
  checkedInAt: string | null;
  retrievedAt: string | null;
  labelsPrinted: boolean;
  labelsPrintedAt: string | null;
  editionId: string;
  depositorId: string;
  articleCount: number;
  clothingCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ItemListSummaryApiResponse {
  id: string;
  number: number;
  listType: string;
  status: string;
  articleCount: number;
  clothingCount: number;
  totalValue: string;
  isValidated: boolean;
  validatedAt: string | null;
  createdAt: string;
}

interface DepositorListsApiResponse {
  lists: ItemListSummaryApiResponse[];
  maxLists: number;
  canCreateMore: boolean;
}

/**
 * Transform API response to frontend ItemList type.
 */
function transformItemList(data: ItemListApiResponse): ItemList {
  return {
    id: data.id,
    number: data.number,
    listType: data.listType as ListType,
    labelColor: data.labelColor as ItemList['labelColor'],
    status: data.status as ListStatus,
    isValidated: data.isValidated,
    validatedAt: data.validatedAt,
    checkedInAt: data.checkedInAt,
    retrievedAt: data.retrievedAt,
    labelsPrinted: data.labelsPrinted,
    labelsPrintedAt: data.labelsPrintedAt,
    editionId: data.editionId,
    depositorId: data.depositorId,
    articleCount: data.articleCount,
    clothingCount: data.clothingCount,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Transform API response to frontend ItemListSummary type.
 */
function transformItemListSummary(data: ItemListSummaryApiResponse): ItemListSummary {
  return {
    id: data.id,
    number: data.number,
    listType: data.listType as ListType,
    status: data.status as ListStatus,
    articleCount: data.articleCount,
    clothingCount: data.clothingCount,
    totalValue: parseFloat(data.totalValue),
    isValidated: data.isValidated,
    validatedAt: data.validatedAt,
    createdAt: data.createdAt,
  };
}

/**
 * Depositor lists API endpoints.
 */
export const depositorListsApi = {
  /**
   * Get all editions where the current user is registered as a depositor.
   */
  getMyEditions: async (): Promise<MyEditionsResponse> => {
    const response = await apiClient.get<MyEditionsResponse>('/v1/depositor/my-editions');
    return response.data;
  },

  /**
   * Get all lists for the current depositor for a specific edition.
   */
  getMyLists: async (editionId: string): Promise<DepositorListsResponse> => {
    const response = await apiClient.get<DepositorListsApiResponse>(
      `/v1/depositor/editions/${editionId}/lists`
    );
    return {
      lists: response.data.lists.map(transformItemListSummary),
      maxLists: response.data.maxLists,
      canCreateMore: response.data.canCreateMore,
    };
  },

  /**
   * Create a new list for the current depositor.
   */
  createList: async (editionId: string, data?: CreateItemListRequest): Promise<ItemList> => {
    const response = await apiClient.post<ItemListApiResponse>(
      `/v1/depositor/editions/${editionId}/lists`,
      {
        list_type: data?.listType || 'standard',
      }
    );
    return transformItemList(response.data);
  },

  /**
   * Get a specific list by ID.
   */
  getList: async (listId: string): Promise<ItemListDetail> => {
    const response = await apiClient.get<ItemListApiResponse & { articles: unknown[] }>(
      `/v1/depositor/lists/${listId}`
    );
    const list = transformItemList(response.data);
    return {
      ...list,
      articles: [], // Articles are fetched separately
    };
  },

  /**
   * Validate a list (mark as ready for deposit).
   */
  validateList: async (listId: string, data: ValidateItemListRequest): Promise<ItemList> => {
    const response = await apiClient.post<ItemListApiResponse>(
      `/v1/depositor/lists/${listId}/validate`,
      {
        confirmation_accepted: data.confirmationAccepted,
      }
    );
    return transformItemList(response.data);
  },

  /**
   * Delete a draft list.
   * Only draft lists with no articles can be deleted.
   */
  deleteList: async (listId: string): Promise<void> => {
    await apiClient.delete(`/v1/depositor/lists/${listId}`);
  },

  /**
   * Download list as PDF.
   */
  downloadListPdf: async (listId: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/v1/depositor/lists/${listId}/pdf`,
      { responseType: 'blob', timeout: 30000 },
    );
    return response.data as Blob;
  },
};
