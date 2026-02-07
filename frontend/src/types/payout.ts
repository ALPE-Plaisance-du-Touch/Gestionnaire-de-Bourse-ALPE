/**
 * Payout management types.
 */

export interface PayoutResponse {
  id: string;
  itemListId: string;
  listNumber: number;
  listType: string;
  depositorId: string;
  depositorName: string;
  grossAmount: number;
  commissionAmount: number;
  listFees: number;
  netAmount: number;
  totalArticles: number;
  soldArticles: number;
  unsoldArticles: number;
  status: string;
  paymentMethod: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  notes: string | null;
  processedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPayoutsResponse {
  items: PayoutResponse[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface CalculatePayoutsResult {
  totalDepositors: number;
  totalPayouts: number;
  totalSales: number;
  totalCommission: number;
  totalListFees: number;
  totalNet: number;
}

export interface PayoutStats {
  totalSales: number;
  totalCommission: number;
  totalListFees: number;
  totalNet: number;
  totalPayouts: number;
  payoutsPending: number;
  payoutsReady: number;
  payoutsPaid: number;
  payoutsCancelled: number;
  totalArticles: number;
  soldArticles: number;
  unsoldArticles: number;
  sellThroughRate: number;
  paymentProgressPercent: number;
}

export interface RecordPaymentRequest {
  payment_method: 'cash' | 'check' | 'transfer';
  payment_reference?: string | null;
  notes?: string | null;
}

export interface UpdatePayoutNotesRequest {
  notes?: string | null;
  is_absent: boolean;
}
