"""Detect whether a feature module already has data for an edition (#66).

Disabling a module that has already been used could orphan data, so the API
must refuse it. Each optional module maps to a query that returns True when
data exists for the edition. Modules with no meaningful "usage" signal (or
whose deactivation is harmless) are simply absent from the mapping.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article, ArticleStatus
from app.models.item_list import ItemList, ListType
from app.models.sale import Sale
from app.models.ticket import Ticket


async def _count(db: AsyncSession, stmt) -> int:
    result = await db.execute(stmt)
    return result.scalar_one()


async def _sales_used(db: AsyncSession, edition_id: str) -> bool:
    stmt = select(func.count()).select_from(Sale).where(Sale.edition_id == edition_id)
    return await _count(db, stmt) > 0


async def _review_used(db: AsyncSession, edition_id: str) -> bool:
    # Review is "used" once at least one article has been accepted or rejected.
    stmt = (
        select(func.count())
        .select_from(Article)
        .join(ItemList, Article.item_list_id == ItemList.id)
        .where(
            ItemList.edition_id == edition_id,
            Article.status.in_(
                [ArticleStatus.ACCEPTED.value, ArticleStatus.REJECTED.value]
            ),
        )
    )
    return await _count(db, stmt) > 0


async def _tickets_used(db: AsyncSession, edition_id: str) -> bool:
    stmt = (
        select(func.count()).select_from(Ticket).where(Ticket.edition_id == edition_id)
    )
    return await _count(db, stmt) > 0


async def _special_lists_used(db: AsyncSession, edition_id: str) -> bool:
    stmt = (
        select(func.count())
        .select_from(ItemList)
        .where(
            ItemList.edition_id == edition_id,
            ItemList.list_type.in_(
                [ListType.LIST_1000.value, ListType.LIST_2000.value]
            ),
        )
    )
    return await _count(db, stmt) > 0


# flag -> (async usage checker, human-readable reason)
_USAGE_CHECKS = {
    "sales_enabled": (_sales_used, "des ventes ont déjà été enregistrées"),
    "deposit_review_enabled": (_review_used, "des articles ont déjà été revus"),
    "tickets_enabled": (_tickets_used, "des messages ont déjà été échangés"),
    "special_lists_enabled": (
        _special_lists_used,
        "des listes 1000/2000 existent déjà",
    ),
}


async def get_module_usage_block(
    db: AsyncSession, edition_id: str, flag: str
) -> str | None:
    """Return a reason string if the module is in use and cannot be disabled.

    Returns None when the module can be safely disabled (no data yet, or no
    usage signal defined for it).
    """
    check = _USAGE_CHECKS.get(flag)
    if check is None:
        return None
    checker, reason = check
    if await checker(db, edition_id):
        return reason
    return None
