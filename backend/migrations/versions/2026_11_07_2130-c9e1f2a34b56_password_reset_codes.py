"""password reset codes table for 6-digit email recovery

Revision ID: c9e1f2a34b56
Revises: b8d4e2f91c30
Create Date: 2026-11-07 21:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c9e1f2a34b56"
down_revision: str | None = "b8d4e2f91c30"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _has_table(table: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table)


def upgrade() -> None:
    if not _has_table("password_reset_codes"):
        op.create_table(
            "password_reset_codes",
            sa.Column("id", sa.Uuid(), nullable=False, primary_key=True),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("email", sa.Text(), nullable=False),
            sa.Column("code_hash", sa.String(length=64), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_password_reset_codes_user_id", "password_reset_codes", ["user_id"])
        op.create_index("ix_password_reset_codes_email", "password_reset_codes", ["email"])


def downgrade() -> None:
    if _has_table("password_reset_codes"):
        op.drop_index("ix_password_reset_codes_email", table_name="password_reset_codes")
        op.drop_index("ix_password_reset_codes_user_id", table_name="password_reset_codes")
        op.drop_table("password_reset_codes")

