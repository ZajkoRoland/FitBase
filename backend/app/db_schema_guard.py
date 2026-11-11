"""Idempotent database schema synchronizer executed on application startup.

Ensures that even in environments where `alembic upgrade head` is not run manually
prior to container start (e.g. Render web dynos), all account-isolated tables and
columns exist in the database before handling requests.
"""

import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.db import Base

logger = logging.getLogger(__name__)


def ensure_per_account_schema(engine: Engine) -> None:
    """Idempotently creates missing tables and adds new columns to existing tables."""
    try:
        # 1. Create any brand-new tables (user_settings, user_achievements, workout_sessions)
        Base.metadata.create_all(bind=engine)

        insp = inspect(engine)
        is_pg = engine.dialect.name == "postgresql"
        json_default_obj = "'{}'::jsonb" if is_pg else "'{}'"
        json_default_arr = "'[]'::jsonb" if is_pg else "'[]'"
        json_type = "JSONB" if is_pg else "JSON"

        with engine.begin() as conn:
            # 2. Ensure profiles columns
            if insp.has_table("profiles"):
                profile_cols = {c["name"] for c in insp.get_columns("profiles")}
                if "avatar_url" not in profile_cols:
                    conn.execute(text("ALTER TABLE profiles ADD COLUMN avatar_url TEXT"))

            # 3. Ensure user_stats columns
            if insp.has_table("user_stats"):
                stats_cols = {c["name"] for c in insp.get_columns("user_stats")}
                alter_statements = [
                    ("gender", "ALTER TABLE user_stats ADD COLUMN gender VARCHAR(32)"),
                    ("age", "ALTER TABLE user_stats ADD COLUMN age INTEGER"),
                    ("target_weight", "ALTER TABLE user_stats ADD COLUMN target_weight REAL"),
                    ("best_streak", "ALTER TABLE user_stats ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0"),
                    ("total_workouts", "ALTER TABLE user_stats ADD COLUMN total_workouts INTEGER NOT NULL DEFAULT 0"),
                    ("weekly_target", "ALTER TABLE user_stats ADD COLUMN weekly_target INTEGER NOT NULL DEFAULT 4"),
                    (
                        "total_calories_burned",
                        "ALTER TABLE user_stats ADD COLUMN total_calories_burned INTEGER NOT NULL DEFAULT 0",
                    ),
                    ("total_minutes", "ALTER TABLE user_stats ADD COLUMN total_minutes INTEGER NOT NULL DEFAULT 0"),
                    ("last_workout_date", "ALTER TABLE user_stats ADD COLUMN last_workout_date VARCHAR(16)"),
                    (
                        "completed_exercises_today",
                        f"ALTER TABLE user_stats ADD COLUMN completed_exercises_today {json_type} NOT NULL DEFAULT {json_default_obj}",
                    ),
                    (
                        "activity_history",
                        f"ALTER TABLE user_stats ADD COLUMN activity_history {json_type} NOT NULL DEFAULT {json_default_arr}",
                    ),
                ]
                for col_name, ddl in alter_statements:
                    if col_name not in stats_cols:
                        conn.execute(text(ddl))
    except Exception as exc:
        logger.warning("Schema synchronization warning: %s", exc)

