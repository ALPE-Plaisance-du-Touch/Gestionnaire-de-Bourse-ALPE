export interface BilletwebCredentialsRequest {
  user: string;
  api_key: string;
}

export interface BilletwebCredentialsResponse {
  configured: boolean;
  user: string | null;
  apiKeyMasked: string | null;
}

export interface BilletwebConnectionTestResponse {
  success: boolean;
  message: string;
}

export interface BilletwebEventInfo {
  id: string;
  name: string;
  start: string;
  end: string;
  location: string;
}

export interface BilletwebEventsListResponse {
  events: BilletwebEventInfo[];
}

export interface BilletwebSessionPreview {
  sessionId: string;
  name: string;
  start: string;
  end: string;
  capacity: number;
  sold: number;
  alreadySynced: boolean;
}

export interface BilletwebSessionsPreviewResponse {
  totalSessions: number;
  newSessions: number;
  sessions: BilletwebSessionPreview[];
}

export interface BilletwebSessionsSyncResult {
  created: number;
  updated: number;
  total: number;
}
