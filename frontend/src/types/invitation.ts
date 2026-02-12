/**
 * Invitation types for API requests and responses.
 */

export type InvitationStatus = 'pending' | 'sent' | 'activated' | 'expired' | 'cancelled';

export type ListType = 'standard' | 'list_1000' | 'list_2000';

export interface Invitation {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string | null; // null for activated users
  usedAt: string | null; // activation date for activated users
}

export interface InvitationCreateRequest {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  listType?: ListType;
}

export interface InvitationCreateResponse extends Invitation {}

export interface BulkInvitationResult {
  total: number;
  created: number;
  duplicates: number;
  errors: BulkInvitationError[];
}

export interface BulkInvitationError {
  email: string;
  error: string;
}

export interface InvitationResendResponse {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  message: string;
}

export type InvitationStatusFilter = 'pending' | 'expired' | 'activated';

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkDeleteResult {
  total: number;
  deleted: number;
  notFound: number;
}

export interface BulkResendResult {
  total: number;
  resent: number;
  skipped: number;
}

export interface DepositorLookup {
  found: boolean;
  firstName?: string;
  lastName?: string;
  participationCount?: number;
  lastEditionName?: string;
  preferredListType?: string;
}
