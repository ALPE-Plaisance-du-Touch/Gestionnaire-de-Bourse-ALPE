/**
 * Ticket messaging types.
 */

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  editionId: string;
  subject: string;
  status: 'open' | 'closed';
  createdById: string;
  createdByName: string;
  assignedToId: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface CreateTicketRequest {
  subject: string;
  content: string;
  assigned_to_id?: string | null;
}

export interface CreateMessageRequest {
  content: string;
}
