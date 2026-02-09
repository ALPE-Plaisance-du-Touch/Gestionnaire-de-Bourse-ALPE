"""Depositor item lists API endpoints."""

from datetime import datetime
from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.dependencies import CurrentActiveUser, DBSession
from app.exceptions import (
    DeclarationDeadlinePassedError,
    EditionNotFoundError,
    ValidationError,
)
from app.repositories import EditionDepositorRepository, EditionRepository
from app.schemas import (
    DepositorListsResponse,
    ItemListCreate,
    ItemListDetailResponse,
    ItemListResponse,
    ItemListSummary,
    ItemListValidateRequest,
)
from app.services import ItemListService
from app.services.item_list import (
    ItemListNotFoundError,
    ListAlreadyValidatedError,
    ListNotDraftError,
    MaxListsExceededError,
)

router = APIRouter()


class MyEditionSummary(BaseModel):
    """Summary of an edition for the depositor."""

    id: str
    name: str
    status: str
    list_type: str
    start_datetime: datetime
    end_datetime: datetime
    declaration_deadline: datetime | None = None


class MyEditionsResponse(BaseModel):
    """Response containing depositor's editions."""

    editions: list[MyEditionSummary]


def get_item_list_service(db: DBSession) -> ItemListService:
    """Get ItemListService instance."""
    return ItemListService(db)


ItemListServiceDep = Annotated[ItemListService, Depends(get_item_list_service)]


@router.get(
    "/my-editions",
    response_model=MyEditionsResponse,
    summary="Get my editions",
    description="Get all editions where the current user is registered as a depositor.",
)
async def get_my_editions(
    db: DBSession,
    current_user: CurrentActiveUser,
):
    """Get all editions where the user is registered as a depositor."""
    depositor_repo = EditionDepositorRepository(db)
    edition_repo = EditionRepository(db)

    # Get all edition registrations for the user
    registrations = await depositor_repo.list_by_user(current_user.id)

    editions = []
    for reg in registrations:
        # Get edition details
        edition = await edition_repo.get_by_id(reg.edition_id)
        if edition:
            editions.append(
                MyEditionSummary(
                    id=edition.id,
                    name=edition.name,
                    status=edition.status,
                    list_type=reg.list_type,
                    start_datetime=edition.start_datetime,
                    end_datetime=edition.end_datetime,
                    declaration_deadline=edition.declaration_deadline,
                )
            )

    return MyEditionsResponse(editions=editions)


@router.get(
    "/editions/{edition_id}/lists",
    response_model=DepositorListsResponse,
    summary="Get my lists for an edition",
    description="Get all item lists for the current user in a specific edition.",
)
async def get_my_lists(
    edition_id: str,
    list_service: ItemListServiceDep,
    current_user: CurrentActiveUser,
):
    """Get all lists for the current depositor in an edition."""
    try:
        summary = await list_service.get_depositor_lists_summary(
            current_user.id, edition_id
        )

        return DepositorListsResponse(
            lists=[
                ItemListSummary(
                    id=lst.id,
                    number=lst.number,
                    list_type=lst.list_type,
                    status=lst.status,
                    article_count=lst.article_count,
                    clothing_count=lst.clothing_count,
                    is_validated=lst.is_validated,
                    validated_at=lst.validated_at,
                )
                for lst in summary["lists"]
            ],
            total_lists=summary["total_lists"],
            max_lists=summary["max_lists"],
            can_create_more=summary["can_create_more"],
        )
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )


@router.post(
    "/editions/{edition_id}/lists",
    response_model=ItemListResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new list",
    description="Create a new item list for the current user in an edition.",
)
async def create_list(
    edition_id: str,
    request: ItemListCreate,
    list_service: ItemListServiceDep,
    current_user: CurrentActiveUser,
):
    """Create a new item list."""
    try:
        item_list = await list_service.create_list(
            depositor=current_user,
            edition_id=edition_id,
            data=request,
        )
        # Build response manually to avoid lazy loading issues
        # (new list has no articles, so counts are 0)
        return ItemListResponse(
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
            article_count=0,
            clothing_count=0,
            edition_id=item_list.edition_id,
            depositor_id=item_list.depositor_id,
            created_at=item_list.created_at,
        )
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    except DeclarationDeadlinePassedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La date limite de déclaration est dépassée",
        )
    except MaxListsExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.get(
    "/lists/{list_id}",
    response_model=ItemListDetailResponse,
    summary="Get list details",
    description="Get details of a specific list including all articles.",
)
async def get_list_detail(
    list_id: str,
    list_service: ItemListServiceDep,
    current_user: CurrentActiveUser,
):
    """Get detailed view of a list with articles."""
    try:
        item_list = await list_service.get_list(list_id, load_articles=True)

        # Check ownership
        if item_list.depositor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'êtes pas autorisé à voir cette liste",
            )

        # Build response with articles
        response = ItemListDetailResponse(
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
            edition_id=item_list.edition_id,
            depositor_id=item_list.depositor_id,
            created_at=item_list.created_at,
            articles=[
                {
                    "id": a.id,
                    "line_number": a.line_number,
                    "category": a.category,
                    "subcategory": a.subcategory,
                    "description": a.description,
                    "price": a.price,
                    "size": a.size,
                    "brand": a.brand,
                    "color": a.color,
                    "gender": a.gender,
                    "is_lot": a.is_lot,
                    "lot_quantity": a.lot_quantity,
                    "status": a.status,
                    "conformity_certified": a.conformity_certified,
                    "barcode": a.barcode,
                    "notes": a.notes,
                    "item_list_id": a.item_list_id,
                    "created_at": a.created_at,
                }
                for a in sorted(item_list.articles, key=lambda x: x.line_number)
            ],
        )

        return response
    except ItemListNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liste {list_id} non trouvée",
        )


@router.post(
    "/lists/{list_id}/validate",
    response_model=ItemListResponse,
    summary="Validate list",
    description="Validate a list (final confirmation before deposit).",
)
async def validate_list(
    list_id: str,
    request: ItemListValidateRequest,
    list_service: ItemListServiceDep,
    current_user: CurrentActiveUser,
):
    """Validate a list (mark as ready for deposit)."""
    try:
        item_list = await list_service.validate_list(
            list_id=list_id,
            depositor=current_user,
            confirmation_accepted=request.confirmation_accepted,
        )
        return ItemListResponse.model_validate(item_list)
    except ItemListNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liste {list_id} non trouvée",
        )
    except ListAlreadyValidatedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette liste a déjà été validée",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )


@router.delete(
    "/lists/{list_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete list",
    description="Delete an empty draft list.",
)
async def delete_list(
    list_id: str,
    list_service: ItemListServiceDep,
    current_user: CurrentActiveUser,
):
    """Delete an empty draft list."""
    try:
        await list_service.delete_list(list_id, current_user)
    except ItemListNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liste {list_id} non trouvée",
        )
    except ListNotDraftError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Seules les listes en brouillon peuvent être supprimées",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.get(
    "/lists/{list_id}/pdf",
    summary="Download list as PDF",
    description="Download the item list as a PDF document.",
)
async def download_list_pdf(
    list_id: str,
    list_service: ItemListServiceDep,
    current_user: CurrentActiveUser,
):
    """Download the item list as a PDF."""
    from app.services.pdf import generate_list_pdf

    try:
        item_list = await list_service.get_list(list_id, load_articles=True)
    except ItemListNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liste {list_id} non trouvée",
        )

    if item_list.depositor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à accéder à cette liste",
        )

    depositor_name = f"{current_user.first_name} {current_user.last_name}"
    pdf_bytes = generate_list_pdf(item_list, depositor_name)

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="liste-{item_list.number}.pdf"',
        },
    )
