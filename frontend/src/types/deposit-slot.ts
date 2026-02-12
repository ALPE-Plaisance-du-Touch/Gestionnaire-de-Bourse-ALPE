/**
 * Deposit slot types for time slots when depositors can bring items.
 */

export interface DepositSlot {
  id: string;
  editionId: string;
  startDatetime: string;
  endDatetime: string;
  maxCapacity: number;
  reservedForLocals: boolean;
  description: string | null;
  registeredCount: number;
  createdAt: string;
}

export interface CreateDepositSlotRequest {
  startDatetime: string;
  endDatetime: string;
  maxCapacity?: number;
  reservedForLocals?: boolean;
  description?: string;
}

export interface UpdateDepositSlotRequest {
  startDatetime?: string;
  endDatetime?: string;
  maxCapacity?: number;
  reservedForLocals?: boolean;
  description?: string;
}

export interface DepositSlotListResponse {
  items: DepositSlot[];
  total: number;
}
