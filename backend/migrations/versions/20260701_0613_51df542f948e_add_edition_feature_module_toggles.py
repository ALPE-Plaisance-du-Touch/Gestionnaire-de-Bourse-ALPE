"""add edition feature module toggles

Revision ID: 51df542f948e
Revises: 7c8d2e1f4a3b
Create Date: 2026-07-01 06:13:20.661862+00:00

Adds per-edition feature module toggles (#66). All boolean flags get a
server_default of true and registration_mode defaults to 'manual', so
existing editions keep every module enabled (no behaviour change). New
editions apply a minimal adoption preset in the application layer.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "51df542f948e"
down_revision: Union[str, None] = "7c8d2e1f4a3b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


BOOLEAN_FLAGS = (
    "labels_enabled",
    "deposit_review_enabled",
    "sales_enabled",
    "payouts_enabled",
    "deposit_slots_enabled",
    "tickets_enabled",
    "special_lists_enabled",
    "offline_sales_enabled",
    "private_school_sale_enabled",
)


def upgrade() -> None:
    """Upgrade database schema."""
    for flag in BOOLEAN_FLAGS:
        op.add_column(
            "editions",
            sa.Column(
                flag,
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("1"),
            ),
        )
    op.add_column(
        "editions",
        sa.Column(
            "registration_mode",
            sa.String(length=20),
            nullable=False,
            server_default="manual",
        ),
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column("editions", "registration_mode")
    for flag in reversed(BOOLEAN_FLAGS):
        op.drop_column("editions", flag)
