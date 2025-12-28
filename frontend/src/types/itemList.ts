/**
 * ItemList (depositor list) types.
 */

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

export interface CreateItemListRequest {
  editionId: string;
  listType?: ListType;
}
