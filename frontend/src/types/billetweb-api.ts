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
