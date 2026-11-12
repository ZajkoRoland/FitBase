# Gyakorlatkatalógus adatbázis modelljei (izmok, eszközök, gyakorlatok és fordítások)

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


#típusok (kategóriák, nehézség, testrészek)


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
    MAIN = "main"  # Nyújtásoknál és tartásoknál egyetlen fázis van


class Goal(StrEnum):
    HYPERTROPHY = "hypertrophy"
    STRENGTH = "strength"
    ENDURANCE = "endurance"
    POWER = "power"
    MOBILITY = "mobility"
    REHABILITATION = "rehabilitation"
    CORE = "core"


def pg_enum(enum_cls: type[StrEnum], name: str) -> Enum:
    # A postgres enum értékek szerinti leképezése
    return Enum(enum_cls, name=name, values_callable=lambda cls: [m.value for m in cls])


# Törzsadattáblák (izmok, eszközök, címkék)


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


# Gyakorlatok és címkék több-a-többhöz kapcsolata
exercise_tags = Table(
    "exercise_tags",
    Base.metadata,
    Column("exercise_id", ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


# Gyakorlatok és kapcsolódó táblák


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (CheckConstraint("met > 0", name="exercises_met_positive"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Egyedi szöveges azonosító (slug)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    category: Mapped[Category] = mapped_column(pg_enum(Category, "exercise_category"), index=True)
    force_type: Mapped[ForceType] = mapped_column(pg_enum(ForceType, "force_type"))
    mechanic: Mapped[Mechanic] = mapped_column(pg_enum(Mechanic, "mechanic"))
    difficulty: Mapped[Difficulty] = mapped_column(pg_enum(Difficulty, "difficulty"), index=True)
    body_part: Mapped[BodyPart] = mapped_column(pg_enum(BodyPart, "body_part"), index=True)

    # NULL érték esetén nem szükséges hozzá felszerelés
    equipment_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipment.id", ondelete="RESTRICT"), index=True
    )
    is_unilateral: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_bodyweight: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # MET érték a kalóriaszámításhoz (kcal = MET * testsúly * óra)
    met: Mapped[Decimal] = mapped_column(Numeric(3, 1), nullable=False)
    # Variációk csoportosítása (pl. guggolások, fekvenyomások)
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
    # Lépések és edzési tippek listája
    instructions: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    tips: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)

    exercise: Mapped[Exercise] = relationship(back_populates="translations")


class ExerciseMuscle(Base):
    # Gyakorlat és megdolgozott izomcsoport kapcsolata
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
    # Képfájl relatív elérési útja
    path: Mapped[str] = mapped_column(Text, nullable=False)

    exercise: Mapped[Exercise] = relationship(back_populates="images")


class ExerciseGoal(Base):
    __tablename__ = "exercise_goals"

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    goal: Mapped[Goal] = mapped_column(pg_enum(Goal, "training_goal"), primary_key=True, index=True)
