"""Drop sale_start_datetime and sale_end_datetime from editions.

Revision ID: f7e8d9c0b1a2
Revises: d05342127706
Create Date: 2026-02-12

"""
import sqlalchemy as sa
from alembic import op

revision = "f7e8d9c0b1a2"
down_revision = "d05342127706"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("editions", "sale_start_datetime")
    op.drop_column("editions", "sale_end_datetime")


def downgrade() -> None:
    op.add_column(
        "editions",
        sa.Column("sale_start_datetime", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "editions",
        sa.Column("sale_end_datetime", sa.DateTime(), nullable=True),
    )
