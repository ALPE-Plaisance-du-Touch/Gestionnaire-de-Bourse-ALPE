"""add gdpr fields to users

Revision ID: a3f2d8e91b04
Revises: 1df8f095c0e1
Create Date: 2026-02-09 14:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a3f2d8e91b04"
down_revision: Union[str, None] = "1df8f095c0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add GDPR-related columns to users table."""
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("anonymized_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Remove GDPR columns from users table."""
    op.drop_column("users", "anonymized_at")
    op.drop_column("users", "deleted_at")
