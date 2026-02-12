import { apiClient } from './client';

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  userId: string | null;
  userEmail: string | null;
  role: string | null;
  ipAddress: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  detail: string | null;
  result: string;
}

export interface AuditLogListResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuditLogFilters {
  action?: string;
  userId?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  list: async (filters: AuditLogFilters = {}): Promise<AuditLogListResponse> => {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.userId) params.append('user_id', filters.userId);
    if (filters.entityType) params.append('entity_type', filters.entityType);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<AuditLogListResponse>(
      `/v1/audit-logs?${params.toString()}`
    );
    return response.data;
  },
};
