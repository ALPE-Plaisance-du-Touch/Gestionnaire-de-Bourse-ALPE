"""Edition declarations viewing and reminder endpoints for managers/admins."""

import logging
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from app.dependencies import DBSession, require_role
from app.models import User
from app.repositories import EditionDepositorRepository, EditionRepository, ItemListRepository
from app.schemas import (
    DeclarationReminderRequest,
    DeclarationReminderResponse,
    DeclarationsSummaryResponse,
    DepositorDeclarationInfo,
    DepositorDeclarationsListResponse,
    DepositorInfo,
    ItemListListResponse,
    ItemListWithDepositorResponse,
)
from app.services.email import email_service
from app.services.item_list import MAX_LISTS_2000, MAX_LISTS_STANDARD

logger = logging.getLogger(__name__)

router = APIRouter()

ManagerUser = Annotated[User, Depends(require_role(["manager", "administrator"]))]


def _get_max_lists(list_type: str) -> int:
    """Get max lists for a depositor based on their list type."""
    if list_type == "list_2000":
        return MAX_LISTS_2000
    return MAX_LISTS_STANDARD


def _compute_depositor_status(dep_lists: list, max_lists: int) -> str:
    """Compute declaration status for a depositor given their lists."""
    if not dep_lists:
        return "none"
    validated_count = sum(1 for lst in dep_lists if lst.status not in ("draft", "not_finalized"))
    if validated_count >= max_lists:
        return "complete"
    if validated_count > 0:
        return "partial"
    return "started"


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

    # Load depositors to know their list_type for max_lists calculation
    all_depositors, _ = await depositor_repo.list_by_edition(
        edition_id, page=1, limit=10000
    )
    dep_list_types = {dep.user_id: dep.list_type for dep in all_depositors}

    draft_count = sum(1 for lst in all_lists if lst.status in ("draft", "not_finalized"))
    validated_count = sum(1 for lst in all_lists if lst.status not in ("draft", "not_finalized"))
    total_articles = sum(lst.article_count for lst in all_lists)
    total_value = sum(lst.total_value for lst in all_lists)

    # Group lists by depositor
    lists_by_dep: dict[str, list] = {}
    for lst in all_lists:
        lists_by_dep.setdefault(lst.depositor_id, []).append(lst)

    depositors_with_lists = len(lists_by_dep)

    # Per-depositor status counts
    depositors_complete = 0
    depositors_started = 0
    depositors_partial = 0
    for dep_id, dep_lists in lists_by_dep.items():
        max_lists = _get_max_lists(dep_list_types.get(dep_id, "standard"))
        dep_status = _compute_depositor_status(dep_lists, max_lists)
        if dep_status == "complete":
            depositors_complete += 1
        elif dep_status == "partial":
            depositors_partial += 1
        else:
            depositors_started += 1

    depositors_none = total_depositors - depositors_with_lists

    return DeclarationsSummaryResponse(
        total_depositors=total_depositors,
        depositors_with_lists=depositors_with_lists,
        total_lists=len(all_lists),
        draft_lists=draft_count,
        validated_lists=validated_count,
        total_articles=total_articles,
        total_value=round(total_value, 2),
        depositors_none=depositors_none,
        depositors_started=depositors_started,
        depositors_partial=depositors_partial,
        depositors_complete=depositors_complete,
    )


@router.get(
    "/depositors",
    response_model=DepositorDeclarationsListResponse,
    summary="List depositors with declaration progress",
)
async def get_edition_depositors_declarations(
    edition_id: str,
    db: DBSession,
    current_user: ManagerUser,
    status: str | None = Query(None, description="Filter: none|started|partial|complete"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
):
    """List all depositors for an edition with their declaration progress."""
    depositor_repo = EditionDepositorRepository(db)
    list_repo = ItemListRepository(db)

    # Load all depositors and lists (acceptable for <500 depositors per edition)
    all_depositors, _ = await depositor_repo.list_by_edition(
        edition_id, page=1, limit=10000
    )
    all_lists = await list_repo.list_by_edition_with_articles(edition_id)

    # Index lists by depositor_id
    lists_by_dep: dict[str, list] = {}
    for lst in all_lists:
        lists_by_dep.setdefault(lst.depositor_id, []).append(lst)

    # Build info for each depositor
    items = []
    for dep in all_depositors:
        dep_lists = lists_by_dep.get(dep.user_id, [])
        max_lists = _get_max_lists(dep.list_type)
        lists_count = len(dep_lists)
        draft_count = sum(1 for lst in dep_lists if lst.status in ("draft", "not_finalized"))
        validated_count = sum(1 for lst in dep_lists if lst.status not in ("draft", "not_finalized"))
        total_articles = sum(lst.article_count for lst in dep_lists)
        total_value = sum(lst.total_value for lst in dep_lists)
        dec_status = _compute_depositor_status(dep_lists, max_lists)

        items.append(
            DepositorDeclarationInfo(
                id=dep.id,
                user_id=dep.user_id,
                email=dep.user.email,
                first_name=dep.user.first_name,
                last_name=dep.user.last_name,
                list_type=dep.list_type,
                lists_count=lists_count,
                draft_count=draft_count,
                validated_count=validated_count,
                total_articles=total_articles,
                total_value=round(total_value, 2),
                declaration_status=dec_status,
            )
        )

    # Compute aggregate counts before filtering
    count_none = sum(1 for i in items if i.declaration_status == "none")
    count_started = sum(1 for i in items if i.declaration_status == "started")
    count_partial = sum(1 for i in items if i.declaration_status == "partial")
    count_complete = sum(1 for i in items if i.declaration_status == "complete")

    # Apply status filter
    if status:
        items = [i for i in items if i.declaration_status == status]

    total = len(items)
    pages_count = max(1, (total + limit - 1) // limit)

    # Sort by last name, first name
    items.sort(key=lambda i: (i.last_name.lower(), i.first_name.lower()))

    # Paginate
    start = (page - 1) * limit
    items = items[start : start + limit]

    return DepositorDeclarationsListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages_count,
        count_none=count_none,
        count_started=count_started,
        count_partial=count_partial,
        count_complete=count_complete,
    )


@router.post(
    "/remind",
    response_model=DeclarationReminderResponse,
    summary="Send declaration reminders to depositors",
)
async def send_declaration_reminders(
    edition_id: str,
    db: DBSession,
    background_tasks: BackgroundTasks,
    current_user: ManagerUser,
    body: DeclarationReminderRequest | None = None,
):
    """Send deadline reminder emails to depositors who haven't finalized their lists."""
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )

    if not edition.declaration_deadline:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Aucune date limite de déclaration configurée pour cette édition",
        )

    deadline_str = edition.declaration_deadline.strftime("%d/%m/%Y")
    depositor_ids = body.depositor_ids if body else []

    if depositor_ids:
        # Send to specific depositors (manager decides)
        depositor_repo = EditionDepositorRepository(db)
        all_depositors, _ = await depositor_repo.list_by_edition(
            edition_id, page=1, limit=10000
        )
        target_dep_ids = set(depositor_ids)
        targets = [dep for dep in all_depositors if dep.id in target_dep_ids]
    else:
        # Send to all incomplete depositors
        depositor_repo = EditionDepositorRepository(db)
        list_repo = ItemListRepository(db)

        all_depositors, _ = await depositor_repo.list_by_edition(
            edition_id, page=1, limit=10000
        )
        all_lists = await list_repo.list_by_edition_with_articles(edition_id)

        lists_by_dep: dict[str, list] = {}
        for lst in all_lists:
            lists_by_dep.setdefault(lst.depositor_id, []).append(lst)

        targets = []
        for dep in all_depositors:
            dep_lists = lists_by_dep.get(dep.user_id, [])
            max_lists = _get_max_lists(dep.list_type)
            dep_status = _compute_depositor_status(dep_lists, max_lists)
            if dep_status != "complete":
                targets.append(dep)

    if not targets:
        return DeclarationReminderResponse(
            emails_queued=0,
            message="Aucun déposant à relancer",
        )

    async def _send_reminders():
        sent = 0
        for dep in targets:
            try:
                await email_service.send_deadline_reminder(
                    to_email=dep.user.email,
                    first_name=dep.user.first_name or "Déposant",
                    edition_name=edition.name,
                    deadline=deadline_str,
                )
                sent += 1
            except Exception as e:
                logger.error(f"Failed to send reminder to {dep.user.email}: {e}")
        logger.info(f"Declaration reminders sent: {sent}/{len(targets)}")

    background_tasks.add_task(_send_reminders)

    return DeclarationReminderResponse(
        emails_queued=len(targets),
        message=f"Envoi de {len(targets)} rappel(s) en cours",
    )
