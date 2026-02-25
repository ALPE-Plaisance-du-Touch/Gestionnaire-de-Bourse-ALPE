import { apiClient } from './client';

export interface DeclarationsSummary {
  totalDepositors: number;
  depositorsWithLists: number;
  totalLists: number;
  draftLists: number;
  validatedLists: number;
  totalArticles: number;
  totalValue: number;
  depositorsNone: number;
  depositorsStarted: number;
  depositorsPartial: number;
  depositorsComplete: number;
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

export type DepositorDeclarationStatus = 'none' | 'started' | 'partial' | 'complete';

export interface DepositorDeclarationInfo {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  listType: string;
  listsCount: number;
  draftCount: number;
  validatedCount: number;
  totalArticles: number;
  totalValue: number;
  declarationStatus: DepositorDeclarationStatus;
}

export interface DepositorDeclarationsListResponse {
  items: DepositorDeclarationInfo[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  countNone: number;
  countStarted: number;
  countPartial: number;
  countComplete: number;
}

export interface DeclarationReminderResponse {
  emailsQueued: number;
  message: string;
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

  getDepositors: async (
    editionId: string,
    params?: { page?: number; limit?: number; status?: DepositorDeclarationStatus },
  ): Promise<DepositorDeclarationsListResponse> => {
    const queryParams: Record<string, string | number> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.status) queryParams.status = params.status;
    const response = await apiClient.get(`/v1/editions/${editionId}/declarations/depositors`, {
      params: queryParams,
    });
    return response.data;
  },

  sendReminders: async (
    editionId: string,
    depositorIds?: string[],
  ): Promise<DeclarationReminderResponse> => {
    const response = await apiClient.post(`/v1/editions/${editionId}/declarations/remind`, {
      depositor_ids: depositorIds ?? [],
    });
    return response.data;
  },
};
