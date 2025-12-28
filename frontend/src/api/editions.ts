import { apiClient } from './client';
import type {
  Edition,
  CreateEditionRequest,
  UpdateEditionRequest,
  PaginatedResponse,
} from '@/types';

/**
 * Editions API endpoints.
 */
export const editionsApi = {
  /**
   * Get all editions with pagination.
   */
  getAll: async (page = 1, pageSize = 20): Promise<PaginatedResponse<Edition>> => {
    const response = await apiClient.get<PaginatedResponse<Edition>>('/v1/editions', {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get active edition (currently in progress or registrations open).
   */
  getActive: async (): Promise<Edition | null> => {
    const response = await apiClient.get<Edition | null>('/v1/editions/active');
    return response.data;
  },

  /**
   * Get edition by ID.
   */
  getById: async (id: string): Promise<Edition> => {
    const response = await apiClient.get<Edition>(`/v1/editions/${id}`);
    return response.data;
  },

  /**
   * Create new edition.
   */
  create: async (data: CreateEditionRequest): Promise<Edition> => {
    const response = await apiClient.post<Edition>('/v1/editions', data);
    return response.data;
  },

  /**
   * Update edition.
   */
  update: async (id: string, data: UpdateEditionRequest): Promise<Edition> => {
    const response = await apiClient.patch<Edition>(`/v1/editions/${id}`, data);
    return response.data;
  },

  /**
   * Delete edition (only if in draft status).
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/editions/${id}`);
  },

  /**
   * Transition edition to next status.
   */
  transition: async (id: string, action: string): Promise<Edition> => {
    const response = await apiClient.post<Edition>(
      `/v1/editions/${id}/transition`,
      { action }
    );
    return response.data;
  },
};
