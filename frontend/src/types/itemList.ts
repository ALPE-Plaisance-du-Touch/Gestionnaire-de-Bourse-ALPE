/**
 * ItemList (depositor list) types.
 */

import type { Article } from './article';

export type ListType = 'standard' | 'list_1000' | 'list_2000';

export type ListStatus =
  | 'draft'
  | 'validated'
  | 'checked_in'
  | 'retrieved'
  | 'payout_pending'
  | 'payout_completed';

export type LabelColor =
  | 'sky_blue'
  | 'yellow'
  | 'fuchsia'
  | 'lilac'
  | 'mint_green'
  | 'orange'
  | 'white'
  | 'pink';

export interface ItemList {
  id: string;
  number: number;
  listType: ListType;
  labelColor: LabelColor | null;
  status: ListStatus;
  isValidated: boolean;
  validatedAt: string | null;
  checkedInAt: string | null;
  retrievedAt: string | null;
  labelsPrinted: boolean;
  labelsPrintedAt: string | null;
  editionId: string;
  depositorId: string;
  articleCount: number;
  clothingCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Item list with articles for detail view.
 */
export interface ItemListDetail extends ItemList {
  articles: Article[];
}

/**
 * Summary for list overview.
 */
export interface ItemListSummary {
  id: string;
  number: number;
  listType: ListType;
  status: ListStatus;
  articleCount: number;
  clothingCount: number;
  totalValue: number;
  isValidated: boolean;
  validatedAt: string | null;
  createdAt: string;
}

/**
 * Request to create a new list.
 */
export interface CreateItemListRequest {
  listType?: ListType;
}

/**
 * Request to validate a list.
 */
export interface ValidateItemListRequest {
  confirmationAccepted: boolean;
}

/**
 * Response for depositor's lists.
 */
export interface DepositorListsResponse {
  lists: ItemListSummary[];
  maxLists: number;
  canCreateMore: boolean;
}
