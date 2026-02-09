import { apiClient } from './client';
import type { User, UserProfileUpdate } from '@/types';

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/v1/users/me');
    return response.data;
  },

  updateProfile: async (data: UserProfileUpdate): Promise<User> => {
    const response = await apiClient.patch<User>('/v1/users/me', data);
    return response.data;
  },

  exportData: async (): Promise<Blob> => {
    const response = await apiClient.get('/v1/users/me/export', {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/v1/users/me');
  },
};
