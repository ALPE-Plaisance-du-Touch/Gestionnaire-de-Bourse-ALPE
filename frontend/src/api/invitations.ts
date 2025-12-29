import { apiClient } from './client';
import type {
  Invitation,
  InvitationCreateRequest,
  InvitationCreateResponse,
  BulkInvitationResult,
  InvitationResendResponse,
  InvitationStatusFilter,
} from '@/types';

/**
 * Invitations API endpoints.
 */
export const invitationsApi = {
  /**
   * List invitations with optional status filter.
   * @param status - Filter by status: 'pending' or 'expired'
   */
  getInvitations: async (status?: InvitationStatusFilter): Promise<Invitation[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<Invitation[]>('/v1/invitations', { params });
    return response.data;
  },

  /**
   * Create a single invitation.
   */
  createInvitation: async (data: InvitationCreateRequest): Promise<InvitationCreateResponse> => {
    const response = await apiClient.post<InvitationCreateResponse>('/v1/invitations', {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      list_type: data.listType || 'standard',
    });
    return response.data;
  },

  /**
   * Create multiple invitations at once.
   */
  createBulkInvitations: async (
    invitations: InvitationCreateRequest[]
  ): Promise<BulkInvitationResult> => {
    const payload = invitations.map((inv) => ({
      email: inv.email,
      first_name: inv.firstName,
      last_name: inv.lastName,
      list_type: inv.listType || 'standard',
    }));
    const response = await apiClient.post<BulkInvitationResult>('/v1/invitations/bulk', payload);
    return response.data;
  },

  /**
   * Resend an invitation with a new token.
   */
  resendInvitation: async (invitationId: string): Promise<InvitationResendResponse> => {
    const response = await apiClient.post<InvitationResendResponse>(
      `/v1/invitations/${invitationId}/resend`
    );
    return response.data;
  },
};
