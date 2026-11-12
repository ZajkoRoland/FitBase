"""Gyakorlatkatalógus: izomcsoportok, eszközök, címkék és gyakorlatok

Revision ID: 5c8e1b7a94d2
Revises: a1f3c9d27b40
Create Date: 2026-10-25 10:58:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "5c8e1b7a94d2"
down_revision: str | None = "a1f3c9d27b40"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Natív postgres enumok definíciói
ENUMS = {
    "exercise_category": ["strength", "stretching", "cardio", "plyometrics", "olympic"],
    "force_type": ["push", "pull", "static", "dynamic"],
    "mechanic": ["compound", "isolation"],
    "difficulty": ["beginner", "intermediate", "advanced"],
    "body_part": [
        "upper_legs", "lower_legs", "core", "full_body", "back",
        "chest", "shoulders", "upper_arms", "lower_arms",
    ],
    "muscle_role": ["primary", "secondary"],
    "image_kind": ["start", "peak", "main"],
    "training_goal": [
        "hypertrophy", "strength", "endurance", "power",
        "mobility", "rehabilitation", "core",
    ],
}


# Segédfüggvény: egyedi enum típus leíró létrehozása
def _enum(name: str) -> postgresql.ENUM:
    return postgresql.ENUM(*ENUMS[name], name=name, create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    # Egyedi enum típusok felvétele az adatbázisba
    for name in ENUMS:
        _enum(name).create(bind, checkfirst=True)

    # Izomcsoportok táblája
    op.create_table(
        "muscles",
        sa.Column("id", sa.Integer(), sa.Identity(), primary_key=True),
        sa.Column("slug", sa.String(40), nullable=False, unique=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("image_path", sa.Text()),
    )
    # Edzőtermi felszerelések és eszközök
    op.create_table(
        "equipment",
        sa.Column("id", sa.Integer(), sa.Identity(), primary_key=True),
        sa.Column("slug", sa.String(48), nullable=False, unique=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("image_path", sa.Text()),
    )
    # Gyakorlat címkék (pl. kezdőbarát, funkcionális)
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), sa.Identity(), primary_key=True),
        sa.Column("slug", sa.String(40), nullable=False, unique=True),
    )

    # Gyakorlatok fő adattáblája
    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), sa.Identity(), primary_key=True),
        sa.Column("slug", sa.String(64), nullable=False, unique=True),
        sa.Column("category", _enum("exercise_category"), nullable=False),
        sa.Column("force_type", _enum("force_type"), nullable=False),
        sa.Column("mechanic", _enum("mechanic"), nullable=False),
        sa.Column("difficulty", _enum("difficulty"), nullable=False),
        sa.Column("body_part", _enum("body_part"), nullable=False),
        sa.Column("equipment_id", sa.Integer(), sa.ForeignKey("equipment.id", ondelete="RESTRICT")),
        sa.Column("is_unilateral", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_bodyweight", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("met", sa.Numeric(3, 1), nullable=False),
        sa.Column("variation_group", sa.String(40)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("met > 0", name="exercises_met_positive"),
    )
    op.create_index("ix_exercises_category", "exercises", ["category"])
    op.create_index("ix_exercises_difficulty", "exercises", ["difficulty"])
    op.create_index("ix_exercises_body_part", "exercises", ["body_part"])
    op.create_index("ix_exercises_equipment_id", "exercises", ["equipment_id"])
    op.create_index("ix_exercises_variation_group", "exercises", ["variation_group"])

    # Többnyelvű leírások és instrukciók (magyar és angol nevek)
    op.create_table(
        "exercise_translations",
        sa.Column("exercise_id", sa.Integer(), sa.ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("lang", sa.String(2), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("instructions", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.Column("tips", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.CheckConstraint("lang = lower(lang) AND char_length(lang) = 2", name="translations_lang_code"),
    )
    op.create_index(
        "exercise_translations_lang_name_idx",
        "exercise_translations",
        ["lang", sa.text("lower(name)")],
    )

    # Gyakorlat és megdolgozott izmok kapcsolótáblája
    op.create_table(
        "exercise_muscles",
        sa.Column("exercise_id", sa.Integer(), sa.ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("muscle_id", sa.Integer(), sa.ForeignKey("muscles.id", ondelete="RESTRICT"), primary_key=True),
        sa.Column("role", _enum("muscle_role"), nullable=False),
    )
    op.create_index("ix_exercise_muscles_muscle_id", "exercise_muscles", ["muscle_id"])

    # Fázisképek és bemutató ábrák elérési útjai
    op.create_table(
        "exercise_images",
        sa.Column("exercise_id", sa.Integer(), sa.ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("kind", _enum("image_kind"), primary_key=True),
        sa.Column("path", sa.Text(), nullable=False),
    )

    # Célok szerinti besorolások (izomtömeg növelés, erő, mobilitás)
    op.create_table(
        "exercise_goals",
        sa.Column("exercise_id", sa.Integer(), sa.ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("goal", _enum("training_goal"), primary_key=True),
    )
    op.create_index("ix_exercise_goals_goal", "exercise_goals", ["goal"])

    # Gyakorlatok és címkék kapcsolata
    op.create_table(
        "exercise_tags",
        sa.Column("exercise_id", sa.Integer(), sa.ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.Integer(), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )


def downgrade() -> None:
    # Táblák törlése
    for table in (
        "exercise_tags",
        "exercise_goals",
        "exercise_images",
        "exercise_muscles",
        "exercise_translations",
        "exercises",
        "tags",
        "equipment",
        "muscles",
    ):
        op.drop_table(table)

    # Enum típusok törlése
    bind = op.get_bind()
    for name in ENUMS:
        _enum(name).drop(bind, checkfirst=True)
