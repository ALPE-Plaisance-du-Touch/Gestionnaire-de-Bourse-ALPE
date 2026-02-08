export interface CategoryStats {
  category: string;
  totalArticles: number;
  soldArticles: number;
  sellThroughRate: number;
  totalRevenue: number;
}

export interface PriceRangeStats {
  range: string;
  count: number;
}

export interface DashboardTopDepositor {
  depositorName: string;
  articlesSold: number;
  totalRevenue: number;
}

export interface PayoutDashboardData {
  totalSales: number;
  totalCommission: number;
  totalListFees: number;
  totalNet: number;
  totalArticles: number;
  soldArticles: number;
  unsoldArticles: number;
  sellThroughRate: number;
  totalPayouts: number;
  payoutsPaid: number;
  paymentProgressPercent: number;
  categoryStats: CategoryStats[];
  topDepositors: DashboardTopDepositor[];
  priceDistribution: PriceRangeStats[];
}

export interface InvitationDailyStats {
  date: string;
  sent: number;
  activated: number;
}

export interface InvitationByListType {
  listType: string;
  count: number;
  percentage: number;
}

export interface InvitationStatsData {
  total: number;
  activated: number;
  pending: number;
  expired: number;
  activationRate: number;
  avgActivationDelayDays: number;
  expirationRate: number;
  relaunchCount: number;
  activatedAfterRelaunch: number;
  byListType: InvitationByListType[];
  dailyEvolution: InvitationDailyStats[];
}
