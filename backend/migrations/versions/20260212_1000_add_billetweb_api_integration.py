"""add billetweb api integration

Revision ID: a1b2c3d4e5f6
Revises: 83e8c2ace695
Create Date: 2026-02-12 10:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "83e8c2ace695"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Create app_settings table
    op.create_table(
        "app_settings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("key", sa.String(100), unique=True, nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("is_encrypted", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    # Add Billetweb columns to editions
    op.add_column("editions", sa.Column("billetweb_event_id", sa.String(100), nullable=True))
    op.add_column("editions", sa.Column("last_billetweb_sync", sa.DateTime(), nullable=True))

    # Add Billetweb column to deposit_slots
    op.add_column("deposit_slots", sa.Column("billetweb_session_id", sa.String(100), nullable=True))


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column("deposit_slots", "billetweb_session_id")
    op.drop_column("editions", "last_billetweb_sync")
    op.drop_column("editions", "billetweb_event_id")
    op.drop_table("app_settings")
