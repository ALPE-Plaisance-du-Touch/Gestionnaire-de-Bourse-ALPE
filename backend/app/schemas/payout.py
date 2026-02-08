"""Pydantic schemas for payout calculation and management."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.sale import TopDepositorStats


class CalculatePayoutsResponse(BaseModel):
    total_depositors: int
    total_payouts: int
    total_sales: Decimal
    total_commission: Decimal
    total_list_fees: Decimal
    total_net: Decimal


class PayoutResponse(BaseModel):
    id: str
    item_list_id: str
    list_number: int
    list_type: str
    depositor_id: str
    depositor_name: str
    gross_amount: Decimal
    commission_amount: Decimal
    list_fees: Decimal
    net_amount: Decimal
    total_articles: int
    sold_articles: int
    unsold_articles: int
    status: str
    payment_method: str | None = None
    paid_at: datetime | None = None
    payment_reference: str | None = None
    notes: str | None = None
    processed_by_name: str | None = None
    created_at: datetime
    updated_at: datetime


class RecordPaymentRequest(BaseModel):
    payment_method: str  # cash, check, transfer
    payment_reference: str | None = None
    notes: str | None = None


class UpdatePayoutNotesRequest(BaseModel):
    notes: str | None = None
    is_absent: bool = False


class PayoutStatsResponse(BaseModel):
    total_sales: Decimal
    total_commission: Decimal
    total_list_fees: Decimal
    total_net: Decimal
    total_payouts: int
    payouts_pending: int
    payouts_ready: int
    payouts_paid: int
    payouts_cancelled: int
    total_articles: int
    sold_articles: int
    unsold_articles: int
    sell_through_rate: float
    payment_progress_percent: float


class CategoryStats(BaseModel):
    category: str
    total_articles: int
    sold_articles: int
    sell_through_rate: float
    total_revenue: Decimal


class PriceRangeStats(BaseModel):
    range: str
    count: int


class PayoutDashboardResponse(BaseModel):
    total_sales: Decimal
    total_commission: Decimal
    total_list_fees: Decimal
    total_net: Decimal
    total_articles: int
    sold_articles: int
    unsold_articles: int
    sell_through_rate: float
    total_payouts: int
    payouts_paid: int
    payment_progress_percent: float
    category_stats: list[CategoryStats]
    top_depositors: list[TopDepositorStats]
    price_distribution: list[PriceRangeStats]
