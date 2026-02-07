"""add_subcategory_and_gender_to_articles

Revision ID: 4e864f16a3e3
Revises: a1b2c3d4e5f6
Create Date: 2026-01-07 21:17:34.170950+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "4e864f16a3e3"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column(
        "articles", sa.Column("subcategory", sa.String(length=50), nullable=True)
    )
    op.add_column("articles", sa.Column("gender", sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column("articles", "gender")
    op.drop_column("articles", "subcategory")
