"""Billetweb import schemas for API requests and responses."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ListType(str, Enum):
    """Type of list (affects pricing and slots)."""

    STANDARD = "standard"
    LIST_1000 = "list_1000"
    LIST_2000 = "list_2000"


# --- Preview Response Schemas ---


class BilletwebRowError(BaseModel):
    """Error details for a specific row in the import file."""

    row_number: int = Field(..., description="Row number in the Excel file (1-indexed)")
    email: str | None = Field(None, description="Email from the row if available")
    error_type: str = Field(..., description="Type of error: invalid_email, invalid_phone, unknown_slot, missing_field")
    error_message: str = Field(..., description="Human-readable error message")
    field_name: str | None = Field(None, description="Name of the field with the error")
    field_value: str | None = Field(None, description="Value that caused the error")


class BilletwebPreviewStats(BaseModel):
    """Statistics from preview analysis."""

    total_rows: int = Field(..., description="Total number of rows in the file")
    rows_unpaid_invalid: int = Field(..., description="Rows with Payé!=Oui or Valide!=Oui (ignored)")
    rows_to_process: int = Field(..., description="Rows that are paid and valid")
    existing_depositors: int = Field(..., description="Depositors already in the database (by email)")
    new_depositors: int = Field(..., description="New depositors to create")
    duplicates_in_file: int = Field(..., description="Duplicate emails in the file (only first kept)")
    already_registered: int = Field(..., description="Depositors already registered for this edition")
    errors_count: int = Field(..., description="Number of rows with blocking errors")


class SlotOccupancy(BaseModel):
    """Occupancy info for a deposit slot."""

    slot_id: str
    slot_description: str
    current: int = Field(..., description="Already registered depositors")
    incoming: int = Field(..., description="New depositors from this import")
    max_capacity: int
    over_capacity: bool = Field(..., description="True if current + incoming > max_capacity")


class ListTypeBreakdown(BaseModel):
    """Breakdown of depositors by list type."""

    standard: int = 0
    list_1000: int = 0
    list_2000: int = 0


class BilletwebPreviewResponse(BaseModel):
    """Response for preview endpoint."""

    model_config = ConfigDict(from_attributes=True)

    stats: BilletwebPreviewStats
    errors: list[BilletwebRowError] = Field(
        default_factory=list, description="List of row errors (blocking if any)"
    )
    warnings: list[str] = Field(
        default_factory=list, description="Non-blocking warnings"
    )
    can_import: bool = Field(..., description="Whether import can proceed (no blocking errors)")
    available_slots: list[str] = Field(
        default_factory=list, description="List of configured slot names for reference"
    )
    slot_occupancy: list[SlotOccupancy] = Field(
        default_factory=list, description="Occupancy per deposit slot"
    )
    list_type_breakdown: ListTypeBreakdown = Field(
        default_factory=ListTypeBreakdown, description="Depositors by list type"
    )


# --- Import Response Schemas ---


class BilletwebImportResult(BaseModel):
    """Result of a successful import."""

    model_config = ConfigDict(from_attributes=True)

    import_log_id: str = Field(..., description="ID of the import log for audit")
    existing_depositors_linked: int = Field(..., description="Number of existing depositors associated")
    new_depositors_created: int = Field(..., description="Number of new depositors created and invited")
    invitations_sent: int = Field(..., description="Number of invitation emails sent")
    notifications_sent: int = Field(..., description="Number of notification emails sent to existing users")
    rows_skipped: int = Field(..., description="Total rows skipped (duplicates, already registered, etc.)")


class BilletwebImportResponse(BaseModel):
    """Response for import endpoint."""

    model_config = ConfigDict(from_attributes=True)

    success: bool = True
    message: str
    result: BilletwebImportResult


# --- Import Options Schema ---


class BilletwebImportOptions(BaseModel):
    """Options for the import process."""

    ignore_errors: bool = Field(
        default=False,
        description="If true, skip rows with errors instead of blocking the import"
    )
    send_emails: bool = Field(
        default=False,
        description="If true, send invitation/notification emails"
    )


# --- Edition Depositor Schemas ---


class EditionDepositorResponse(BaseModel):
    """Response schema for edition depositor."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    edition_id: str
    user_id: str
    deposit_slot_id: str | None = None
    list_type: str
    billetweb_order_ref: str | None = None
    billetweb_session: str | None = None
    billetweb_tarif: str | None = None
    imported_at: datetime | None = None
    postal_code: str | None = None
    city: str | None = None
    created_at: datetime


class EditionDepositorWithUserResponse(EditionDepositorResponse):
    """Response schema for edition depositor with user details."""

    user_email: str
    user_first_name: str
    user_last_name: str
    user_phone: str | None = None
    slot_start_datetime: datetime | None = None
    slot_end_datetime: datetime | None = None


# --- Import Log Schemas ---


class BilletwebImportLogResponse(BaseModel):
    """Response schema for import log."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    edition_id: str
    imported_by_id: str
    filename: str
    file_size_bytes: int
    total_rows: int
    rows_imported: int
    existing_depositors_linked: int
    new_depositors_created: int
    rows_skipped_invalid: int
    rows_skipped_unpaid: int
    rows_skipped_duplicate: int
    rows_skipped_already_registered: int
    import_started_at: datetime
    import_completed_at: datetime | None = None
    created_at: datetime


class EditionDepositorsListResponse(BaseModel):
    """Response schema for paginated edition depositors list."""

    items: list[EditionDepositorWithUserResponse]
    total: int
    page: int
    limit: int
    pages: int


class ManualDepositorCreateRequest(BaseModel):
    """Request schema for manually adding a depositor to an edition."""

    email: str = Field(..., min_length=1)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(None, max_length=20)
    deposit_slot_id: str
    list_type: str = Field(default="standard")
    postal_code: str | None = Field(None, max_length=10)
    city: str | None = Field(None, max_length=100)
