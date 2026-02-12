import { apiClient } from './client';
import type {
  BilletwebCredentialsRequest,
  BilletwebCredentialsResponse,
  BilletwebConnectionTestResponse,
  BilletwebEventsListResponse,
  BilletwebSessionsPreviewResponse,
  BilletwebSessionsSyncResult,
  BilletwebAttendeesPreviewResponse,
  BilletwebAttendeesSyncResult,
} from '@/types';

export const billetwebApiSettings = {
  getConfig: async (): Promise<BilletwebCredentialsResponse> => {
    const response = await apiClient.get<BilletwebCredentialsResponse>(
      '/v1/settings/billetweb'
    );
    return response.data;
  },

  saveConfig: async (
    data: BilletwebCredentialsRequest
  ): Promise<BilletwebCredentialsResponse> => {
    const response = await apiClient.put<BilletwebCredentialsResponse>(
      '/v1/settings/billetweb',
      data
    );
    return response.data;
  },

  testConnection: async (): Promise<BilletwebConnectionTestResponse> => {
    const response = await apiClient.post<BilletwebConnectionTestResponse>(
      '/v1/settings/billetweb/test'
    );
    return response.data;
  },

  listEvents: async (): Promise<BilletwebEventsListResponse> => {
    const response = await apiClient.get<BilletwebEventsListResponse>(
      '/v1/settings/billetweb/events'
    );
    return response.data;
  },

  previewSessionsSync: async (editionId: string): Promise<BilletwebSessionsPreviewResponse> => {
    const response = await apiClient.get<BilletwebSessionsPreviewResponse>(
      `/v1/editions/${editionId}/billetweb-api/sessions/preview`
    );
    return response.data;
  },

  syncSessions: async (editionId: string): Promise<BilletwebSessionsSyncResult> => {
    const response = await apiClient.post<BilletwebSessionsSyncResult>(
      `/v1/editions/${editionId}/billetweb-api/sessions/sync`
    );
    return response.data;
  },

  previewAttendeesSync: async (editionId: string): Promise<BilletwebAttendeesPreviewResponse> => {
    const response = await apiClient.get<BilletwebAttendeesPreviewResponse>(
      `/v1/editions/${editionId}/billetweb-api/attendees/preview`
    );
    return response.data;
  },

  syncAttendees: async (editionId: string, sendEmails: boolean = true): Promise<BilletwebAttendeesSyncResult> => {
    const response = await apiClient.post<BilletwebAttendeesSyncResult>(
      `/v1/editions/${editionId}/billetweb-api/attendees/import`,
      { send_emails: sendEmails }
    );
    return response.data;
  },
};
