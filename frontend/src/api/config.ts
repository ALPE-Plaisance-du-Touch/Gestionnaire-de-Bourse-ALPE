import { apiClient } from './client';

interface SupportEmailResponse {
  supportEmail: string;
  source: string;
}

export const configApi = {
  getSupportEmail: async (): Promise<SupportEmailResponse> => {
    const response = await apiClient.get<SupportEmailResponse>('/v1/config/support-email');
    return response.data;
  },

  updateSupportEmail: async (supportEmail: string): Promise<SupportEmailResponse> => {
    const response = await apiClient.put<SupportEmailResponse>('/v1/config/support-email', {
      support_email: supportEmail,
    });
    return response.data;
  },
};
