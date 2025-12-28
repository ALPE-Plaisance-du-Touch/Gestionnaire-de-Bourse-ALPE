"""Initial database schema with all models.

Revision ID: 001_initial_schema
Revises:
Create Date: 2024-12-28

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Roles table
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, default=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("is_local_resident", sa.Boolean(), nullable=False, default=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("invitation_token", sa.String(255), nullable=True),
        sa.Column("invitation_expires_at", sa.DateTime(), nullable=True),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_invitation_token", "users", ["invitation_token"])

    # Editions table
    op.create_table(
        "editions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, default="draft"),
        sa.Column("start_datetime", sa.DateTime(), nullable=False),
        sa.Column("end_datetime", sa.DateTime(), nullable=False),
        sa.Column("declaration_deadline", sa.DateTime(), nullable=True),
        sa.Column("deposit_start_datetime", sa.DateTime(), nullable=True),
        sa.Column("deposit_end_datetime", sa.DateTime(), nullable=True),
        sa.Column("sale_start_datetime", sa.DateTime(), nullable=True),
        sa.Column("sale_end_datetime", sa.DateTime(), nullable=True),
        sa.Column("retrieval_start_datetime", sa.DateTime(), nullable=True),
        sa.Column("retrieval_end_datetime", sa.DateTime(), nullable=True),
        sa.Column("commission_rate", sa.Numeric(5, 4), nullable=True, default="0.2000"),
        sa.Column("created_by_id", sa.String(36), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # Item lists table
    op.create_table(
        "item_lists",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("list_type", sa.String(20), nullable=False, default="standard"),
        sa.Column("label_color", sa.String(50), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, default="draft"),
        sa.Column("checked_in_at", sa.DateTime(), nullable=True),
        sa.Column("retrieved_at", sa.DateTime(), nullable=True),
        sa.Column("is_validated", sa.Boolean(), nullable=False, default=False),
        sa.Column("validated_at", sa.DateTime(), nullable=True),
        sa.Column("labels_printed", sa.Boolean(), nullable=False, default=False),
        sa.Column("labels_printed_at", sa.DateTime(), nullable=True),
        sa.Column("edition_id", sa.String(36), nullable=False),
        sa.Column("depositor_id", sa.String(36), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["edition_id"], ["editions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["depositor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_item_lists_edition_id", "item_lists", ["edition_id"])
    op.create_index("ix_item_lists_depositor_id", "item_lists", ["depositor_id"])
    op.create_index(
        "ix_item_lists_edition_number",
        "item_lists",
        ["edition_id", "number"],
        unique=True,
    )

    # Articles table
    op.create_table(
        "articles",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("size", sa.String(50), nullable=True),
        sa.Column("brand", sa.String(100), nullable=True),
        sa.Column("color", sa.String(50), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("line_number", sa.Integer(), nullable=False),
        sa.Column("is_lot", sa.Boolean(), nullable=False, default=False),
        sa.Column("lot_quantity", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, default="draft"),
        sa.Column("conformity_certified", sa.Boolean(), nullable=False, default=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("barcode", sa.String(50), nullable=True),
        sa.Column("item_list_id", sa.String(36), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["item_list_id"], ["item_lists.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_articles_barcode", "articles", ["barcode"])
    op.create_index("ix_articles_item_list_id", "articles", ["item_list_id"])
    op.create_index(
        "ix_articles_list_line",
        "articles",
        ["item_list_id", "line_number"],
        unique=True,
    )

    # Sales table
    op.create_table(
        "sales",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("sold_at", sa.DateTime(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_method", sa.String(20), nullable=False),
        sa.Column("register_number", sa.Integer(), nullable=False),
        sa.Column("is_offline_sale", sa.Boolean(), nullable=False, default=False),
        sa.Column("synced_at", sa.DateTime(), nullable=True),
        sa.Column("edition_id", sa.String(36), nullable=False),
        sa.Column("article_id", sa.String(36), nullable=False),
        sa.Column("seller_id", sa.String(36), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["edition_id"], ["editions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["article_id"], ["articles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("article_id"),
    )
    op.create_index("ix_sales_edition_id", "sales", ["edition_id"])
    op.create_index("ix_sales_sold_at", "sales", ["sold_at"])

    # Payouts table
    op.create_table(
        "payouts",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("gross_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("commission_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("list_fees", sa.Numeric(10, 2), nullable=False, default="0.00"),
        sa.Column("net_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("total_articles", sa.Integer(), nullable=False, default=0),
        sa.Column("sold_articles", sa.Integer(), nullable=False, default=0),
        sa.Column("unsold_articles", sa.Integer(), nullable=False, default=0),
        sa.Column("status", sa.String(20), nullable=False, default="pending"),
        sa.Column("payment_method", sa.String(20), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("payment_reference", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("item_list_id", sa.String(36), nullable=False),
        sa.Column("depositor_id", sa.String(36), nullable=False),
        sa.Column("processed_by_id", sa.String(36), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["item_list_id"], ["item_lists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["depositor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["processed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payouts_item_list_id", "payouts", ["item_list_id"])
    op.create_index("ix_payouts_depositor_id", "payouts", ["depositor_id"])

    # Insert default roles
    op.execute(
        """
        INSERT INTO roles (name, description) VALUES
        ('depositor', 'Déposant - peut déclarer des articles et suivre ses ventes'),
        ('volunteer', 'Bénévole - peut scanner et vendre des articles'),
        ('manager', 'Gestionnaire - peut configurer les éditions et importer les données'),
        ('administrator', 'Administrateur - accès complet au système')
        """
    )


def downgrade() -> None:
    op.drop_table("payouts")
    op.drop_table("sales")
    op.drop_table("articles")
    op.drop_table("item_lists")
    op.drop_table("editions")
    op.drop_table("users")
    op.drop_table("roles")
