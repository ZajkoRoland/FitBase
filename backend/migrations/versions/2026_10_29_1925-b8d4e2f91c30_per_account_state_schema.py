"""Felhasználói állapotok: beállítások, jelvények, edzésnapló és statisztikák

Revision ID: b8d4e2f91c30
Revises: 5c8e1b7a94d2
Create Date: 2026-10-29 19:25:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b8d4e2f91c30"
down_revision: str | None = "5c8e1b7a94d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Segédfüggvény: megnézi, hogy a tábla létezik-e
def _has_table(table: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table)


# Segédfüggvény: ellenőrzi, hogy egy adott oszlop már szerepel-e a táblában
def _has_column(table: str, column: str) -> bool:
    insp = sa.inspect(op.get_bind())
    if not insp.has_table(table):
        return False
    return any(c["name"] == column for c in insp.get_columns(table))


def upgrade() -> None:
    # Profil tábla kiegészítése avatar kép hivatkozással
    if not _has_column("profiles", "avatar_url"):
        op.add_column("profiles", sa.Column("avatar_url", sa.Text(), nullable=True))

    # Felhasználói statisztikák bővítése (célok, rekordok, kalóriák, aktivitástörténet)
    stats_columns = [
        ("target_weight", sa.Column("target_weight", sa.Float(), nullable=True)),
        ("best_streak", sa.Column("best_streak", sa.Integer(), nullable=False, server_default="0")),
        ("total_workouts", sa.Column("total_workouts", sa.Integer(), nullable=False, server_default="0")),
        ("weekly_target", sa.Column("weekly_target", sa.Integer(), nullable=False, server_default="4")),
        ("total_calories_burned", sa.Column("total_calories_burned", sa.Integer(), nullable=False, server_default="0")),
        ("total_minutes", sa.Column("total_minutes", sa.Integer(), nullable=False, server_default="0")),
        ("last_workout_date", sa.Column("last_workout_date", sa.String(16), nullable=True)),
        (
            "completed_exercises_today",
            sa.Column(
                "completed_exercises_today",
                postgresql.JSONB(),
                nullable=False,
                server_default=sa.text("'{}'::jsonb"),
            ),
        ),
        (
            "activity_history",
            sa.Column(
                "activity_history",
                postgresql.JSONB(),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
        ),
    ]
    for col_name, col_def in stats_columns:
        if not _has_column("user_stats", col_name):
            op.add_column("user_stats", col_def)

    # Felhasználói beállítások tábla (értesítések, emlékeztetők, hangok, nyelv)
    if not _has_table("user_settings"):
        op.create_table(
            "user_settings",
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("workout_reminder_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("workout_reminder_window", sa.String(32), nullable=False, server_default="07:00-10:00"),
            sa.Column("rest_day_reminder_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("rest_day_reminder_window", sa.String(32), nullable=False, server_default="10:00-11:00"),
            sa.Column("streak_reminder_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("streak_reminder_window", sa.String(32), nullable=False, server_default="17:00-19:30"),
            sa.Column("achievement_alerts_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("sound_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("vibration_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("language", sa.String(16), nullable=False, server_default="auto"),
            sa.Column("units", sa.String(16), nullable=False, server_default="metric"),
            sa.Column("plan_structure", sa.String(32), nullable=False, server_default="1_week"),
            sa.Column(
                "read_notification_ids",
                postgresql.JSONB(),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
            sa.Column(
                "deleted_notification_ids",
                postgresql.JSONB(),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )

    # Feloldott mérföldkövek és kitüntetések táblája
    if not _has_table("user_achievements"):
        op.create_table(
            "user_achievements",
            sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("achievement_key", sa.String(64), nullable=False),
            sa.Column("title", sa.Text(), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("category", sa.String(32), nullable=False),
            sa.Column("tier", sa.String(32), nullable=False),
            sa.Column("icon", sa.String(64), nullable=False),
            sa.Column("current_value", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("target_value", sa.Integer(), nullable=False),
            sa.Column("unit", sa.String(32), nullable=False),
            sa.Column("is_unlocked", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("unlocked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.UniqueConstraint("user_id", "achievement_key", name="uq_user_achievement_key"),
        )
        op.create_index("ix_user_achievements_user_id", "user_achievements", ["user_id"])

    # Befejezett edzések naplózása (időtartam, kalóriák, gyakorlatok listája)
    if not _has_table("workout_sessions"):
        op.create_table(
            "workout_sessions",
            sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("session_date", sa.String(16), nullable=False),
            sa.Column("day_of_week", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("workout_title", sa.Text(), nullable=True),
            sa.Column("exercises_completed", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("calories_burned", sa.Integer(), nullable=False, server_default="0"),
            sa.Column(
                "exercise_details",
                postgresql.JSONB(),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_workout_sessions_user_date", "workout_sessions", ["user_id", "session_date"])


def downgrade() -> None:
    # Létrehozott táblák törlése
    if _has_table("workout_sessions"):
        op.drop_table("workout_sessions")
    if _has_table("user_achievements"):
        op.drop_table("user_achievements")
    if _has_table("user_settings"):
        op.drop_table("user_settings")
    # Hozzáadott oszlopok törlése
    for col in [
        "activity_history",
        "completed_exercises_today",
        "last_workout_date",
        "total_minutes",
        "total_calories_burned",
        "weekly_target",
        "total_workouts",
        "best_streak",
        "target_weight",
    ]:
        if _has_column("user_stats", col):
            op.drop_column("user_stats", col)
    if _has_column("profiles", "avatar_url"):
        op.drop_column("profiles", "avatar_url")

