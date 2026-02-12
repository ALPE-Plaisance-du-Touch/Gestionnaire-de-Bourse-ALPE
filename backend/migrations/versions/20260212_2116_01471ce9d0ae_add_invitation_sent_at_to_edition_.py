"""add invitation_sent_at to edition_depositors

Revision ID: 01471ce9d0ae
Revises: f7e8d9c0b1a2
Create Date: 2026-02-12 21:16:21.554371+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "01471ce9d0ae"
down_revision: Union[str, None] = "f7e8d9c0b1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column(
        "edition_depositors",
        sa.Column("invitation_sent_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column("edition_depositors", "invitation_sent_at")
