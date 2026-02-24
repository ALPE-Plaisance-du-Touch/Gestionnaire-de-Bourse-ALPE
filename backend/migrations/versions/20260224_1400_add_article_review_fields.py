"""add article and list review fields for US-013

Revision ID: 3b5e7f9a1c4d
Revises: 7f8e9d0c1b2a
Create Date: 2026-02-24 14:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "3b5e7f9a1c4d"
down_revision: Union[str, None] = "7f8e9d0c1b2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add review fields to articles and item_lists tables."""
    # Article review fields
    op.add_column(
        "articles",
        sa.Column("rejection_reason", sa.String(200), nullable=True),
    )
    op.add_column(
        "articles",
        sa.Column("rejected_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "articles",
        sa.Column(
            "rejected_by_user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "articles",
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "articles",
        sa.Column(
            "reviewed_by_user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # ItemList review fields
    op.add_column(
        "item_lists",
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "item_lists",
        sa.Column(
            "reviewed_by_user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Remove review fields from articles and item_lists tables."""
    op.drop_column("item_lists", "reviewed_by_user_id")
    op.drop_column("item_lists", "reviewed_at")
    op.drop_column("articles", "reviewed_by_user_id")
    op.drop_column("articles", "reviewed_at")
    op.drop_column("articles", "rejected_by_user_id")
    op.drop_column("articles", "rejected_at")
    op.drop_column("articles", "rejection_reason")
