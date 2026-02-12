"""Billetweb import API endpoints."""

import math
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status

from app.dependencies import DBSession, require_role
from app.exceptions import EditionNotFoundError
from app.models import User
from app.models.edition import EditionStatus
from app.repositories import BilletwebImportLogRepository, EditionDepositorRepository, EditionRepository
from app.schemas.billetweb import (
    BilletwebImportLogResponse,
    BilletwebImportOptions,
    BilletwebImportResponse,
    BilletwebImportResult,
    BilletwebPreviewResponse,
    EditionDepositorWithUserResponse,
    EditionDepositorsListResponse,
)
from app.services.billetweb_import import BilletwebImportService

router = APIRouter()

# Maximum file size: 5 MB
MAX_FILE_SIZE = 5 * 1024 * 1024
# Maximum rows: 500
MAX_ROWS = 500


async def get_edition_or_404(db: DBSession, edition_id: str):
    """Get edition by ID or raise 404."""
    repo = EditionRepository(db)
    edition = await repo.get_by_id(edition_id)
    if not edition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    return edition


@router.post(
    "/preview",
    response_model=BilletwebPreviewResponse,
    summary="Preview Billetweb import",
    description="Parse and validate a Billetweb CSV file without importing. Returns statistics and errors.",
)
async def preview_billetweb_import(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    file: UploadFile = File(..., description="Billetweb CSV export file (.csv)"),
):
    """Preview a Billetweb import file.

    Validates the file and returns:
    - Statistics (total rows, paid/valid, new/existing depositors)
    - Any validation errors
    - Whether the import can proceed
    """
    # Validate file type
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only .csv files are accepted.",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    # Get edition
    edition = await get_edition_or_404(db, edition_id)

    # Check edition status
    if edition.status != EditionStatus.CONFIGURED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot import to edition in status '{edition.status}'. Edition must be in 'configured' status.",
        )

    # Preview import
    service = BilletwebImportService(db)
    result = await service.preview(edition, content, file.filename)

    # Check row count
    if result.stats.total_rows > MAX_ROWS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File contains too many rows ({result.stats.total_rows}). Maximum is {MAX_ROWS} rows.",
        )

    return result


@router.post(
    "/import",
    response_model=BilletwebImportResponse,
    summary="Import Billetweb file",
    description="Import depositors from a Billetweb CSV file. Sends invitations to new depositors.",
)
async def import_billetweb(
    edition_id: str,
    db: DBSession,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    file: UploadFile = File(..., description="Billetweb CSV export file (.csv)"),
    ignore_errors: bool = Query(False, description="Skip rows with errors instead of failing"),
    send_emails: bool = Query(False, description="Send invitation/notification emails"),
):
    """Import depositors from a Billetweb file.

    This endpoint:
    1. Validates the file
    2. Associates existing depositors with the edition
    3. Creates new user accounts with invitations
    4. Sends emails (if enabled)
    5. Returns import statistics
    """
    # Validate file type
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only .csv files are accepted.",
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    # Get edition
    edition = await get_edition_or_404(db, edition_id)

    # Check edition status
    if edition.status != EditionStatus.CONFIGURED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot import to edition in status '{edition.status}'. Edition must be in 'configured' status.",
        )

    # Import
    service = BilletwebImportService(db)
    try:
        import_log, invitations_sent, notifications_sent = await service.import_file(
            edition=edition,
            file_content=content,
            filename=file.filename,
            file_size=file_size,
            imported_by=current_user,
            ignore_errors=ignore_errors,
            send_emails=send_emails,
            background_tasks=background_tasks,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    # Calculate skipped rows
    rows_skipped = (
        import_log.rows_skipped_invalid
        + import_log.rows_skipped_unpaid
        + import_log.rows_skipped_duplicate
        + import_log.rows_skipped_already_registered
    )

    return BilletwebImportResponse(
        success=True,
        message=f"Import réussi : {import_log.existing_depositors_linked} déposants existants associés, {import_log.new_depositors_created} nouvelles invitations créées.",
        result=BilletwebImportResult(
            import_log_id=import_log.id,
            existing_depositors_linked=import_log.existing_depositors_linked,
            new_depositors_created=import_log.new_depositors_created,
            invitations_sent=invitations_sent,
            notifications_sent=notifications_sent,
            rows_skipped=rows_skipped,
        ),
    )


@router.get(
    "/depositors",
    response_model=EditionDepositorsListResponse,
    summary="List edition depositors",
    description="List all depositors registered for an edition.",
)
async def list_edition_depositors(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    list_type: str | None = Query(None, description="Filter by list type (standard, list_1000, list_2000)"),
    slot_id: str | None = Query(None, description="Filter by deposit slot ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
):
    """List depositors for an edition."""
    # Verify edition exists
    await get_edition_or_404(db, edition_id)

    repo = EditionDepositorRepository(db)
    depositors, total = await repo.list_by_edition(
        edition_id,
        list_type=list_type,
        slot_id=slot_id,
        page=page,
        limit=limit,
    )

    # Transform to response model
    items = []
    for dep in depositors:
        items.append(
            EditionDepositorWithUserResponse(
                id=dep.id,
                edition_id=dep.edition_id,
                user_id=dep.user_id,
                deposit_slot_id=dep.deposit_slot_id,
                list_type=dep.list_type,
                billetweb_order_ref=dep.billetweb_order_ref,
                billetweb_session=dep.billetweb_session,
                billetweb_tarif=dep.billetweb_tarif,
                imported_at=dep.imported_at,
                postal_code=dep.postal_code,
                city=dep.city,
                created_at=dep.created_at,
                user_email=dep.user.email,
                user_first_name=dep.user.first_name,
                user_last_name=dep.user.last_name,
                user_phone=dep.user.phone,
                slot_start_datetime=dep.deposit_slot.start_datetime if dep.deposit_slot else None,
                slot_end_datetime=dep.deposit_slot.end_datetime if dep.deposit_slot else None,
            )
        )

    return EditionDepositorsListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 0,
    )


@router.get(
    "/import-logs",
    response_model=list[BilletwebImportLogResponse],
    summary="List import logs",
    description="List all Billetweb import logs for an edition.",
)
async def list_import_logs(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """List import logs for an edition."""
    # Verify edition exists
    await get_edition_or_404(db, edition_id)

    repo = BilletwebImportLogRepository(db)
    logs, _ = await repo.list_by_edition(edition_id, page=page, limit=limit)

    return [BilletwebImportLogResponse.model_validate(log) for log in logs]


@router.get(
    "/stats",
    summary="Get import statistics",
    description="Get import statistics for an edition.",
)
async def get_import_stats(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Get import statistics for an edition."""
    # Verify edition exists
    await get_edition_or_404(db, edition_id)

    depositor_repo = EditionDepositorRepository(db)
    import_repo = BilletwebImportLogRepository(db)

    total_depositors = await depositor_repo.count_by_edition(edition_id)
    total_imports = await import_repo.count_imports_for_edition(edition_id)
    total_imported = await import_repo.get_total_imported_for_edition(edition_id)
    latest_import = await import_repo.get_latest_import(edition_id)

    return {
        "total_depositors": total_depositors,
        "total_imports": total_imports,
        "total_imported": total_imported,
        "latest_import": BilletwebImportLogResponse.model_validate(latest_import) if latest_import else None,
    }
