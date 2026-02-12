import { apiClient } from './client';
import type { User, UserProfileUpdate, UserAdminUpdate, UserListParams, PaginatedUsers } from '@/types';

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

  listUsers: async (params: UserListParams = {}): Promise<PaginatedUsers> => {
    const response = await apiClient.get('/v1/users/', {
      params: {
        role: params.role || undefined,
        search: params.search || undefined,
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });
    return response.data as PaginatedUsers;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`/v1/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, data: UserAdminUpdate): Promise<User> => {
    const response = await apiClient.patch<User>(`/v1/users/${userId}`, data);
    return response.data;
  },
};
