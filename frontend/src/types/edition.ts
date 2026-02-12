/**
 * Edition (sale event) types.
 */

export type EditionStatus =
  | 'draft'
  | 'configured'
  | 'registrations_open'
  | 'in_progress'
  | 'closed'
  | 'archived';

export interface EditionCreator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Edition {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  status: EditionStatus;
  startDatetime: string;
  endDatetime: string;
  declarationDeadline: string | null;
  depositStartDatetime: string | null;
  depositEndDatetime: string | null;
  retrievalStartDatetime: string | null;
  retrievalEndDatetime: string | null;
  commissionRate: number | null;
  createdAt: string;
  createdBy: EditionCreator | null;
  billetwebEventId: string | null;
  lastBilletwebSync: string | null;
  closedAt: string | null;
  closedBy: EditionCreator | null;
  archivedAt: string | null;
}

export interface CreateEditionRequest {
  name: string;
  startDatetime: string;
  endDatetime: string;
  location?: string;
  description?: string;
  billetwebEventId?: string;
}

export interface UpdateEditionRequest {
  name?: string;
  description?: string;
  location?: string;
  startDatetime?: string;
  endDatetime?: string;
  declarationDeadline?: string;
  depositStartDatetime?: string;
  depositEndDatetime?: string;
  retrievalStartDatetime?: string;
  retrievalEndDatetime?: string;
  commissionRate?: number;
}

export interface ClosureCheckItem {
  label: string;
  passed: boolean;
  detail: string | null;
}

export interface ClosureCheckResponse {
  canClose: boolean;
  checks: ClosureCheckItem[];
}

export interface EditionListResponse {
  items: Edition[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
