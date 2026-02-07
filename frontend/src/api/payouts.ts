import { apiClient } from './client';
import type {
  CalculatePayoutsResult,
  PaginatedPayoutsResponse,
  PayoutResponse,
  PayoutStats,
  RecordPaymentRequest,
  UpdatePayoutNotesRequest,
} from '@/types';

interface ListPayoutsParams {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
}

export const payoutsApi = {
  calculatePayouts: async (editionId: string): Promise<CalculatePayoutsResult> => {
    const response = await apiClient.post(
      `/v1/editions/${editionId}/payouts/calculate`,
    );
    return response.data as CalculatePayoutsResult;
  },

  listPayouts: async (
    editionId: string,
    params: ListPayoutsParams = {},
  ): Promise<PaginatedPayoutsResponse> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/payouts`,
      { params },
    );
    return response.data as PaginatedPayoutsResponse;
  },

  getStats: async (editionId: string): Promise<PayoutStats> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/payouts/stats`,
    );
    return response.data as PayoutStats;
  },

  getDetail: async (editionId: string, payoutId: string): Promise<PayoutResponse> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/payouts/${payoutId}`,
    );
    return response.data as PayoutResponse;
  },

  downloadReceipt: async (editionId: string, payoutId: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/payouts/${payoutId}/receipt`,
      { responseType: 'blob', timeout: 60000 },
    );
    return response.data as Blob;
  },

  recordPayment: async (
    editionId: string,
    payoutId: string,
    request: RecordPaymentRequest,
  ): Promise<PayoutResponse> => {
    const response = await apiClient.post(
      `/v1/editions/${editionId}/payouts/${payoutId}/pay`,
      request,
    );
    return response.data as PayoutResponse;
  },

  updateNotes: async (
    editionId: string,
    payoutId: string,
    request: UpdatePayoutNotesRequest,
  ): Promise<PayoutResponse> => {
    const response = await apiClient.put(
      `/v1/editions/${editionId}/payouts/${payoutId}/notes`,
      request,
    );
    return response.data as PayoutResponse;
  },

  recalculate: async (editionId: string, payoutId: string): Promise<PayoutResponse> => {
    const response = await apiClient.post(
      `/v1/editions/${editionId}/payouts/${payoutId}/recalculate`,
    );
    return response.data as PayoutResponse;
  },

  downloadAllReceipts: async (editionId: string): Promise<Blob> => {
    const response = await apiClient.post(
      `/v1/editions/${editionId}/payouts/receipts`,
      {},
      { responseType: 'blob', timeout: 120000 },
    );
    return response.data as Blob;
  },
};
