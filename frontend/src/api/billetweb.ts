import { apiClient } from './client';
import type {
  EditionDepositorsListResponse,
  EditionDepositorWithUser,
  ManualDepositorCreateRequest,
  BilletwebImportLog,
  BilletwebImportStats,
  ListType,
} from '@/types';

/**
 * Billetweb API endpoints.
 */
export const billetwebApi = {
  /**
   * List depositors for an edition.
   */
  listDepositors: async (
    editionId: string,
    params?: {
      listType?: ListType;
      slotId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<EditionDepositorsListResponse> => {
    const response = await apiClient.get<EditionDepositorsListResponse>(
      `/v1/editions/${editionId}/billetweb/depositors`,
      {
        params: {
          list_type: params?.listType,
          slot_id: params?.slotId,
          page: params?.page,
          limit: params?.limit,
        },
      }
    );
    return response.data;
  },

  /**
   * List import logs for an edition.
   */
  listImportLogs: async (
    editionId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<BilletwebImportLog[]> => {
    const response = await apiClient.get<BilletwebImportLog[]>(
      `/v1/editions/${editionId}/billetweb/import-logs`,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
        },
      }
    );
    return response.data;
  },

  /**
   * Get import statistics for an edition.
   */
  getImportStats: async (editionId: string): Promise<BilletwebImportStats> => {
    const response = await apiClient.get<BilletwebImportStats>(
      `/v1/editions/${editionId}/billetweb/stats`
    );
    return response.data;
  },

  createManualDepositor: async (
    editionId: string,
    request: ManualDepositorCreateRequest
  ): Promise<EditionDepositorWithUser> => {
    const response = await apiClient.post<EditionDepositorWithUser>(
      `/v1/editions/${editionId}/billetweb/depositors/manual`,
      {
        email: request.email,
        first_name: request.firstName,
        last_name: request.lastName,
        phone: request.phone,
        deposit_slot_id: request.depositSlotId,
        list_type: request.listType || 'standard',
        postal_code: request.postalCode,
        city: request.city,
      }
    );
    return response.data;
  },
};
