"""add_invitation_hidden_field

Revision ID: 690407843e84
Revises: 001_initial_schema
Create Date: 2025-12-29 21:44:52.516773+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "690407843e84"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column(
        "users",
        sa.Column("invitation_hidden", sa.Boolean(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column("users", "invitation_hidden")
