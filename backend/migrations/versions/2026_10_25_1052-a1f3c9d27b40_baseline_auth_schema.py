"""Alap séma: felhasználók, profilok, statisztikák és heti tervek

Revision ID: a1f3c9d27b40
Revises:
Create Date: 2026-10-25 10:52:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1f3c9d27b40"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Segédfüggvény: megnézi, hogy a megadott tábla hiányzik-e még
def _missing(table: str) -> bool:
    return not sa.inspect(op.get_bind()).has_table(table)


def upgrade() -> None:
    # Jelszóhasheléshez és uuid generáláshoz szükséges postgres kiegészítő
    op.execute("create extension if not exists pgcrypto")

    # Automatikus updated_at trigger függvény az időbélyegek frissítéséhez
    op.execute(
        """
        create or replace function public.set_updated_at() returns trigger
        language plpgsql as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$
        """
    )

    # Felhasználói fiókok alaptáblája (email, jelszó hash, jogosultság)
    if _missing("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
            sa.Column("email", sa.Text(), nullable=False),
            sa.Column("password_hash", sa.Text()),
            sa.Column("auth_provider", sa.Text(), nullable=False, server_default="local"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.execute("create unique index users_email_unique_idx on public.users (lower(email))")
        op.execute(
            "create trigger users_set_updated_at before update on public.users "
            "for each row execute function public.set_updated_at()"
        )

    # Bejelentkezési munkamenetek (refresh tokenek) táblája
    if _missing("refresh_tokens"):
        op.create_table(
            "refresh_tokens",
            sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True)),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("refresh_tokens_user_id_idx", "refresh_tokens", ["user_id"])

    # Felhasználói profil adatok (megjelenített név, onboarding állapot)
    if _missing("profiles"):
        op.create_table(
            "profiles",
            sa.Column("id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("username", sa.Text()),
            sa.Column("display_name", sa.Text()),
            sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.CheckConstraint(
                "username is null or (char_length(username) between 2 and 30 and username = btrim(username))",
                name="profiles_username_check",
            ),
        )
        op.execute("create unique index profiles_username_unique_idx on public.profiles (lower(username))")
        op.execute(
            "create trigger profiles_set_updated_at before update on public.profiles "
            "for each row execute function public.set_updated_at()"
        )

    # Alapvető testadatok és célok (súly, magasság, széria)
    if _missing("user_stats"):
        op.create_table(
            "user_stats",
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("height", sa.Float()),
            sa.Column("weight", sa.Float()),
            sa.Column("fitness_goal", sa.Text()),
            sa.Column("fitness_level", sa.Text()),
            sa.Column("streak", sa.Integer(), server_default="0"),
            sa.Column("sessions_this_week", sa.Integer(), server_default="0"),
            sa.Column("estimated_calories_today", sa.Integer(), server_default="0"),
            sa.Column("total_hours", sa.Integer(), server_default="0"),
        )

    # Heti edzésterv felosztás napokra lebontva
    if _missing("user_weekly_plan"):
        op.create_table(
            "user_weekly_plan",
            sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("day_of_week", sa.Integer(), nullable=False),
            sa.Column("day_name", sa.Text(), nullable=False),
            sa.Column("type", sa.Text(), nullable=False),
            sa.Column("workout_title", sa.Text()),
            sa.Column("workout_meta", sa.Text()),
            sa.Column("exercises", postgresql.JSONB(), server_default=sa.text("'[]'::jsonb")),
            sa.CheckConstraint("day_of_week between 0 and 6", name="user_weekly_plan_day_of_week_check"),
            sa.CheckConstraint("type in ('workout', 'rest')", name="user_weekly_plan_type_check"),
            sa.UniqueConstraint("user_id", "day_of_week"),
        )


def downgrade() -> None:
    # Visszaállítási lépések fordított sorrendben
    op.drop_table("user_weekly_plan")
    op.drop_table("user_stats")
    op.drop_table("profiles")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
    op.execute("drop function if exists public.set_updated_at()")
