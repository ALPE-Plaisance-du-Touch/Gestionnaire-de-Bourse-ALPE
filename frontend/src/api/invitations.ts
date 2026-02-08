import { apiClient } from './client';
import type {
  Invitation,
  InvitationCreateRequest,
  InvitationCreateResponse,
  BulkInvitationResult,
  BulkDeleteResult,
  InvitationResendResponse,
  InvitationStatusFilter,
  InvitationStatsData,
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

  /**
   * Delete an invitation.
   * For pending invitations: invalidates the token and deletes the user.
   * For activated users: clears invitation data but preserves the user account.
   */
  deleteInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.delete(`/v1/invitations/${invitationId}`);
  },

  /**
   * Delete multiple invitations at once.
   * @param ids - Array of invitation IDs to delete
   */
  bulkDeleteInvitations: async (ids: string[]): Promise<BulkDeleteResult> => {
    const response = await apiClient.post<{ total: number; deleted: number; not_found: number }>(
      '/v1/invitations/bulk-delete',
      { ids }
    );
    return {
      total: response.data.total,
      deleted: response.data.deleted,
      notFound: response.data.not_found,
    };
  },

  getStats: async (): Promise<InvitationStatsData> => {
    const response = await apiClient.get('/v1/invitations/stats');
    return response.data as InvitationStatsData;
  },

  exportExcel: async (): Promise<Blob> => {
    const response = await apiClient.get(
      '/v1/invitations/export-excel',
      { responseType: 'blob', timeout: 60000 },
    );
    return response.data as Blob;
  },
};
