import { apiClient } from './client';
import type { LabelGenerationRequest, LabelStats } from '@/types';

export const labelsApi = {
  generateLabels: async (
    editionId: string,
    request: LabelGenerationRequest,
  ): Promise<Blob> => {
    // Build snake_case payload manually since blob responseType
    // bypasses the normal interceptor chain for the response
    const payload: Record<string, unknown> = { mode: request.mode };
    if (request.slotId) payload.slot_id = request.slotId;
    if (request.depositorIds) payload.depositor_ids = request.depositorIds;

    const response = await apiClient.post(
      `/v1/editions/${editionId}/labels/generate`,
      payload,
      { responseType: 'blob', timeout: 120000 },
    );
    return response.data as Blob;
  },

  getStats: async (editionId: string): Promise<LabelStats> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/labels/stats`,
    );
    return response.data as LabelStats;
  },
};
