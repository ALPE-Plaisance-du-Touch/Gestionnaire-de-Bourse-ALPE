"""Sales and checkout API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import DBSession, require_role
from app.exceptions import (
    AppException,
    ArticleAlreadySoldError,
    ArticleNotFoundError,
    EditionNotFoundError,
    ValidationError,
)
from app.models import User
from app.schemas.sale import (
    CancelSaleRequest,
    CatalogArticleResponse,
    RegisterSaleRequest,
    SaleResponse,
    SaleStatsResponse,
    ScanArticleResponse,
    ScanRequest,
    SyncSalesRequest,
    SyncSalesResponse,
)
from app.services.sale import (
    cancel_sale,
    get_article_catalog,
    get_live_stats,
    register_sale,
    scan_article,
    sync_offline_sales,
    _sale_to_response,
)
from app.repositories import SaleRepository

router = APIRouter()


def get_sale_repository(db: DBSession) -> SaleRepository:
    return SaleRepository(db)


SaleRepoDep = Annotated[SaleRepository, Depends(get_sale_repository)]


@router.get(
    "/editions/{edition_id}/articles/catalog",
    response_model=list[CatalogArticleResponse],
    summary="Get full article catalog for offline caching",
)
async def get_article_catalog_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["volunteer", "manager", "administrator"]))],
):
    try:
        return await get_article_catalog(edition_id, db)
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")


@router.post(
    "/editions/{edition_id}/sales/scan",
    response_model=ScanArticleResponse,
    summary="Scan article by barcode",
)
async def scan_article_endpoint(
    edition_id: str,
    request: ScanRequest,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["volunteer", "manager", "administrator"]))],
):
    try:
        return await scan_article(edition_id, request.barcode, db)
    except ArticleNotFoundError:
        raise HTTPException(status_code=404, detail="Article not found")
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")


@router.post(
    "/editions/{edition_id}/sales",
    response_model=SaleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a sale",
)
async def register_sale_endpoint(
    edition_id: str,
    request: RegisterSaleRequest,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["volunteer", "manager", "administrator"]))],
):
    try:
        return await register_sale(
            edition_id,
            request.article_id,
            request.payment_method,
            request.register_number,
            current_user,
            db,
        )
    except ArticleAlreadySoldError as e:
        raise HTTPException(status_code=409, detail=e.message)
    except ArticleNotFoundError:
        raise HTTPException(status_code=404, detail="Article not found")
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get(
    "/editions/{edition_id}/sales",
    summary="List sales for an edition",
)
async def list_sales_endpoint(
    edition_id: str,
    db: DBSession,
    sale_repo: SaleRepoDep,
    current_user: Annotated[User, Depends(require_role(["volunteer", "manager", "administrator"]))],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    payment_method: str | None = None,
    register_number: int | None = None,
):
    offset = (page - 1) * per_page
    sales, total = await sale_repo.list_by_edition(
        edition_id,
        offset=offset,
        limit=per_page,
        payment_method=payment_method,
        register_number=register_number,
    )

    items = [_sale_to_response(s, current_user) for s in sales]

    return {
        "items": [item.model_dump() for item in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
    }


@router.post(
    "/editions/{edition_id}/sales/sync",
    response_model=SyncSalesResponse,
    summary="Sync offline sales batch",
)
async def sync_sales_endpoint(
    edition_id: str,
    request: SyncSalesRequest,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["volunteer", "manager", "administrator"]))],
):
    try:
        return await sync_offline_sales(edition_id, request.sales, current_user, db)
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")


@router.post(
    "/editions/{edition_id}/sales/{sale_id}/cancel",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel a sale",
)
async def cancel_sale_endpoint(
    edition_id: str,
    sale_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["volunteer", "manager", "administrator"]))],
    request: CancelSaleRequest | None = None,
):
    try:
        await cancel_sale(sale_id, current_user, db)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get(
    "/editions/{edition_id}/stats/sales-live",
    response_model=SaleStatsResponse,
    summary="Get live sales statistics",
)
async def get_live_stats_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["volunteer", "manager", "administrator"]))],
):
    try:
        return await get_live_stats(edition_id, db)
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")
