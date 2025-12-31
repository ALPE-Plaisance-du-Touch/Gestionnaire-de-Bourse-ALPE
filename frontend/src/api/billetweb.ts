import { apiClient } from './client';
import type {
  BilletwebPreviewResponse,
  BilletwebImportResponse,
  BilletwebImportOptions,
  EditionDepositorsListResponse,
  BilletwebImportLog,
  BilletwebImportStats,
  ListType,
} from '@/types';

/**
 * Billetweb import API endpoints.
 */
export const billetwebApi = {
  /**
   * Preview a Billetweb import file.
   * Validates the file and returns statistics and errors without importing.
   */
  previewImport: async (
    editionId: string,
    file: File
  ): Promise<BilletwebPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<BilletwebPreviewResponse>(
      `/v1/editions/${editionId}/billetweb/preview`,
      formData
    );
    return response.data;
  },

  /**
   * Import depositors from a Billetweb file.
   */
  importFile: async (
    editionId: string,
    file: File,
    options?: BilletwebImportOptions
  ): Promise<BilletwebImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (options?.ignoreErrors !== undefined) {
      params.append('ignore_errors', String(options.ignoreErrors));
    }
    if (options?.sendEmails !== undefined) {
      params.append('send_emails', String(options.sendEmails));
    }

    const url = `/v1/editions/${editionId}/billetweb/import${params.toString() ? '?' + params.toString() : ''}`;

    const response = await apiClient.post<BilletwebImportResponse>(
      url,
      formData
    );
    return response.data;
  },

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
};
