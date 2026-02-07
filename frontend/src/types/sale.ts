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
}

export interface TopDepositorStats {
  depositorName: string;
  articlesSold: number;
  totalRevenue: number;
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
