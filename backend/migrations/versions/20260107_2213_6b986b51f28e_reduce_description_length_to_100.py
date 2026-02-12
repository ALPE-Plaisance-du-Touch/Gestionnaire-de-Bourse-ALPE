"""reduce_description_length_to_100

Revision ID: 6b986b51f28e
Revises: 4e864f16a3e3
Create Date: 2026-01-07 22:13:50.349020+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = "6b986b51f28e"
down_revision: Union[str, None] = "4e864f16a3e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.alter_column(
        "articles",
        "description",
        existing_type=mysql.VARCHAR(length=255),
        type_=sa.String(length=100),
        existing_nullable=False,
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.alter_column(
        "articles",
        "description",
        existing_type=sa.String(length=100),
        type_=mysql.VARCHAR(length=255),
        existing_nullable=False,
    )
