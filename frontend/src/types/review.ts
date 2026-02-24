/**
 * Review types for deposit article verification (US-013).
 */

import type { Article } from './article';

export interface ReviewStats {
  pending: number;
  accepted: number;
  rejected: number;
}

export interface ReviewListItem {
  id: string;
  number: number;
  listType: string;
  status: string;
  depositorName: string;
  articleCount: number;
  reviewStats: ReviewStats;
  reviewedAt: string | null;
  reviewedByName: string | null;
}

export interface ReviewListDetail {
  id: string;
  number: number;
  listType: string;
  status: string;
  depositorId: string;
  depositorName: string;
  articles: Article[];
  reviewStats: ReviewStats;
  reviewedAt: string | null;
}

export interface ReviewSummary {
  totalLists: number;
  reviewedLists: number;
  pendingLists: number;
  totalArticles: number;
  acceptedArticles: number;
  rejectedArticles: number;
  pendingArticles: number;
}
