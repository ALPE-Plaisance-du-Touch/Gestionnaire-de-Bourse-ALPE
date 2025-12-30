import { apiClient } from './client';
import type {
  Edition,
  EditionListResponse,
  CreateEditionRequest,
  UpdateEditionRequest,
  EditionStatus,
} from '@/types';

/**
 * API response type (snake_case from backend).
 */
interface EditionApiResponse {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  status: string;
  start_datetime: string;
  end_datetime: string;
  declaration_deadline: string | null;
  deposit_start_datetime: string | null;
  deposit_end_datetime: string | null;
  sale_start_datetime: string | null;
  sale_end_datetime: string | null;
  retrieval_start_datetime: string | null;
  retrieval_end_datetime: string | null;
  commission_rate: number | null;
  created_at: string;
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface EditionListApiResponse {
  items: EditionApiResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Transform API response to frontend Edition type.
 */
function transformEdition(data: EditionApiResponse): Edition {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    location: data.location,
    status: data.status as EditionStatus,
    startDatetime: data.start_datetime,
    endDatetime: data.end_datetime,
    declarationDeadline: data.declaration_deadline,
    depositStartDatetime: data.deposit_start_datetime,
    depositEndDatetime: data.deposit_end_datetime,
    saleStartDatetime: data.sale_start_datetime,
    saleEndDatetime: data.sale_end_datetime,
    retrievalStartDatetime: data.retrieval_start_datetime,
    retrievalEndDatetime: data.retrieval_end_datetime,
    commissionRate: data.commission_rate,
    createdAt: data.created_at,
    createdBy: data.created_by
      ? {
          id: data.created_by.id,
          firstName: data.created_by.first_name,
          lastName: data.created_by.last_name,
          email: data.created_by.email,
        }
      : null,
  };
}

/**
 * Editions API endpoints.
 */
export const editionsApi = {
  /**
   * List editions with optional filtering and pagination.
   */
  getEditions: async (params?: {
    status?: EditionStatus;
    includeArchived?: boolean;
    page?: number;
    limit?: number;
  }): Promise<EditionListResponse> => {
    const response = await apiClient.get<EditionListApiResponse>('/v1/editions', {
      params: {
        status: params?.status,
        include_archived: params?.includeArchived,
        page: params?.page,
        limit: params?.limit,
      },
    });
    return {
      items: response.data.items.map(transformEdition),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      pages: response.data.pages,
    };
  },

  /**
   * Get a single edition by ID.
   */
  getEdition: async (editionId: string): Promise<Edition> => {
    const response = await apiClient.get<EditionApiResponse>(`/v1/editions/${editionId}`);
    return transformEdition(response.data);
  },

  /**
   * Create a new edition.
   */
  createEdition: async (data: CreateEditionRequest): Promise<Edition> => {
    const response = await apiClient.post<EditionApiResponse>('/v1/editions', {
      name: data.name,
      start_datetime: data.startDatetime,
      end_datetime: data.endDatetime,
      location: data.location,
      description: data.description,
    });
    return transformEdition(response.data);
  },

  /**
   * Update an edition.
   */
  updateEdition: async (editionId: string, data: UpdateEditionRequest): Promise<Edition> => {
    const payload: Record<string, unknown> = {};

    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.location !== undefined) payload.location = data.location;
    if (data.startDatetime !== undefined) payload.start_datetime = data.startDatetime;
    if (data.endDatetime !== undefined) payload.end_datetime = data.endDatetime;
    if (data.declarationDeadline !== undefined) payload.declaration_deadline = data.declarationDeadline;
    if (data.depositStartDatetime !== undefined) payload.deposit_start_datetime = data.depositStartDatetime;
    if (data.depositEndDatetime !== undefined) payload.deposit_end_datetime = data.depositEndDatetime;
    if (data.saleStartDatetime !== undefined) payload.sale_start_datetime = data.saleStartDatetime;
    if (data.saleEndDatetime !== undefined) payload.sale_end_datetime = data.saleEndDatetime;
    if (data.retrievalStartDatetime !== undefined) payload.retrieval_start_datetime = data.retrievalStartDatetime;
    if (data.retrievalEndDatetime !== undefined) payload.retrieval_end_datetime = data.retrievalEndDatetime;
    if (data.commissionRate !== undefined) payload.commission_rate = data.commissionRate;

    const response = await apiClient.put<EditionApiResponse>(`/v1/editions/${editionId}`, payload);
    return transformEdition(response.data);
  },

  /**
   * Update edition status.
   */
  updateEditionStatus: async (editionId: string, status: EditionStatus): Promise<Edition> => {
    const response = await apiClient.patch<EditionApiResponse>(`/v1/editions/${editionId}/status`, {
      status,
    });
    return transformEdition(response.data);
  },

  /**
   * Delete an edition.
   * Only draft editions can be deleted.
   */
  deleteEdition: async (editionId: string): Promise<void> => {
    await apiClient.delete(`/v1/editions/${editionId}`);
  },
};
