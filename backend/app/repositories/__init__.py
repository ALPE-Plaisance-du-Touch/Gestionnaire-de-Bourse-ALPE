"""Data access repositories package."""

from app.repositories.deposit_slot import DepositSlotRepository
from app.repositories.edition import EditionRepository
from app.repositories.user import UserRepository

__all__ = [
    "DepositSlotRepository",
    "EditionRepository",
    "UserRepository",
]
