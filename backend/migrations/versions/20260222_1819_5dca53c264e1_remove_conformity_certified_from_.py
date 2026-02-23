"""remove conformity_certified from articles

Revision ID: 5dca53c264e1
Revises: 01471ce9d0ae
Create Date: 2026-02-22 18:19:57.939095+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = "5dca53c264e1"
down_revision: Union[str, None] = "01471ce9d0ae"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.drop_column("articles", "conformity_certified")


def downgrade() -> None:
    """Downgrade database schema."""
    op.add_column(
        "articles",
        sa.Column(
            "conformity_certified",
            mysql.TINYINT(display_width=1),
            autoincrement=False,
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
