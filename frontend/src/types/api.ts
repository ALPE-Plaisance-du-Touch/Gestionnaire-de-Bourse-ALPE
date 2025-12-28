/**
 * Common API types and interfaces.
 */

/** API error response */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** API request status */
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
