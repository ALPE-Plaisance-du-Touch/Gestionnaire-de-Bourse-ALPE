import { apiClient } from './client';
import type {
  DepositSlot,
  DepositSlotListResponse,
  CreateDepositSlotRequest,
  UpdateDepositSlotRequest,
} from '@/types';

/**
 * API response type (snake_case from backend).
 */
interface DepositSlotApiResponse {
  id: string;
  edition_id: string;
  start_datetime: string;
  end_datetime: string;
  max_capacity: number;
  reserved_for_locals: boolean;
  description: string | null;
  created_at: string;
}

interface DepositSlotListApiResponse {
  items: DepositSlotApiResponse[];
  total: number;
}

/**
 * Transform API response to frontend DepositSlot type.
 */
function transformDepositSlot(data: DepositSlotApiResponse): DepositSlot {
  return {
    id: data.id,
    editionId: data.edition_id,
    startDatetime: data.start_datetime,
    endDatetime: data.end_datetime,
    maxCapacity: data.max_capacity,
    reservedForLocals: data.reserved_for_locals,
    description: data.description,
    createdAt: data.created_at,
  };
}

/**
 * Deposit slots API endpoints.
 */
export const depositSlotsApi = {
  /**
   * List deposit slots for an edition.
   */
  getDepositSlots: async (editionId: string): Promise<DepositSlotListResponse> => {
    const response = await apiClient.get<DepositSlotListApiResponse>(
      `/v1/editions/${editionId}/deposit-slots`
    );
    return {
      items: response.data.items.map(transformDepositSlot),
      total: response.data.total,
    };
  },

  /**
   * Get a single deposit slot by ID.
   */
  getDepositSlot: async (editionId: string, slotId: string): Promise<DepositSlot> => {
    const response = await apiClient.get<DepositSlotApiResponse>(
      `/v1/editions/${editionId}/deposit-slots/${slotId}`
    );
    return transformDepositSlot(response.data);
  },

  /**
   * Create a new deposit slot.
   */
  createDepositSlot: async (
    editionId: string,
    data: CreateDepositSlotRequest
  ): Promise<DepositSlot> => {
    const response = await apiClient.post<DepositSlotApiResponse>(
      `/v1/editions/${editionId}/deposit-slots`,
      {
        start_datetime: data.startDatetime,
        end_datetime: data.endDatetime,
        max_capacity: data.maxCapacity ?? 20,
        reserved_for_locals: data.reservedForLocals ?? false,
        description: data.description,
      }
    );
    return transformDepositSlot(response.data);
  },

  /**
   * Update a deposit slot.
   */
  updateDepositSlot: async (
    editionId: string,
    slotId: string,
    data: UpdateDepositSlotRequest
  ): Promise<DepositSlot> => {
    const payload: Record<string, unknown> = {};

    if (data.startDatetime !== undefined) payload.start_datetime = data.startDatetime;
    if (data.endDatetime !== undefined) payload.end_datetime = data.endDatetime;
    if (data.maxCapacity !== undefined) payload.max_capacity = data.maxCapacity;
    if (data.reservedForLocals !== undefined) payload.reserved_for_locals = data.reservedForLocals;
    if (data.description !== undefined) payload.description = data.description;

    const response = await apiClient.put<DepositSlotApiResponse>(
      `/v1/editions/${editionId}/deposit-slots/${slotId}`,
      payload
    );
    return transformDepositSlot(response.data);
  },

  /**
   * Delete a deposit slot.
   */
  deleteDepositSlot: async (editionId: string, slotId: string): Promise<void> => {
    await apiClient.delete(`/v1/editions/${editionId}/deposit-slots/${slotId}`);
  },
};
