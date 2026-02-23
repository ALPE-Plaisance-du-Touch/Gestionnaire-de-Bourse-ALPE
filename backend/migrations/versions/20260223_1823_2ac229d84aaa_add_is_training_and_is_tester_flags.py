"""add is_training and is_tester flags

Revision ID: 2ac229d84aaa
Revises: 5dca53c264e1
Create Date: 2026-02-23 18:23:18.349734+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "2ac229d84aaa"
down_revision: Union[str, None] = "5dca53c264e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column(
        "editions",
        sa.Column("is_training", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "users",
        sa.Column("is_tester", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column("users", "is_tester")
    op.drop_column("editions", "is_training")
