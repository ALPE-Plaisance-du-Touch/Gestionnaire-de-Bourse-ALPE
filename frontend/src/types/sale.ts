/**
 * Sale and checkout types.
 */

export interface ScanArticleResponse {
  articleId: string;
  barcode: string;
  description: string;
  category: string;
  size: string | null;
  price: number;
  brand: string | null;
  isLot: boolean;
  lotQuantity: number | null;
  listNumber: number;
  depositorName: string;
  labelColor: string | null;
  status: string;
  isAvailable: boolean;
}

export interface RegisterSaleRequest {
  articleId: string;
  paymentMethod: 'cash' | 'card' | 'check';
  registerNumber?: number;
}

export interface SaleResponse {
  id: string;
  articleId: string;
  articleDescription: string;
  articleBarcode: string;
  price: number;
  paymentMethod: string;
  registerNumber: number;
  soldAt: string;
  sellerName: string;
  depositorName: string;
  listNumber: number;
  canCancel: boolean;
  isPrivateSale: boolean;
  ticketId: string | null;
}

export interface BatchSaleItem {
  articleId: string;
}

export interface RegisterBatchSalesRequest {
  articles: BatchSaleItem[];
  paymentMethod: 'cash' | 'card' | 'check';
  registerNumber?: number;
}

export interface BatchSalesResponse {
  ticketId: string;
  sales: SaleResponse[];
  total: number;
  articleCount: number;
}

export interface TopDepositorStats {
  depositorName: string;
  articlesSold: number;
  totalRevenue: number;
}

export interface OfflineSaleDisplay {
  id: string;
  articleId: string;
  articleDescription: string;
  articleBarcode: string;
  price: number;
  paymentMethod: string;
  soldAt: string;
  depositorName: string;
  listNumber: number;
  isOffline: true;
}

export interface SaleStats {
  totalArticlesSold: number;
  totalRevenue: number;
  revenueCash: number;
  revenueCard: number;
  revenueCheck: number;
  articlesOnSale: number;
  sellThroughRate: number;
  topDepositors: TopDepositorStats[];
}
