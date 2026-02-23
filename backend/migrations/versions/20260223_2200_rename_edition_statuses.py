"""rename edition statuses: remove configured, split in_progress

Revision ID: 7f8e9d0c1b2a
Revises: 2ac229d84aaa
Create Date: 2026-02-23 22:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7f8e9d0c1b2a"
down_revision: Union[str, None] = "2ac229d84aaa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Rename edition statuses in the database.

    Old lifecycle: draft → configured → registrations_open → in_progress → closed → archived
    New lifecycle: draft → registrations_open → deposit → sale → settlement → closed → archived

    - configured → draft (configuration now happens in draft)
    - in_progress → sale (most likely state for existing data)
    """
    op.execute("UPDATE editions SET status = 'draft' WHERE status = 'configured'")
    op.execute("UPDATE editions SET status = 'sale' WHERE status = 'in_progress'")


def downgrade() -> None:
    """Revert edition status renames."""
    op.execute("UPDATE editions SET status = 'in_progress' WHERE status = 'sale'")
    op.execute("UPDATE editions SET status = 'in_progress' WHERE status = 'settlement'")
    op.execute("UPDATE editions SET status = 'in_progress' WHERE status = 'deposit'")
