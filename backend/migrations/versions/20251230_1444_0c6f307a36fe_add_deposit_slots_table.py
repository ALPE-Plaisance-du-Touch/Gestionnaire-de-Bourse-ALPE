"""add_deposit_slots_table

Revision ID: 0c6f307a36fe
Revises: 690407843e84
Create Date: 2025-12-30 14:44:00.240794+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0c6f307a36fe"
down_revision: Union[str, None] = "690407843e84"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.create_table(
        "deposit_slots",
        sa.Column("edition_id", sa.String(length=36), nullable=False),
        sa.Column("start_datetime", sa.DateTime(), nullable=False),
        sa.Column("end_datetime", sa.DateTime(), nullable=False),
        sa.Column("max_capacity", sa.Integer(), nullable=False),
        sa.Column("reserved_for_locals", sa.Boolean(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["edition_id"], ["editions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_deposit_slots_edition_id", "deposit_slots", ["edition_id"])


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_index("ix_deposit_slots_edition_id", table_name="deposit_slots")
    op.drop_table("deposit_slots")
