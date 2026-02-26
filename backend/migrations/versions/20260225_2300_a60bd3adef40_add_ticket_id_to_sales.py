"""add_ticket_id_to_sales

Revision ID: a60bd3adef40
Revises: 3b5e7f9a1c4d
Create Date: 2026-02-25 23:00:55.560791+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a60bd3adef40"
down_revision: Union[str, None] = "3b5e7f9a1c4d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add ticket_id column to sales for grouping checkout transactions."""
    op.add_column("sales", sa.Column("ticket_id", sa.String(length=36), nullable=True))
    op.create_index(op.f("ix_sales_ticket_id"), "sales", ["ticket_id"], unique=False)


def downgrade() -> None:
    """Remove ticket_id column from sales."""
    op.drop_index(op.f("ix_sales_ticket_id"), table_name="sales")
    op.drop_column("sales", "ticket_id")
