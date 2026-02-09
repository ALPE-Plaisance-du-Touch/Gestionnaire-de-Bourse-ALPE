"""add_is_private_sale_to_sales

Revision ID: 83e8c2ace695
Revises: b5c4e9f12d07
Create Date: 2026-02-09 15:36:21.303764+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "83e8c2ace695"
down_revision: Union[str, None] = "b5c4e9f12d07"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column("sales", sa.Column("is_private_sale", sa.Boolean(), nullable=False, server_default=sa.text("0")))


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column("sales", "is_private_sale")
