"""add edition closure fields

Revision ID: 1df8f095c0e1
Revises: 6b986b51f28e
Create Date: 2026-02-08 21:58:52.244837+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "1df8f095c0e1"
down_revision: Union[str, None] = "6b986b51f28e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column("editions", sa.Column("closed_at", sa.DateTime(), nullable=True))
    op.add_column(
        "editions", sa.Column("closed_by_id", sa.String(length=36), nullable=True)
    )
    op.add_column("editions", sa.Column("archived_at", sa.DateTime(), nullable=True))
    op.create_foreign_key(
        "fk_editions_closed_by", "editions", "users", ["closed_by_id"], ["id"]
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_constraint("fk_editions_closed_by", "editions", type_="foreignkey")
    op.drop_column("editions", "archived_at")
    op.drop_column("editions", "closed_by_id")
    op.drop_column("editions", "closed_at")
