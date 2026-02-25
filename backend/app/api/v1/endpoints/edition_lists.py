"""Edition declarations viewing endpoints for managers/admins."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.dependencies import DBSession, require_role
from app.models import User
from app.repositories import EditionDepositorRepository, ItemListRepository
from app.schemas import (
    DeclarationsSummaryResponse,
    DepositorInfo,
    ItemListListResponse,
    ItemListWithDepositorResponse,
)

router = APIRouter()

ManagerUser = Annotated[User, Depends(require_role(["manager", "administrator"]))]


@router.get(
    "/lists",
    response_model=ItemListListResponse,
    summary="List depositor lists for an edition",
)
async def get_edition_lists(
    edition_id: str,
    db: DBSession,
    current_user: ManagerUser,
    list_type: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
):
    """List all depositor item lists for an edition with pagination."""
    repo = ItemListRepository(db)
    lists, total = await repo.list_by_edition(
        edition_id,
        list_type=list_type,
        status=status,
        page=page,
        limit=limit,
        load_articles=True,
    )
    pages = (total + limit - 1) // limit

    items = []
    for item_list in lists:
        depositor = None
        if item_list.depositor:
            depositor = DepositorInfo(
                id=item_list.depositor.id,
                email=item_list.depositor.email,
                first_name=item_list.depositor.first_name,
                last_name=item_list.depositor.last_name,
            )

        items.append(
            ItemListWithDepositorResponse(
                id=item_list.id,
                number=item_list.number,
                list_type=item_list.list_type,
                label_color=item_list.label_color,
                status=item_list.status,
                is_validated=item_list.is_validated,
                validated_at=item_list.validated_at,
                checked_in_at=item_list.checked_in_at,
                retrieved_at=item_list.retrieved_at,
                labels_printed=item_list.labels_printed,
                labels_printed_at=item_list.labels_printed_at,
                article_count=item_list.article_count,
                clothing_count=item_list.clothing_count,
                total_value=item_list.total_value,
                edition_id=item_list.edition_id,
                depositor_id=item_list.depositor_id,
                created_at=item_list.created_at,
                depositor=depositor,
            )
        )

    return ItemListListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get(
    "/summary",
    response_model=DeclarationsSummaryResponse,
    summary="Get declaration progress summary for an edition",
)
async def get_edition_lists_summary(
    edition_id: str,
    db: DBSession,
    current_user: ManagerUser,
):
    """Get summary statistics of declaration progress for an edition."""
    list_repo = ItemListRepository(db)
    depositor_repo = EditionDepositorRepository(db)

    total_depositors = await depositor_repo.count_by_edition(edition_id)
    all_lists = await list_repo.list_by_edition_with_articles(edition_id)

    draft_count = sum(1 for lst in all_lists if lst.status == "draft")
    validated_count = sum(1 for lst in all_lists if lst.status != "draft")
    total_articles = sum(lst.article_count for lst in all_lists)
    total_value = sum(lst.total_value for lst in all_lists)
    depositors_with_lists = len({lst.depositor_id for lst in all_lists})

    return DeclarationsSummaryResponse(
        total_depositors=total_depositors,
        depositors_with_lists=depositors_with_lists,
        total_lists=len(all_lists),
        draft_lists=draft_count,
        validated_lists=validated_count,
        total_articles=total_articles,
        total_value=round(total_value, 2),
    )
