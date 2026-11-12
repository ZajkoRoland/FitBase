import uuid
from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.models_catalog import BodyPart, Category, Difficulty, Goal, ImageKind

Username = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=30)]


# ---------- Auth ----------


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    username: Username


class LoginRequest(BaseModel):
    email: EmailStr
    # Nincs minimális hossz korlát: a migrált fiókok jelszavai rövidebbek is lehetnek
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=256)


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(min_length=8, max_length=128)


class ForgotPasswordResponse(BaseModel):
    message: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    auth_provider: str = "local"
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    user: UserOut


class UsernameAvailability(BaseModel):
    available: bool


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# ---------- Aktivitás és Haladás ----------


class ActivityWeekOut(BaseModel):
    label: str
    week_start: str | None = None
    count: int = 0
    height: int = 16
    target: int = 4


# ---------- Profil és Fiókstatisztikák ----------


class ProfileOut(BaseModel):
    # Felhasználói profil és statisztika adatok

    id: uuid.UUID
    username: str | None
    display_name: str | None
    avatar_url: str | None = None
    onboarding_completed: bool
    gender: str | None = None
    age: int | None = None
    height: float | None
    weight: float | None
    target_weight: float | None = None
    fitness_goal: str | None
    fitness_level: str | None
    streak: int = 0
    best_streak: int = 0
    sessions_this_week: int = 0
    total_workouts: int = 0
    weekly_target: int = 4
    estimated_calories_today: int = 0
    total_calories_burned: int = 0
    total_hours: int = 0
    total_minutes: int = 0
    last_workout_date: str | None = None
    completed_exercises_today: dict[str, Any] = Field(default_factory=dict)
    activity_history: list[ActivityWeekOut] = Field(default_factory=list)


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: Username | None = None
    display_name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)] | None = None
    avatar_url: str | None = Field(default=None, max_length=2048)
    onboarding_completed: bool | None = None
    gender: str | None = Field(default=None, max_length=32)
    age: int | None = Field(default=None, ge=10, le=120)
    height: float | None = Field(default=None, gt=0, lt=300)
    weight: float | None = Field(default=None, gt=0, lt=500)
    target_weight: float | None = Field(default=None, gt=0, lt=500)
    fitness_goal: str | None = Field(default=None, max_length=50)
    fitness_level: str | None = Field(default=None, max_length=50)
    weekly_target: int | None = Field(default=None, ge=1, le=7)
    completed_exercises_today: dict[str, Any] | None = None


class WorkoutCompleteRequest(BaseModel):
    calories_burned: int = Field(default=0, ge=0, le=10000)
    duration_minutes: int = Field(default=45, ge=1, le=600)
    exercises_completed: int = Field(default=1, ge=0, le=100)
    workout_title: str | None = Field(default=None, max_length=120)
    exercise_details: list[dict[str, Any]] = Field(default_factory=list)
    session_date: str | None = Field(default=None, max_length=16)


# ---------- Fiókbeállítások és Értesítési Preferenciák ----------


class UserSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    notifications_enabled: bool = True
    workout_reminder_enabled: bool = True
    workout_reminder_window: str = "07:00-10:00"
    rest_day_reminder_enabled: bool = True
    rest_day_reminder_window: str = "10:00-11:00"
    streak_reminder_enabled: bool = True
    streak_reminder_window: str = "17:00-19:30"
    achievement_alerts_enabled: bool = True
    sound_enabled: bool = True
    vibration_enabled: bool = True
    language: str = "auto"
    units: str = "metric"
    plan_structure: str = "1_week"
    read_notification_ids: list[str] = Field(default_factory=list)
    deleted_notification_ids: list[str] = Field(default_factory=list)
    updated_at: datetime | None = None


class UserSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    notifications_enabled: bool | None = None
    workout_reminder_enabled: bool | None = None
    workout_reminder_window: str | None = Field(default=None, max_length=32)
    rest_day_reminder_enabled: bool | None = None
    rest_day_reminder_window: str | None = Field(default=None, max_length=32)
    streak_reminder_enabled: bool | None = None
    streak_reminder_window: str | None = Field(default=None, max_length=32)
    achievement_alerts_enabled: bool | None = None
    sound_enabled: bool | None = None
    vibration_enabled: bool | None = None
    language: str | None = Field(default=None, max_length=16)
    units: str | None = Field(default=None, max_length=16)
    plan_structure: str | None = Field(default=None, max_length=32)
    read_notification_ids: list[str] | None = None
    deleted_notification_ids: list[str] | None = None


# ---------- kitüntetések ---------


class AchievementOut(BaseModel):
    id: str
    achievement_key: str
    title: str
    description: str
    category: Literal["streak", "workouts", "dedication", "special"]
    tier: Literal["bronze", "silver", "gold", "diamond"]
    icon: str
    current_value: int
    target_value: int
    unit: str
    is_unlocked: bool
    unlocked_at: datetime | None = None
    unlocked_date: str | None = None


class PlayerRankOut(BaseModel):
    level: int
    title: str
    unlocked_count: int
    total_count: int
    progress_percent: int


class AchievementsEnvelopeOut(BaseModel):
    achievements: list[AchievementOut]
    rank: PlayerRankOut


class WorkoutCompleteResponse(BaseModel):
    profile: ProfileOut
    newly_unlocked_achievements: list[AchievementOut] = Field(default_factory=list)


class WorkoutSessionOut(BaseModel):
    id: uuid.UUID
    session_date: str
    day_of_week: int
    workout_title: str | None = None
    exercises_completed: int = 0
    duration_minutes: int = 0
    calories_burned: int = 0
    exercise_details: list[dict[str, Any]] = Field(default_factory=list)
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Heti edzésterv ----------


class PlanDay(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day_of_week: int = Field(ge=0, le=6)
    day_name: str = Field(min_length=1, max_length=20)
    type: Literal["workout", "rest"]
    workout_title: str | None = None
    workout_meta: str | None = None
    exercises: list[dict] = Field(default_factory=list)


class PlanUpdate(BaseModel):
    days: list[PlanDay] = Field(min_length=1, max_length=7)


# ---------- AI Edző és Strukturált Kontextus ---------


class CoachChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class CoachChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    language: str | None = Field(
        default=None,
        description="Preferred language ('hu', 'en', or None/auto for language of user message)",
    )
    history: list[CoachChatMessage] = Field(default_factory=list)


class PlanModification(BaseModel):
    action: Literal[
        "swap_days","update_workout",
        "set_rest_day","generate_full_plan",
        "replace_exercise","add_exercise",
        "remove_exercise","update_exercise_parameters",
    ]
    source_day: int | None = Field(default=None, description="0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun")
    target_day: int | None = Field(default=None, description="0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun")
    day_of_week: int | None = Field(default=None, description="0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun")
    workout_title: str | None = None
    workout_meta: str | None = None
    exercises: list[dict[str, Any]] | None = None
    full_plan: list[dict[str, Any]] | None = Field(
        default=None, description="Complete 7-day schedule when action is generate_full_plan"
    )
    target_slug: str | None = Field(
        default=None, description="Slug of the exercise to replace, remove, or modify"
    )
    target_exercise_id: str | None = Field(
        default=None, description="ID of the specific exercise item to modify"
    )
    new_exercise: dict[str, Any] | None = Field(
        default=None, description="New exercise object for replace_exercise"
    )
    exercise: dict[str, Any] | None = Field(
        default=None, description="Exercise object for add_exercise"
    )
    sets: int | None = Field(default=None, description="Updated set count")
    reps: str | int | None = Field(default=None, description="Updated rep count or range")
    rest_seconds: int | None = Field(default=None, description="Updated rest time in seconds")
    weight_kg: float | None = Field(default=None, description="Optional target weight in kg")


class CoachChatResponse(BaseModel):
    reply_text: str
    quick_replies: list[str] = Field(default_factory=list)
    plan_modification: PlanModification | None = None


class AIUserContextOut(BaseModel):
    # Felhasználói kontextus az edző AI számára

    account_id: uuid.UUID
    identity: dict[str, Any]
    biometrics_and_bmi: dict[str, Any]
    consistency_and_streaks: dict[str, Any]
    weekly_schedule: list[dict[str, Any]]
    recent_workout_sessions: list[dict[str, Any]]
    activity_5_weeks: list[ActivityWeekOut]
    achievements_summary: dict[str, Any]
    preferences_and_notifications: dict[str, Any]
    recognized_patterns: list[str]


# ---------- Gyakorlatkatalógus ----------


class MuscleOut(BaseModel):
    slug: str
    name: str
    image_url: str | None


class EquipmentOut(BaseModel):
    slug: str
    name: str
    image_url: str | None


class ExerciseSummary(BaseModel):
    # Gyakorlatkártya a gyakorlattár listához

    slug: str
    name: str
    category: Category
    difficulty: Difficulty
    body_part: BodyPart
    equipment: EquipmentOut | None
    met: float
    primary_muscles: list[MuscleOut]
    # Abszolút, közvetlenül használható képkomponens. Kezdőpozíció előnézeti képe.
    image_url: str | None


class ExerciseDetail(ExerciseSummary):
    language: str = Field(description="Language the texts are actually in (falls back to 'en').")
    description: str | None
    instructions: list[str]
    tips: list[str]
    secondary_muscles: list[MuscleOut]
    images: dict[ImageKind, str] = Field(description="Pose -> absolute image URL")
    goals: list[Goal]
    tags: list[str]
    is_unilateral: bool
    is_bodyweight: bool
    variation_group: str | None


class ExercisePage(BaseModel):
    items: list[ExerciseSummary]
    total: int
    limit: int
    offset: int


class ExerciseFilterOptions(BaseModel):
    body_parts: list[BodyPart]
    difficulties: list[Difficulty]
    categories: list[Category]
    equipment: list[EquipmentOut]
    muscles: list[MuscleOut]
