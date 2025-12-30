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
  saleStartDatetime: string | null;
  saleEndDatetime: string | null;
  retrievalStartDatetime: string | null;
  retrievalEndDatetime: string | null;
  commissionRate: number | null;
  createdAt: string;
  createdBy: EditionCreator | null;
}

export interface CreateEditionRequest {
  name: string;
  startDatetime: string;
  endDatetime: string;
  location?: string;
  description?: string;
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
  saleStartDatetime?: string;
  saleEndDatetime?: string;
  retrievalStartDatetime?: string;
  retrievalEndDatetime?: string;
  commissionRate?: number;
}

export interface EditionListResponse {
  items: Edition[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
