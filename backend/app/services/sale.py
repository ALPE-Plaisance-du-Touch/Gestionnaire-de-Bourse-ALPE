"""Sale service for checkout operations."""

from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    ArticleAlreadySoldError,
    ArticleNotFoundError,
    EditionNotFoundError,
    ValidationError,
)
from app.models import Sale, User
from app.models.article import ArticleStatus
from app.models.sale import PaymentMethod
from app.repositories import ArticleRepository, EditionRepository, SaleRepository
from app.schemas.sale import (
    CatalogArticleResponse,
    OfflineSaleItem,
    SaleResponse,
    SaleStatsResponse,
    ScanArticleResponse,
    SyncSaleResult,
    SyncSalesResponse,
    TopDepositorStats,
)

# Cancellation time limit for volunteers (5 minutes)
CANCEL_TIME_LIMIT = timedelta(minutes=5)


def _is_private_sale_time(sold_at: datetime) -> bool:
    """Check if the sale was made during private sale hours (Friday 17h-18h)."""
    return sold_at.weekday() == 4 and 17 <= sold_at.hour < 18


async def scan_article(
    edition_id: str, barcode: str, db: AsyncSession
) -> ScanArticleResponse:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    article_repo = ArticleRepository(db)
    article = await article_repo.get_by_barcode(barcode)

    if not article:
        raise ArticleNotFoundError(barcode)

    # Verify article belongs to this edition
    if article.item_list.edition_id != edition_id:
        raise ArticleNotFoundError(barcode)

    depositor = article.item_list.depositor

    return ScanArticleResponse(
        article_id=article.id,
        barcode=article.barcode,
        description=article.description,
        category=article.category,
        size=article.size,
        price=article.price,
        brand=article.brand,
        is_lot=article.is_lot,
        lot_quantity=article.lot_quantity,
        list_number=article.item_list.number,
        depositor_name=f"{depositor.first_name} {depositor.last_name}",
        label_color=article.item_list.label_color,
        status=article.status,
        is_available=article.is_available,
    )


async def register_sale(
    edition_id: str,
    article_id: str,
    payment_method: str,
    register_number: int,
    seller: User,
    db: AsyncSession,
) -> SaleResponse:
    # Validate payment method
    valid_methods = {m.value for m in PaymentMethod}
    if payment_method not in valid_methods:
        raise ValidationError(f"Invalid payment method: {payment_method}")

    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    if edition.status != "in_progress":
        raise ValidationError("Sales can only be registered for editions in progress")

    article_repo = ArticleRepository(db)
    article = await article_repo.get_by_id(article_id)
    if not article:
        raise ArticleNotFoundError(article_id)

    if article.item_list.edition_id != edition_id:
        raise ArticleNotFoundError(article_id)

    if not article.is_available:
        if article.is_sold:
            raise ArticleAlreadySoldError(article_id)
        raise ValidationError(f"Article is not available for sale (status: {article.status})")

    # Check for existing sale (double safety with UNIQUE constraint)
    sale_repo = SaleRepository(db)
    existing = await sale_repo.get_by_article_id(article_id)
    if existing:
        raise ArticleAlreadySoldError(article_id)

    # Create sale
    sold_at = datetime.now()
    sale = Sale(
        sold_at=sold_at,
        price=article.price,
        payment_method=payment_method,
        register_number=register_number,
        edition_id=edition_id,
        article_id=article_id,
        seller_id=seller.id,
        is_private_sale=_is_private_sale_time(sold_at),
    )
    await sale_repo.create(sale)

    # Update article status
    article.status = ArticleStatus.SOLD.value
    await db.commit()

    # Reload sale with relations
    sale = await sale_repo.get_by_id(sale.id)

    return _sale_to_response(sale, seller)


async def cancel_sale(
    sale_id: str, user: User, db: AsyncSession
) -> None:
    sale_repo = SaleRepository(db)
    sale = await sale_repo.get_by_id(sale_id)

    if not sale:
        raise ValidationError("Sale not found")

    # Check cancellation time limit
    elapsed = datetime.now() - sale.sold_at
    if elapsed > CANCEL_TIME_LIMIT:
        if not (user.is_manager or user.is_administrator):
            raise ValidationError(
                "Only managers can cancel sales older than 5 minutes"
            )

    # Restore article status
    article_repo = ArticleRepository(db)
    article = await article_repo.get_by_id(sale.article_id)
    if article:
        article.status = ArticleStatus.ON_SALE.value

    # Delete sale
    await sale_repo.delete(sale)


async def get_live_stats(
    edition_id: str, db: AsyncSession
) -> SaleStatsResponse:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    sale_repo = SaleRepository(db)
    stats = await sale_repo.get_stats(edition_id)
    top_depositors_data = await sale_repo.get_top_depositors(edition_id)

    top_depositors = [
        TopDepositorStats(**d) for d in top_depositors_data
    ]

    return SaleStatsResponse(
        **stats,
        top_depositors=top_depositors,
    )


async def get_article_catalog(
    edition_id: str, db: AsyncSession
) -> list[CatalogArticleResponse]:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    article_repo = ArticleRepository(db)
    articles = await article_repo.get_on_sale_for_edition(edition_id)

    return [
        CatalogArticleResponse(
            article_id=a.id,
            barcode=a.barcode or "",
            description=a.description,
            category=a.category,
            size=a.size,
            price=a.price,
            brand=a.brand,
            is_lot=a.is_lot,
            lot_quantity=a.lot_quantity,
            list_number=a.item_list.number,
            depositor_name=f"{a.item_list.depositor.first_name} {a.item_list.depositor.last_name}",
            label_color=a.item_list.label_color,
        )
        for a in articles
    ]


async def sync_offline_sales(
    edition_id: str,
    sales: list[OfflineSaleItem],
    seller: User,
    db: AsyncSession,
) -> SyncSalesResponse:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    article_repo = ArticleRepository(db)
    sale_repo = SaleRepository(db)
    valid_methods = {m.value for m in PaymentMethod}

    results: list[SyncSaleResult] = []
    synced = 0
    conflicts = 0
    errors = 0

    for item in sales:
        # Validate payment method
        if item.payment_method not in valid_methods:
            results.append(SyncSaleResult(
                client_id=item.client_id,
                status="error",
                error_message=f"Invalid payment method: {item.payment_method}",
            ))
            errors += 1
            continue

        # Check article exists
        article = await article_repo.get_by_id(item.article_id)
        if not article:
            results.append(SyncSaleResult(
                client_id=item.client_id,
                status="error",
                error_message="Article not found",
            ))
            errors += 1
            continue

        if article.item_list.edition_id != edition_id:
            results.append(SyncSaleResult(
                client_id=item.client_id,
                status="error",
                error_message="Article does not belong to this edition",
            ))
            errors += 1
            continue

        # Check if already sold (first-write-wins conflict)
        existing = await sale_repo.get_by_article_id(item.article_id)
        if existing or article.is_sold:
            results.append(SyncSaleResult(
                client_id=item.client_id,
                status="conflict",
                error_message="Article already sold by another register",
            ))
            conflicts += 1
            continue

        # Create the sale
        sale = Sale(
            sold_at=item.sold_at,
            price=article.price,
            payment_method=item.payment_method,
            register_number=item.register_number,
            edition_id=edition_id,
            article_id=item.article_id,
            seller_id=seller.id,
            is_offline_sale=True,
            synced_at=datetime.now(),
            is_private_sale=_is_private_sale_time(item.sold_at),
        )
        await sale_repo.create(sale)

        article.status = ArticleStatus.SOLD.value
        await db.commit()

        results.append(SyncSaleResult(
            client_id=item.client_id,
            status="synced",
            server_sale_id=sale.id,
        ))
        synced += 1

    # Send conflict notification email to managers
    if conflicts > 0:
        from app.services.email import email_service
        from app.repositories import UserRepository

        user_repo = UserRepository(db)
        managers, _ = await user_repo.list_users(role="manager", is_active=True, limit=100)
        admins, _ = await user_repo.list_users(role="administrator", is_active=True, limit=100)
        recipients = managers + admins

        conflict_details = [
            r.error_message or "Conflit"
            for r in results
            if r.status == "conflict"
        ]
        seller_name = f"{seller.first_name} {seller.last_name}"

        for recipient in recipients:
            try:
                await email_service.send_sale_conflict_email(
                    to_email=recipient.email,
                    edition_name=edition.name,
                    seller_name=seller_name,
                    synced_count=synced,
                    conflict_count=conflicts,
                    error_count=errors,
                    conflicts=conflict_details,
                )
            except Exception:
                pass  # Don't fail sync because of email error

    return SyncSalesResponse(
        synced=synced,
        conflicts=conflicts,
        errors=errors,
        results=results,
    )


def _sale_to_response(sale: Sale, current_user: User) -> SaleResponse:
    elapsed = datetime.now() - sale.sold_at
    can_cancel = elapsed <= CANCEL_TIME_LIMIT or current_user.is_manager or current_user.is_administrator

    depositor = sale.article.item_list.depositor
    seller = sale.seller

    return SaleResponse(
        id=sale.id,
        article_id=sale.article_id,
        article_description=sale.article.description,
        article_barcode=sale.article.barcode or "",
        price=sale.price,
        payment_method=sale.payment_method,
        register_number=sale.register_number,
        sold_at=sale.sold_at,
        seller_name=f"{seller.first_name} {seller.last_name}" if seller else "Unknown",
        depositor_name=f"{depositor.first_name} {depositor.last_name}",
        list_number=sale.article.item_list.number,
        can_cancel=can_cancel,
        is_private_sale=sale.is_private_sale,
    )
