"""ORM models for the exercise catalogue (RepDB free dataset, 650 exercises).

Layout in short:
  * small fixed vocabularies (difficulty, category, ...) are native Postgres enums
  * open vocabularies (muscles, equipment, tags) are lookup tables
  * everything that is text in a human language lives in exercise_translations,
    so a Hungarian row can be added later without touching the schema
  * many-to-many links that carry extra data (muscle role, image kind) are
    modelled as association objects, plain links use a bare association table

The Alembic migrations stay the source of truth for the schema.
"""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm.collections import attribute_keyed_dict

from app.db import Base


# ---------- Enumerations ----------


class Category(StrEnum):
    STRENGTH = "strength"
    STRETCHING = "stretching"
    CARDIO = "cardio"
    PLYOMETRICS = "plyometrics"
    OLYMPIC = "olympic"


class ForceType(StrEnum):
    PUSH = "push"
    PULL = "pull"
    STATIC = "static"
    DYNAMIC = "dynamic"


class Mechanic(StrEnum):
    COMPOUND = "compound"
    ISOLATION = "isolation"


class Difficulty(StrEnum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class BodyPart(StrEnum):
    UPPER_LEGS = "upper_legs"
    LOWER_LEGS = "lower_legs"
    CORE = "core"
    FULL_BODY = "full_body"
    BACK = "back"
    CHEST = "chest"
    SHOULDERS = "shoulders"
    UPPER_ARMS = "upper_arms"
    LOWER_ARMS = "lower_arms"


class MuscleRole(StrEnum):
    PRIMARY = "primary"
    SECONDARY = "secondary"


class ImageKind(StrEnum):
    START = "start"
    PEAK = "peak"
    MAIN = "main"  # stretches and holds only have a single pose


class Goal(StrEnum):
    HYPERTROPHY = "hypertrophy"
    STRENGTH = "strength"
    ENDURANCE = "endurance"
    POWER = "power"
    MOBILITY = "mobility"
    REHABILITATION = "rehabilitation"
    CORE = "core"


def pg_enum(enum_cls: type[StrEnum], name: str) -> Enum:
    """Postgres enum that stores the member *values* ('upper_legs'), not the names."""
    return Enum(enum_cls, name=name, values_callable=lambda cls: [m.value for m in cls])


# ---------- Lookup tables ----------


class Muscle(Base):
    __tablename__ = "muscles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    image_path: Mapped[str | None] = mapped_column(Text)


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(48), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    image_path: Mapped[str | None] = mapped_column(Text)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)


# Plain many-to-many: an exercise either has a tag or it doesn't, nothing else to store.
exercise_tags = Table(
    "exercise_tags",
    Base.metadata,
    Column("exercise_id", ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


# ---------- Exercises ----------


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (CheckConstraint("met > 0", name="exercises_met_positive"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # URL-safe id from the dataset ('bulgarian-split-squat'); other tables reference the integer id.
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    category: Mapped[Category] = mapped_column(pg_enum(Category, "exercise_category"), index=True)
    force_type: Mapped[ForceType] = mapped_column(pg_enum(ForceType, "force_type"))
    mechanic: Mapped[Mechanic] = mapped_column(pg_enum(Mechanic, "mechanic"))
    difficulty: Mapped[Difficulty] = mapped_column(pg_enum(Difficulty, "difficulty"), index=True)
    body_part: Mapped[BodyPart] = mapped_column(pg_enum(BodyPart, "body_part"), index=True)

    # NULL = no equipment needed (197 of the 650 exercises).
    equipment_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipment.id", ondelete="RESTRICT"), index=True
    )
    is_unilateral: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_bodyweight: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Metabolic equivalent, used for calorie estimates: kcal = MET * kg * hours.
    met: Mapped[Decimal] = mapped_column(Numeric(3, 1), nullable=False)
    # Groups close variants together ('squat', 'row', ...); NULL for stand-alone moves.
    variation_group: Mapped[str | None] = mapped_column(String(40), index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    equipment: Mapped[Equipment | None] = relationship()
    translations: Mapped[dict[str, "ExerciseTranslation"]] = relationship(
        collection_class=attribute_keyed_dict("lang"),
        cascade="all, delete-orphan",
        back_populates="exercise",
    )
    muscle_links: Mapped[list["ExerciseMuscle"]] = relationship(
        cascade="all, delete-orphan", back_populates="exercise"
    )
    images: Mapped[list["ExerciseImage"]] = relationship(
        cascade="all, delete-orphan", back_populates="exercise"
    )
    goals: Mapped[list["ExerciseGoal"]] = relationship(cascade="all, delete-orphan")
    tags: Mapped[list[Tag]] = relationship(secondary=exercise_tags)


class ExerciseTranslation(Base):
    __tablename__ = "exercise_translations"
    __table_args__ = (
        CheckConstraint("lang = lower(lang) AND char_length(lang) = 2", name="translations_lang_code"),
        Index("exercise_translations_lang_name_idx", "lang", text("lower(name)")),
    )

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    lang: Mapped[str] = mapped_column(String(2), primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    # Ordered lists of short strings; a native array is simpler than a steps table here.
    instructions: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    tips: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)

    exercise: Mapped[Exercise] = relationship(back_populates="translations")


class ExerciseMuscle(Base):
    """Association object: which muscle an exercise works, and how much."""

    __tablename__ = "exercise_muscles"

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    muscle_id: Mapped[int] = mapped_column(
        ForeignKey("muscles.id", ondelete="RESTRICT"), primary_key=True, index=True
    )
    role: Mapped[MuscleRole] = mapped_column(pg_enum(MuscleRole, "muscle_role"), nullable=False)

    exercise: Mapped[Exercise] = relationship(back_populates="muscle_links")
    muscle: Mapped[Muscle] = relationship()


class ExerciseImage(Base):
    __tablename__ = "exercise_images"

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    kind: Mapped[ImageKind] = mapped_column(pg_enum(ImageKind, "image_kind"), primary_key=True)
    # Relative path inside the dataset folder. Near-identical variants share files on purpose.
    path: Mapped[str] = mapped_column(Text, nullable=False)

    exercise: Mapped[Exercise] = relationship(back_populates="images")


class ExerciseGoal(Base):
    __tablename__ = "exercise_goals"

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    goal: Mapped[Goal] = mapped_column(pg_enum(Goal, "training_goal"), primary_key=True, index=True)
