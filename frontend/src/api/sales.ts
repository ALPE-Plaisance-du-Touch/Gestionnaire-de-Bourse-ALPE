import { apiClient } from './client';
import type { ScanArticleResponse, RegisterSaleRequest, SaleResponse, SaleStats } from '@/types';

interface PaginatedSalesResponse {
  items: SaleResponse[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

interface ListSalesParams {
  page?: number;
  perPage?: number;
  paymentMethod?: string;
  registerNumber?: number;
}

export const salesApi = {
  scanArticle: async (editionId: string, barcode: string): Promise<ScanArticleResponse> => {
    const response = await apiClient.post(
      `/v1/editions/${editionId}/sales/scan`,
      { barcode },
    );
    return response.data as ScanArticleResponse;
  },

  registerSale: async (editionId: string, request: RegisterSaleRequest): Promise<SaleResponse> => {
    const response = await apiClient.post(
      `/v1/editions/${editionId}/sales`,
      request,
    );
    return response.data as SaleResponse;
  },

  listSales: async (editionId: string, params: ListSalesParams = {}): Promise<PaginatedSalesResponse> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/sales`,
      { params },
    );
    return response.data as PaginatedSalesResponse;
  },

  cancelSale: async (editionId: string, saleId: string, reason?: string): Promise<void> => {
    await apiClient.post(
      `/v1/editions/${editionId}/sales/${saleId}/cancel`,
      reason ? { reason } : {},
    );
  },

  getLiveStats: async (editionId: string): Promise<SaleStats> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/stats/sales-live`,
    );
    return response.data as SaleStats;
  },
};
