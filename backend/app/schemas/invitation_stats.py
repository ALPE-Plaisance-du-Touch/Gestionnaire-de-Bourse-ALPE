"""Pydantic schemas for invitation statistics."""

from pydantic import BaseModel


class InvitationDailyStats(BaseModel):
    date: str
    sent: int
    activated: int


class InvitationByListType(BaseModel):
    list_type: str
    count: int
    percentage: float


class InvitationStatsResponse(BaseModel):
    total: int
    activated: int
    pending: int
    expired: int
    activation_rate: float
    avg_activation_delay_days: float
    expiration_rate: float
    relaunch_count: int
    activated_after_relaunch: int
    by_list_type: list[InvitationByListType]
    daily_evolution: list[InvitationDailyStats]
