import { apiClient } from './client';
import type {
  Ticket,
  TicketDetail,
  TicketListResponse,
  TicketMessage,
  UnreadCountResponse,
  CreateTicketRequest,
  CreateMessageRequest,
} from '@/types';

interface ListTicketsParams {
  status?: 'open' | 'closed';
  page?: number;
  perPage?: number;
}

export const ticketsApi = {
  createTicket: async (editionId: string, data: CreateTicketRequest): Promise<TicketDetail> => {
    const response = await apiClient.post(
      `/v1/editions/${editionId}/tickets`,
      data,
    );
    return response.data as TicketDetail;
  },

  listTickets: async (editionId: string, params: ListTicketsParams = {}): Promise<TicketListResponse> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/tickets`,
      { params },
    );
    return response.data as TicketListResponse;
  },

  getTicket: async (editionId: string, ticketId: string): Promise<TicketDetail> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/tickets/${ticketId}`,
    );
    return response.data as TicketDetail;
  },

  replyToTicket: async (editionId: string, ticketId: string, data: CreateMessageRequest): Promise<TicketMessage> => {
    const response = await apiClient.post(
      `/v1/editions/${editionId}/tickets/${ticketId}/messages`,
      data,
    );
    return response.data as TicketMessage;
  },

  closeTicket: async (editionId: string, ticketId: string): Promise<Ticket> => {
    const response = await apiClient.patch(
      `/v1/editions/${editionId}/tickets/${ticketId}/close`,
    );
    return response.data as Ticket;
  },

  reopenTicket: async (editionId: string, ticketId: string): Promise<Ticket> => {
    const response = await apiClient.patch(
      `/v1/editions/${editionId}/tickets/${ticketId}/reopen`,
    );
    return response.data as Ticket;
  },

  getUnreadCount: async (editionId: string): Promise<UnreadCountResponse> => {
    const response = await apiClient.get(
      `/v1/editions/${editionId}/tickets/unread-count`,
    );
    return response.data as UnreadCountResponse;
  },
};
