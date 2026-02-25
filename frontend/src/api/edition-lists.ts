import { apiClient } from './client';

export interface DeclarationsSummary {
  totalDepositors: number;
  depositorsWithLists: number;
  totalLists: number;
  draftLists: number;
  validatedLists: number;
  totalArticles: number;
  totalValue: number;
}

export interface DepositorInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface DeclarationListItem {
  id: string;
  number: number;
  listType: string;
  labelColor: string | null;
  status: string;
  isValidated: boolean;
  validatedAt: string | null;
  articleCount: number;
  clothingCount: number;
  totalValue: number;
  editionId: string;
  depositorId: string;
  depositor: DepositorInfo | null;
  createdAt: string;
}

export interface DeclarationListsResponse {
  items: DeclarationListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const editionListsApi = {
  getLists: async (
    editionId: string,
    params?: { page?: number; limit?: number; listType?: string; status?: string },
  ): Promise<DeclarationListsResponse> => {
    const queryParams: Record<string, string | number> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.listType) queryParams.list_type = params.listType;
    if (params?.status) queryParams.status = params.status;
    const response = await apiClient.get(`/v1/editions/${editionId}/declarations/lists`, {
      params: queryParams,
    });
    return response.data;
  },

  getSummary: async (editionId: string): Promise<DeclarationsSummary> => {
    const response = await apiClient.get(`/v1/editions/${editionId}/declarations/summary`);
    return response.data;
  },
};
