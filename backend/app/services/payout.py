"""Payout service for calculating and managing depositor payouts."""

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.services.payout_pdf import generate_bulk_receipts_pdf, generate_single_receipt_pdf

from app.exceptions import (
    EditionNotFoundError,
    PayoutAlreadyPaidError,
    PayoutNotFoundError,
    ValidationError,
)
from app.models import ItemList, Payout, User
from app.models.article import ArticleStatus
from app.models.item_list import ListStatus
from app.models.payout import PayoutMethod, PayoutStatus
from app.repositories import EditionRepository, ItemListRepository, PayoutRepository
from app.repositories.sale import SaleRepository
from app.schemas.payout import (
    CalculatePayoutsResponse,
    CategoryStats,
    PayoutDashboardResponse,
    PayoutResponse,
    PayoutStatsResponse,
    PriceRangeStats,
)
from app.schemas.sale import TopDepositorStats

# List fees by type
LIST_FEES = {
    "standard": Decimal("0.00"),
    "list_1000": Decimal("1.00"),
    "list_2000": Decimal("2.50"),
}

TWO_PLACES = Decimal("0.01")


def _round(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _calculate_list_fee(list_type: str) -> Decimal:
    return LIST_FEES.get(list_type, Decimal("0.00"))


def _payout_to_response(payout: Payout) -> PayoutResponse:
    depositor = payout.depositor
    processed_by = payout.processed_by
    item_list = payout.item_list

    return PayoutResponse(
        id=payout.id,
        item_list_id=payout.item_list_id,
        list_number=item_list.number,
        list_type=item_list.list_type,
        depositor_id=payout.depositor_id,
        depositor_name=f"{depositor.first_name} {depositor.last_name}",
        gross_amount=payout.gross_amount,
        commission_amount=payout.commission_amount,
        list_fees=payout.list_fees,
        net_amount=payout.net_amount,
        total_articles=payout.total_articles,
        sold_articles=payout.sold_articles,
        unsold_articles=payout.unsold_articles,
        status=payout.status,
        payment_method=payout.payment_method,
        paid_at=payout.paid_at,
        payment_reference=payout.payment_reference,
        notes=payout.notes,
        processed_by_name=(
            f"{processed_by.first_name} {processed_by.last_name}"
            if processed_by else None
        ),
        created_at=payout.created_at,
        updated_at=payout.updated_at,
    )


async def calculate_payouts(
    edition_id: str, user: User, db: AsyncSession
) -> CalculatePayoutsResponse:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    if edition.status not in ("in_progress", "closed"):
        raise ValidationError("Payouts can only be calculated for editions in progress or closed")

    commission_rate = edition.commission_rate or Decimal("0.20")

    # Delete existing unpaid payouts for recalculation
    payout_repo = PayoutRepository(db)
    await payout_repo.delete_unpaid_by_edition(edition_id)

    # Get all item lists for this edition with articles loaded
    list_repo = ItemListRepository(db)
    item_lists = await list_repo.list_by_edition_with_articles(edition_id)

    payouts = []
    depositor_ids = set()

    for item_list in item_lists:
        articles = item_list.articles
        total_articles = len(articles)
        if total_articles == 0:
            continue

        # Check if a paid payout already exists for this list
        existing = await payout_repo.get_by_item_list_id(item_list.id)
        if existing and existing.status == PayoutStatus.PAID.value:
            depositor_ids.add(item_list.depositor_id)
            continue

        # Calculate sold articles and gross amount
        sold_articles = 0
        gross_amount = Decimal("0.00")
        for article in articles:
            if article.status == ArticleStatus.SOLD.value:
                sold_articles += 1
                gross_amount += article.price

        unsold_articles = total_articles - sold_articles
        commission_amount = _round(gross_amount * commission_rate)
        list_fees = _calculate_list_fee(item_list.list_type)
        net_amount = _round(gross_amount - commission_amount - list_fees)
        if net_amount < 0:
            net_amount = Decimal("0.00")

        payout = Payout(
            gross_amount=gross_amount,
            commission_amount=commission_amount,
            list_fees=list_fees,
            net_amount=net_amount,
            total_articles=total_articles,
            sold_articles=sold_articles,
            unsold_articles=unsold_articles,
            status=PayoutStatus.PENDING.value,
            item_list_id=item_list.id,
            depositor_id=item_list.depositor_id,
        )
        payouts.append(payout)
        depositor_ids.add(item_list.depositor_id)

    if payouts:
        await payout_repo.create_bulk(payouts)
    await db.commit()

    # Calculate totals
    total_sales = sum(p.gross_amount for p in payouts)
    total_commission = sum(p.commission_amount for p in payouts)
    total_list_fees = sum(p.list_fees for p in payouts)
    total_net = sum(p.net_amount for p in payouts)

    return CalculatePayoutsResponse(
        total_depositors=len(depositor_ids),
        total_payouts=len(payouts),
        total_sales=total_sales,
        total_commission=total_commission,
        total_list_fees=total_list_fees,
        total_net=total_net,
    )


async def list_payouts(
    edition_id: str,
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    payout_repo = PayoutRepository(db)
    offset = (page - 1) * per_page
    payouts, total = await payout_repo.list_by_edition(
        edition_id, offset=offset, limit=per_page, status=status, search=search
    )

    items = [_payout_to_response(p) for p in payouts]
    pages = (total + per_page - 1) // per_page if per_page > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }


async def get_payout_detail(
    payout_id: str, db: AsyncSession
) -> PayoutResponse:
    payout_repo = PayoutRepository(db)
    payout = await payout_repo.get_by_id(payout_id)
    if not payout:
        raise PayoutNotFoundError(payout_id)
    return _payout_to_response(payout)


async def record_payment(
    payout_id: str,
    payment_method: str,
    payment_reference: str | None,
    notes: str | None,
    user: User,
    db: AsyncSession,
) -> PayoutResponse:
    valid_methods = {m.value for m in PayoutMethod}
    if payment_method not in valid_methods:
        raise ValidationError(f"Invalid payment method: {payment_method}")

    if payment_method == PayoutMethod.CHECK.value and not payment_reference:
        raise ValidationError("Check number is required for check payments")

    payout_repo = PayoutRepository(db)
    payout = await payout_repo.get_by_id(payout_id)
    if not payout:
        raise PayoutNotFoundError(payout_id)

    if payout.status == PayoutStatus.PAID.value:
        raise PayoutAlreadyPaidError(payout_id)

    payout.status = PayoutStatus.PAID.value
    payout.payment_method = payment_method
    payout.paid_at = datetime.now()
    payout.payment_reference = payment_reference
    payout.processed_by_id = user.id
    if notes:
        payout.notes = notes

    # Update item list status
    payout.item_list.status = ListStatus.PAYOUT_COMPLETED.value

    await db.commit()
    payout = await payout_repo.get_by_id(payout_id)

    return _payout_to_response(payout)


async def update_payout_notes(
    payout_id: str,
    notes: str | None,
    is_absent: bool,
    user: User,
    db: AsyncSession,
) -> PayoutResponse:
    payout_repo = PayoutRepository(db)
    payout = await payout_repo.get_by_id(payout_id)
    if not payout:
        raise PayoutNotFoundError(payout_id)

    if is_absent:
        payout.notes = f"Absent - A recontacter. {notes or ''}".strip()
    else:
        payout.notes = notes

    await db.commit()
    payout = await payout_repo.get_by_id(payout_id)

    return _payout_to_response(payout)


async def recalculate_payout(
    payout_id: str, user: User, db: AsyncSession
) -> PayoutResponse:
    payout_repo = PayoutRepository(db)
    payout = await payout_repo.get_by_id(payout_id)
    if not payout:
        raise PayoutNotFoundError(payout_id)

    if payout.status == PayoutStatus.PAID.value:
        raise PayoutAlreadyPaidError(payout_id)

    # Get edition for commission rate
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(payout.item_list.edition_id)
    commission_rate = edition.commission_rate or Decimal("0.20")

    # Recalculate from articles
    articles = payout.item_list.articles
    total_articles = len(articles)
    sold_articles = 0
    gross_amount = Decimal("0.00")

    for article in articles:
        if article.status == ArticleStatus.SOLD.value:
            sold_articles += 1
            gross_amount += article.price

    unsold_articles = total_articles - sold_articles
    commission_amount = _round(gross_amount * commission_rate)
    list_fees = _calculate_list_fee(payout.item_list.list_type)
    net_amount = _round(gross_amount - commission_amount - list_fees)
    if net_amount < 0:
        net_amount = Decimal("0.00")

    payout.gross_amount = gross_amount
    payout.commission_amount = commission_amount
    payout.list_fees = list_fees
    payout.net_amount = net_amount
    payout.total_articles = total_articles
    payout.sold_articles = sold_articles
    payout.unsold_articles = unsold_articles

    await db.commit()
    payout = await payout_repo.get_by_id(payout_id)

    return _payout_to_response(payout)


async def get_payout_stats(
    edition_id: str, db: AsyncSession
) -> PayoutStatsResponse:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    payout_repo = PayoutRepository(db)
    stats = await payout_repo.get_stats(edition_id)

    total_articles = stats["total_articles"]
    sold_articles = stats["sold_articles"]
    sell_through_rate = (sold_articles / total_articles * 100) if total_articles > 0 else 0.0

    total_payouts = stats["total_payouts"]
    payouts_paid = stats["payouts_paid"]
    payment_progress = (payouts_paid / total_payouts * 100) if total_payouts > 0 else 0.0

    return PayoutStatsResponse(
        total_sales=stats["total_sales"],
        total_commission=stats["total_commission"],
        total_list_fees=stats["total_list_fees"],
        total_net=stats["total_net"],
        total_payouts=total_payouts,
        payouts_pending=stats["payouts_pending"],
        payouts_ready=stats["payouts_ready"],
        payouts_paid=payouts_paid,
        payouts_cancelled=stats["payouts_cancelled"],
        total_articles=total_articles,
        sold_articles=sold_articles,
        unsold_articles=stats["unsold_articles"],
        sell_through_rate=round(sell_through_rate, 1),
        payment_progress_percent=round(payment_progress, 1),
    )


async def generate_receipt(
    payout_id: str, db: AsyncSession
) -> tuple[bytes, str]:
    payout_repo = PayoutRepository(db)
    payout = await payout_repo.get_by_id(payout_id)
    if not payout:
        raise PayoutNotFoundError(payout_id)

    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(payout.item_list.edition_id)

    # Mark as ready if pending
    if payout.status == PayoutStatus.PENDING.value:
        payout.status = PayoutStatus.READY.value
        await db.commit()

    depositor = payout.depositor
    filename = f"Reversement_{payout.item_list.number}_{depositor.last_name}.pdf"
    pdf_bytes = generate_single_receipt_pdf(payout, edition)

    return pdf_bytes, filename


async def generate_all_receipts(
    edition_id: str, db: AsyncSession
) -> tuple[bytes, str]:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    payout_repo = PayoutRepository(db)
    payouts, _ = await payout_repo.list_by_edition(edition_id, offset=0, limit=10000)

    if not payouts:
        raise ValidationError("No payouts found for this edition")

    # Reload payouts with articles for PDF generation
    full_payouts = []
    for p in payouts:
        full_payout = await payout_repo.get_by_id(p.id)
        if full_payout.status == PayoutStatus.PENDING.value:
            full_payout.status = PayoutStatus.READY.value
        full_payouts.append(full_payout)

    await db.commit()

    edition_name = edition.name if hasattr(edition, "name") else "Edition"
    filename = f"Bordereaux_{edition_name.replace(' ', '_')}.pdf"
    pdf_bytes = generate_bulk_receipts_pdf(full_payouts, edition)

    return pdf_bytes, filename


async def get_payout_dashboard(
    edition_id: str, db: AsyncSession
) -> PayoutDashboardResponse:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    payout_repo = PayoutRepository(db)
    sale_repo = SaleRepository(db)

    stats = await payout_repo.get_stats(edition_id)
    top_depositors_raw = await sale_repo.get_top_depositors(edition_id, limit=10)
    category_stats_raw = await sale_repo.get_category_stats(edition_id)
    price_distribution_raw = await sale_repo.get_price_distribution(edition_id)

    total_articles = stats["total_articles"]
    sold_articles = stats["sold_articles"]
    sell_through_rate = (sold_articles / total_articles * 100) if total_articles > 0 else 0.0
    total_payouts = stats["total_payouts"]
    payouts_paid = stats["payouts_paid"]
    payment_progress = (payouts_paid / total_payouts * 100) if total_payouts > 0 else 0.0

    return PayoutDashboardResponse(
        total_sales=stats["total_sales"],
        total_commission=stats["total_commission"],
        total_list_fees=stats["total_list_fees"],
        total_net=stats["total_net"],
        total_articles=total_articles,
        sold_articles=sold_articles,
        unsold_articles=stats["unsold_articles"],
        sell_through_rate=round(sell_through_rate, 1),
        total_payouts=total_payouts,
        payouts_paid=payouts_paid,
        payment_progress_percent=round(payment_progress, 1),
        category_stats=[CategoryStats(**cs) for cs in category_stats_raw],
        top_depositors=[TopDepositorStats(**td) for td in top_depositors_raw],
        price_distribution=[PriceRangeStats(**pr) for pr in price_distribution_raw],
    )


async def generate_payout_excel_export(
    edition_id: str, db: AsyncSession
) -> tuple[bytes, str]:
    from app.services.payout_excel import generate_payout_excel

    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    payout_repo = PayoutRepository(db)
    payouts, _ = await payout_repo.list_by_edition(edition_id, offset=0, limit=10000)

    # Reload each payout with articles
    full_payouts = []
    for p in payouts:
        full_payout = await payout_repo.get_by_id(p.id)
        full_payouts.append(full_payout)

    stats = await payout_repo.get_stats(edition_id)
    excel_bytes = generate_payout_excel(full_payouts, edition, stats)

    edition_name = edition.name.replace(" ", "_") if edition.name else "Edition"
    filename = f"Export_Reversements_{edition_name}.xlsx"
    return excel_bytes, filename
