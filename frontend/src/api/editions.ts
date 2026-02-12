import { apiClient } from './client';
import type {
  ClosureCheckResponse,
  Edition,
  EditionListResponse,
  CreateEditionRequest,
  UpdateEditionRequest,
  EditionStatus,
} from '@/types';

/**
 * API response type after Axios interceptor transforms keys to camelCase.
 * Note: commissionRate comes as string from backend (Decimal serialization).
 */
interface EditionApiResponse {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  status: string;
  startDatetime: string;
  endDatetime: string;
  declarationDeadline: string | null;
  depositStartDatetime: string | null;
  depositEndDatetime: string | null;
  saleStartDatetime: string | null;
  saleEndDatetime: string | null;
  retrievalStartDatetime: string | null;
  retrievalEndDatetime: string | null;
  commissionRate: string | null;  // Decimal is serialized as string by Pydantic
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  closedAt: string | null;
  closedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  archivedAt: string | null;
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
 * Axios interceptor already converts snake_case to camelCase,
 * we just need to parse commissionRate from string to number.
 */
function transformEdition(data: EditionApiResponse): Edition {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    location: data.location,
    status: data.status as EditionStatus,
    startDatetime: data.startDatetime,
    endDatetime: data.endDatetime,
    declarationDeadline: data.declarationDeadline,
    depositStartDatetime: data.depositStartDatetime,
    depositEndDatetime: data.depositEndDatetime,
    saleStartDatetime: data.saleStartDatetime,
    saleEndDatetime: data.saleEndDatetime,
    retrievalStartDatetime: data.retrievalStartDatetime,
    retrievalEndDatetime: data.retrievalEndDatetime,
    commissionRate: data.commissionRate !== null ? parseFloat(data.commissionRate) : null,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
    closedAt: data.closedAt,
    closedBy: data.closedBy,
    archivedAt: data.archivedAt,
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

  getClosureCheck: async (editionId: string): Promise<ClosureCheckResponse> => {
    const response = await apiClient.get<ClosureCheckResponse>(`/v1/editions/${editionId}/closure-check`);
    return response.data;
  },

  closeEdition: async (editionId: string): Promise<Edition> => {
    const response = await apiClient.post<EditionApiResponse>(`/v1/editions/${editionId}/close`);
    return transformEdition(response.data);
  },

  archiveEdition: async (editionId: string): Promise<Edition> => {
    const response = await apiClient.post<EditionApiResponse>(`/v1/editions/${editionId}/archive`);
    return transformEdition(response.data);
  },

  /**
   * Get the currently active edition (public, no auth required).
   */
  getActiveEdition: async (): Promise<Edition | null> => {
    const response = await apiClient.get<{ activeEdition: EditionApiResponse | null }>('/v1/config/active-edition');
    if (!response.data.activeEdition) return null;
    return transformEdition(response.data.activeEdition);
  },
};
