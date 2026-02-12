"""add_billetweb_import_tables

Revision ID: a1b2c3d4e5f6
Revises: 0c6f307a36fe
Create Date: 2025-12-31 00:01:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "0c6f307a36fe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Create billetweb_import_logs table first (referenced by edition_depositors)
    op.create_table(
        "billetweb_import_logs",
        sa.Column("edition_id", sa.String(length=36), nullable=False),
        sa.Column("imported_by_id", sa.String(length=36), nullable=True),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("total_rows", sa.Integer(), default=0),
        sa.Column("rows_imported", sa.Integer(), default=0),
        sa.Column("existing_depositors_linked", sa.Integer(), default=0),
        sa.Column("new_depositors_created", sa.Integer(), default=0),
        sa.Column("rows_skipped_invalid", sa.Integer(), default=0),
        sa.Column("rows_skipped_unpaid", sa.Integer(), default=0),
        sa.Column("rows_skipped_duplicate", sa.Integer(), default=0),
        sa.Column("rows_skipped_already_registered", sa.Integer(), default=0),
        sa.Column("import_started_at", sa.DateTime(), nullable=False),
        sa.Column("import_completed_at", sa.DateTime(), nullable=True),
        sa.Column("errors_json", sa.Text(), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["edition_id"], ["editions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["imported_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_billetweb_import_logs_edition_id",
        "billetweb_import_logs",
        ["edition_id"],
    )

    # Create edition_depositors table
    op.create_table(
        "edition_depositors",
        sa.Column("edition_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("deposit_slot_id", sa.String(length=36), nullable=True),
        sa.Column("list_type", sa.String(length=20), nullable=False, default="standard"),
        sa.Column("billetweb_order_ref", sa.String(length=100), nullable=True),
        sa.Column("billetweb_session", sa.String(length=255), nullable=True),
        sa.Column("billetweb_tarif", sa.String(length=100), nullable=True),
        sa.Column("imported_at", sa.DateTime(), nullable=True),
        sa.Column("import_log_id", sa.String(length=36), nullable=True),
        sa.Column("postal_code", sa.String(length=10), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["edition_id"], ["editions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["deposit_slot_id"], ["deposit_slots.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["import_log_id"], ["billetweb_import_logs.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("edition_id", "user_id", name="uq_edition_depositor"),
    )
    op.create_index(
        "ix_edition_depositors_edition_id",
        "edition_depositors",
        ["edition_id"],
    )
    op.create_index(
        "ix_edition_depositors_user_id",
        "edition_depositors",
        ["user_id"],
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_index("ix_edition_depositors_user_id", table_name="edition_depositors")
    op.drop_index("ix_edition_depositors_edition_id", table_name="edition_depositors")
    op.drop_table("edition_depositors")
    op.drop_index(
        "ix_billetweb_import_logs_edition_id", table_name="billetweb_import_logs"
    )
    op.drop_table("billetweb_import_logs")
