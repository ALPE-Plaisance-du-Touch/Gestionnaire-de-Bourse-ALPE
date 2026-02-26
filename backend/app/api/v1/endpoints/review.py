"""Deposit review API endpoints (US-013)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import DBSession, require_role
from app.exceptions import (
    ArticleNotFoundError,
    EditionNotFoundError,
    InvalidPriceError,
    ValidationError,
)
from app.models import User
from app.schemas.article import (
    ArticleRejectRequest,
    ArticleResponse,
    ArticleUpdate,
    ReviewListDetailResponse,
    ReviewListResponse,
    ReviewStats,
    ReviewSummaryResponse,
)
from app.services.article import (
    BlacklistedCategoryError,
    CategoryLimitExceededError,
    InvalidLotError,
)
from app.services.review import ReviewService

router = APIRouter()


def get_review_service(db: DBSession) -> ReviewService:
    return ReviewService(db)


ReviewServiceDep = Annotated[ReviewService, Depends(get_review_service)]
VolunteerUser = Annotated[
    User, Depends(require_role(["volunteer", "manager", "administrator"]))
]


@router.get(
    "/lists",
    response_model=list[ReviewListResponse],
    summary="List lists for review",
    description="Get all lists for an edition with review status and statistics.",
)
async def get_review_lists(
    edition_id: str,
    review_service: ReviewServiceDep,
    current_user: VolunteerUser,
    review_status: str | None = Query(
        None,
        alias="status",
        description="Filter by review status: pending, in_progress, reviewed",
    ),
):
    try:
        lists = await review_service.get_review_lists(
            edition_id, review_status=review_status
        )
        return [
            ReviewListResponse(
                id=l["id"],
                number=l["number"],
                list_type=l["list_type"],
                status=l["status"],
                depositor_name=l["depositor_name"],
                article_count=l["article_count"],
                review_stats=ReviewStats(**l["review_stats"]),
                reviewed_at=l["reviewed_at"],
                reviewed_by_name=l["reviewed_by_name"],
            )
            for l in lists
        ]
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} non trouvée",
        )


@router.get(
    "/lists/{list_id}",
    response_model=ReviewListDetailResponse,
    summary="Get list detail for review",
    description="Get a list with all its articles for review.",
)
async def get_review_list_detail(
    edition_id: str,
    list_id: str,
    review_service: ReviewServiceDep,
    current_user: VolunteerUser,
):
    try:
        detail = await review_service.get_review_list_detail(edition_id, list_id)
        return ReviewListDetailResponse(
            id=detail["id"],
            number=detail["number"],
            list_type=detail["list_type"],
            status=detail["status"],
            depositor_id=detail["depositor_id"],
            depositor_name=detail["depositor_name"],
            articles=[
                ArticleResponse.model_validate(a) for a in detail["articles"]
            ],
            review_stats=ReviewStats(**detail["review_stats"]),
            reviewed_at=detail["reviewed_at"],
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.post(
    "/articles/{article_id}/accept",
    response_model=ArticleResponse,
    summary="Accept an article",
    description="Accept an article during deposit review.",
)
async def accept_article(
    edition_id: str,
    article_id: str,
    review_service: ReviewServiceDep,
    current_user: VolunteerUser,
):
    try:
        article = await review_service.accept_article(article_id, current_user)
        return ArticleResponse.model_validate(article)
    except ArticleNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.post(
    "/articles/{article_id}/reject",
    response_model=ArticleResponse,
    summary="Reject an article",
    description="Reject an article during deposit review with optional reason.",
)
async def reject_article(
    edition_id: str,
    article_id: str,
    review_service: ReviewServiceDep,
    current_user: VolunteerUser,
    request: ArticleRejectRequest | None = None,
):
    try:
        reason = request.rejection_reason if request else None
        article = await review_service.reject_article(
            article_id, current_user, reason
        )
        return ArticleResponse.model_validate(article)
    except ArticleNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.put(
    "/articles/{article_id}",
    response_model=ArticleResponse,
    summary="Edit an article during review",
    description="Edit article fields during deposit review (same validations as declaration).",
)
async def edit_article_in_review(
    edition_id: str,
    article_id: str,
    request: ArticleUpdate,
    review_service: ReviewServiceDep,
    current_user: VolunteerUser,
):
    try:
        article = await review_service.edit_article_in_review(
            article_id, request, current_user
        )
        return ArticleResponse.model_validate(article)
    except ArticleNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )
    except InvalidPriceError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except (InvalidLotError, BlacklistedCategoryError, CategoryLimitExceededError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.post(
    "/lists/{list_id}/finalize",
    response_model=ReviewListResponse,
    summary="Finalize list review",
    description="Finalize the review of a list. All articles must be accepted or rejected.",
)
async def finalize_review(
    edition_id: str,
    list_id: str,
    review_service: ReviewServiceDep,
    current_user: VolunteerUser,
):
    try:
        item_list = await review_service.finalize_review(list_id, current_user)

        # Reload with articles for stats
        detail = await review_service.get_review_list_detail(edition_id, list_id)

        return ReviewListResponse(
            id=detail["id"],
            number=detail["number"],
            list_type=detail["list_type"],
            status=detail["status"],
            depositor_name=detail["depositor_name"],
            article_count=detail["article_count"],
            review_stats=ReviewStats(**detail["review_stats"]),
            reviewed_at=detail["reviewed_at"],
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.get(
    "/summary",
    response_model=ReviewSummaryResponse,
    summary="Get review progress",
    description="Get overall review progress for an edition.",
)
async def get_review_summary(
    edition_id: str,
    review_service: ReviewServiceDep,
    current_user: VolunteerUser,
):
    try:
        summary = await review_service.get_review_summary(edition_id)
        return ReviewSummaryResponse(**summary)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} non trouvée",
        )
