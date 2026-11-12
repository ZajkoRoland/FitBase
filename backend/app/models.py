# PostgreSQL adatbázis táblák és kapcsolatok leképezése (SQLAlchemy ORM).
# Minden felhasználói adat a felhasználó egyedi UUID azonosítójához kapcsolódik.

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,Boolean,DateTime,Float,ForeignKey,Index,
    Integer,String,Text,UniqueConstraint,Uuid,func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

JsonType = JSON().with_variant(JSONB, "postgresql")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    auth_provider: Mapped[str] = mapped_column(Text, nullable=False, default="local")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    profile: Mapped["Profile"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )
    settings: Mapped["UserSettings | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )
    achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    workout_sessions: Mapped[list["WorkoutSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    username: Mapped[str | None] = mapped_column(Text)
    display_name: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="profile")
    stats: Mapped["UserStats | None"] = relationship(
        back_populates="profile", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )


class UserStats(Base):
    __tablename__ = "user_stats"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True
    )
    gender: Mapped[str | None] = mapped_column(String(32), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    fitness_goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    fitness_level: Mapped[str | None] = mapped_column(Text, nullable=True)
    streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sessions_this_week: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_workouts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    weekly_target: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    estimated_calories_today: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_calories_burned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_hours: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_workout_date: Mapped[str | None] = mapped_column(String(16), nullable=True)
    completed_exercises_today: Mapped[dict] = mapped_column(JsonType, default=dict, nullable=False)
    activity_history: Mapped[list] = mapped_column(JsonType, default=list, nullable=False)

    profile: Mapped[Profile] = relationship(back_populates="stats")


class UserSettings(Base):
    # Felhasználói beállítások (értesítések, hangok) táblája

    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    workout_reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    workout_reminder_window: Mapped[str] = mapped_column(
        String(32), default="07:00-10:00", nullable=False
    )
    rest_day_reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rest_day_reminder_window: Mapped[str] = mapped_column(
        String(32), default="10:00-11:00", nullable=False
    )
    streak_reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    streak_reminder_window: Mapped[str] = mapped_column(
        String(32), default="17:00-19:30", nullable=False
    )
    achievement_alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    vibration_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    language: Mapped[str] = mapped_column(String(16), default="auto", nullable=False)
    units: Mapped[str] = mapped_column(String(16), default="metric", nullable=False)
    plan_structure: Mapped[str] = mapped_column(String(32), default="1_week", nullable=False)
    read_notification_ids: Mapped[list] = mapped_column(JsonType, default=list, nullable=False)
    deleted_notification_ids: Mapped[list] = mapped_column(JsonType, default=list, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="settings")


class UserAchievement(Base):
    # Felhasználói kitüntetések és haladás táblája

    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_key", name="uq_user_achievement_key"),
        Index("ix_user_achievements_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    achievement_key: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    tier: Mapped[str] = mapped_column(String(32), nullable=False)
    icon: Mapped[str] = mapped_column(String(64), nullable=False)
    current_value: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    is_unlocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    unlocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="achievements")


class WorkoutSession(Base):
    # Befejezett edzések naplózási táblája

    __tablename__ = "workout_sessions"
    __table_args__ = (Index("ix_workout_sessions_user_date", "user_id", "session_date"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    session_date: Mapped[str] = mapped_column(String(16), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    workout_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    exercises_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    calories_burned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    exercise_details: Mapped[list] = mapped_column(JsonType, default=list, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="workout_sessions")


class WeeklyPlanDay(Base):
    __tablename__ = "user_weekly_plan"
    __table_args__ = (UniqueConstraint("user_id", "day_of_week"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    day_name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    workout_title: Mapped[str | None] = mapped_column(Text)
    workout_meta: Mapped[str | None] = mapped_column(Text)
    exercises: Mapped[list] = mapped_column(JsonType, default=list)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class PasswordResetCode(Base):
    # 6 jegyű ellenőrző kód a biztonságos jelszó-visszaállításhoz
    __tablename__ = "password_reset_codes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
