import { apiClient } from './client';
import type {
  BilletwebCredentialsRequest,
  BilletwebCredentialsResponse,
  BilletwebConnectionTestResponse,
} from '@/types';

export const billetwebApiSettings = {
  getConfig: async (): Promise<BilletwebCredentialsResponse> => {
    const response = await apiClient.get<BilletwebCredentialsResponse>(
      '/v1/settings/billetweb'
    );
    return response.data;
  },

  saveConfig: async (
    data: BilletwebCredentialsRequest
  ): Promise<BilletwebCredentialsResponse> => {
    const response = await apiClient.put<BilletwebCredentialsResponse>(
      '/v1/settings/billetweb',
      data
    );
    return response.data;
  },

  testConnection: async (): Promise<BilletwebConnectionTestResponse> => {
    const response = await apiClient.post<BilletwebConnectionTestResponse>(
      '/v1/settings/billetweb/test'
    );
    return response.data;
  },
};
