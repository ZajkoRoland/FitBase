from datetime import UTC, date, datetime

from fastapi import APIRouter, status
from sqlalchemy import func, select

from app.deps import CurrentUser, DbSession
from app.errors import AppError
from app.models import Profile, WorkoutSession
from app.schemas import (
    ActivityWeekOut,
    ProfileOut,
    ProfileUpdate,
    WorkoutCompleteRequest,
    WorkoutCompleteResponse,
    WorkoutSessionOut,
)
from app.services.account_state_service import AccountStateService
from app.services.achievement_service import AchievementDomainService

router = APIRouter(prefix="/profile", tags=["profile"])

_PROFILE_FIELDS = {"username", "display_name", "avatar_url", "onboarding_completed"}
_STATS_FIELDS = {
    "gender",
    "age",
    "height",
    "weight",
    "target_weight",
    "fitness_goal",
    "fitness_level",
    "weekly_target",
    "completed_exercises_today",
}


@router.get("", response_model=ProfileOut)
def get_profile(user: CurrentUser, db: DbSession) -> ProfileOut:
    profile, stats, _ = AccountStateService.ensure_account_entities(db, user)
    AchievementDomainService.sync_user_achievements(db, user.id, stats)
    db.commit()
    return AccountStateService.to_profile_out(db, profile, stats)


@router.patch("", response_model=ProfileOut)
def update_profile(body: ProfileUpdate, user: CurrentUser, db: DbSession) -> ProfileOut:
    profile, stats, _ = AccountStateService.ensure_account_entities(db, user)
    changes = body.model_dump(exclude_unset=True)

    new_username = changes.get("username")
    if new_username and new_username.lower() != (profile.username or "").lower():
        taken = db.scalar(
            select(Profile.id).where(
                func.lower(Profile.username) == new_username.lower(), Profile.id != user.id
            )
        )
        if taken is not None:
            raise AppError(status.HTTP_409_CONFLICT, "username_taken", "This username is already taken.")

    for field, value in changes.items():
        if field in _PROFILE_FIELDS:
            setattr(profile, field, value)
        elif field in _STATS_FIELDS:
            setattr(stats, field, value)

    AchievementDomainService.sync_user_achievements(db, user.id, stats)
    db.commit()
    return AccountStateService.to_profile_out(db, profile, stats)


@router.post("/workout-complete", response_model=WorkoutCompleteResponse)
def complete_workout(
    body: WorkoutCompleteRequest,
    user: CurrentUser,
    db: DbSession,
) -> WorkoutCompleteResponse:
    """Records a completed workout session strictly for the authenticated user account."""
    profile, stats, _ = AccountStateService.ensure_account_entities(db, user)

    now = datetime.now(UTC)
    today_iso = body.session_date or now.date().isoformat()
    try:
        session_date = date.fromisoformat(today_iso[:10])
    except (ValueError, TypeError):
        session_date = now.date()
    weekday = session_date.weekday()

    # Log historical session row for this user
    session_row = WorkoutSession(
        user_id=user.id,
        session_date=today_iso,
        day_of_week=weekday,
        workout_title=body.workout_title or "Workout Session",
        exercises_completed=body.exercises_completed,
        duration_minutes=body.duration_minutes,
        calories_burned=body.calories_burned,
        exercise_details=body.exercise_details,
    )
    db.add(session_row)

    # Update account-isolated streak and progression metrics
    AccountStateService.record_workout_streak(db, user.id, stats, session_date)
    stats.total_workouts = (stats.total_workouts or 0) + 1

    cal_burned = body.calories_burned if body.calories_burned > 0 else 250
    stats.estimated_calories_today = cal_burned
    stats.total_calories_burned = (stats.total_calories_burned or 0) + cal_burned

    dur_mins = body.duration_minutes if body.duration_minutes > 0 else 45
    base_mins = stats.total_minutes or ((stats.total_hours or 0) * 45)
    stats.total_minutes = base_mins + dur_mins
    stats.total_hours = max(1 if stats.total_minutes >= 30 else 0, round(stats.total_minutes / 60))
    stats.last_workout_date = session_date.isoformat()

    # Mark today's exercises finalized in database state
    current_daily = (
        dict(stats.completed_exercises_today)
        if isinstance(stats.completed_exercises_today, dict)
        else {}
    )
    current_daily["date"] = today_iso
    current_daily["finalized"] = True
    stats.completed_exercises_today = current_daily

    # Persist updated 5-week activity snapshot
    db.flush()
    activity_5w = AccountStateService.compute_5_week_activity(db, user.id, stats)
    stats.activity_history = [item.model_dump() for item in activity_5w]

    # Evaluate and persist achievements for this account
    _, newly_unlocked, _ = AchievementDomainService.sync_user_achievements(db, user.id, stats)

    db.commit()
    profile_out = AccountStateService.to_profile_out(db, profile, stats)
    return WorkoutCompleteResponse(
        profile=profile_out,
        newly_unlocked_achievements=newly_unlocked,
    )


@router.post("/reset-stats", response_model=ProfileOut)
def reset_profile_stats(user: CurrentUser, db: DbSession) -> ProfileOut:
    """Resets workout progression counters strictly for the authenticated user account."""
    profile, stats, _ = AccountStateService.ensure_account_entities(db, user)
    stats.streak = 0
    stats.last_workout_date = None
    stats.sessions_this_week = 0
    stats.estimated_calories_today = 0
    stats.total_hours = 0
    stats.total_minutes = 0
    stats.completed_exercises_today = {}
    db.commit()
    return AccountStateService.to_profile_out(db, profile, stats)


@router.get("/activity", response_model=list[ActivityWeekOut])
def get_activity_history(user: CurrentUser, db: DbSession) -> list[ActivityWeekOut]:
    """Returns the authenticated user's 5-week workout activity history from the database."""
    _, stats, _ = AccountStateService.ensure_account_entities(db, user)
    db.commit()
    return AccountStateService.compute_5_week_activity(db, user.id, stats)


@router.get("/sessions", response_model=list[WorkoutSessionOut])
def get_workout_sessions(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = 60,
) -> list[WorkoutSession]:
    """Returns the authenticated user's historical workout sessions, newest first."""
    stmt = (
        select(WorkoutSession)
        .where(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.session_date.desc(), WorkoutSession.completed_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))
