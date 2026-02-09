"""Pydantic schemas for sales and checkout."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ScanRequest(BaseModel):
    barcode: str


class ScanArticleResponse(BaseModel):
    article_id: str
    barcode: str
    description: str
    category: str
    size: str | None = None
    price: Decimal
    brand: str | None = None
    is_lot: bool
    lot_quantity: int | None = None
    list_number: int
    depositor_name: str
    label_color: str | None = None
    status: str
    is_available: bool


class RegisterSaleRequest(BaseModel):
    article_id: str
    payment_method: str  # cash, card, check
    register_number: int = 1


class SaleResponse(BaseModel):
    id: str
    article_id: str
    article_description: str
    article_barcode: str
    price: Decimal
    payment_method: str
    register_number: int
    sold_at: datetime
    seller_name: str
    depositor_name: str
    list_number: int
    can_cancel: bool


class CatalogArticleResponse(BaseModel):
    article_id: str
    barcode: str
    description: str
    category: str
    size: str | None = None
    price: Decimal
    brand: str | None = None
    is_lot: bool
    lot_quantity: int | None = None
    list_number: int
    depositor_name: str
    label_color: str | None = None


class OfflineSaleItem(BaseModel):
    client_id: str
    article_id: str
    payment_method: str
    register_number: int = 1
    sold_at: datetime


class SyncSalesRequest(BaseModel):
    sales: list[OfflineSaleItem]


class SyncSaleResult(BaseModel):
    client_id: str
    status: str  # "synced" | "conflict" | "error"
    server_sale_id: str | None = None
    error_message: str | None = None


class SyncSalesResponse(BaseModel):
    synced: int
    conflicts: int
    errors: int
    results: list[SyncSaleResult]


class CancelSaleRequest(BaseModel):
    reason: str | None = None


class TopDepositorStats(BaseModel):
    depositor_name: str
    articles_sold: int
    total_revenue: Decimal


class SaleStatsResponse(BaseModel):
    total_articles_sold: int
    total_revenue: Decimal
    revenue_cash: Decimal
    revenue_card: Decimal
    revenue_check: Decimal
    articles_on_sale: int
    sell_through_rate: float
    top_depositors: list[TopDepositorStats]
