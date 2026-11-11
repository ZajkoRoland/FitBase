"""Analytics and progressive overload progress tracking router.

Provides endpoints for tracking exercise performance over time (1RM, volume, max weight)
aggregated from account-isolated WorkoutSession records.
"""

from typing import Any

from fastapi import APIRouter
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import WorkoutSession
from app.models_catalog import Exercise, ExerciseTranslation

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _calculate_epley_1rm(weight_kg: float, reps: int) -> float:
    """Calculates estimated 1RM using the standard Epley formula."""
    if weight_kg <= 0 or reps <= 0:
        return 0.0
    if reps == 1:
        return float(weight_kg)
    return round(float(weight_kg) * (1.0 + float(reps) / 30.0), 1)


@router.get("/progress/{slug}")
def get_exercise_progress(
    slug: str,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """Returns the progression timeline (1RM, volume, max weight) for an exercise.

    Aggregated strictly from the authenticated user's historical workout sessions.
    """
    clean_slug = slug.strip().lower()

    stmt = (
        select(WorkoutSession)
        .where(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.session_date.asc(), WorkoutSession.completed_at.asc())
    )
    sessions = db.scalars(stmt).all()

    history: list[dict[str, Any]] = []

    for s in sessions:
        details = s.exercise_details or []
        for ex in details:
            if not isinstance(ex, dict):
                continue

            ex_slug = str(ex.get("slug") or "").strip().lower()
            ex_title = str(ex.get("title") or "").strip().lower()
            ex_id = str(ex.get("id") or "").strip().lower()

            if ex_slug == clean_slug or ex_title == clean_slug or clean_slug in (ex_slug, ex_title):
                raw_sets = ex.get("sets") or []
                max_weight = 0.0
                best_1rm = float(ex.get("estimated_1rm") or 0.0)
                total_volume = float(ex.get("total_volume_kg") or 0.0)
                cleaned_sets = []

                if isinstance(raw_sets, list) and len(raw_sets) > 0:
                    calculated_vol = 0.0
                    for st in raw_sets:
                        if isinstance(st, dict):
                            reps = int(st.get("reps") or 0)
                            w = float(st.get("weight_kg") or st.get("weight") or 0.0)
                            max_weight = max(max_weight, w)
                            st_1rm = _calculate_epley_1rm(w, reps)
                            best_1rm = max(best_1rm, st_1rm)
                            calculated_vol += w * reps
                            cleaned_sets.append({
                                "set_number": st.get("set_number", len(cleaned_sets) + 1),
                                "reps": reps,
                                "weight_kg": w,
                                "estimated_1rm": st_1rm,
                            })
                    if total_volume <= 0.0:
                        total_volume = calculated_vol
                else:
                    # Fallback if exercise was logged with details string
                    w = float(ex.get("weight_kg") or 0.0)
                    reps = int(ex.get("target_reps") or 10)
                    max_weight = w
                    best_1rm = max(best_1rm, _calculate_epley_1rm(w, reps))

                history.append({
                    "date": s.session_date,
                    "session_id": str(s.id),
                    "workout_title": s.workout_title or "Edzés",
                    "max_weight_kg": round(max_weight, 1),
                    "estimated_1rm_kg": round(best_1rm, 1),
                    "total_volume_kg": round(total_volume, 1),
                    "sets_count": len(cleaned_sets) if cleaned_sets else int(ex.get("target_sets") or 3),
                    "sets": cleaned_sets,
                })

    return {
        "slug": clean_slug,
        "history": history,
        "total_sessions_logged": len(history),
    }


@router.get("/progress-exercises")
def get_logged_exercises(
    current_user: CurrentUser,
    db: DbSession,
) -> list[dict[str, str]]:
    """Returns the list of exercises that the authenticated user has logged,

    plus default popular exercises so the user can inspect charts right away.
    """
    stmt = (
        select(WorkoutSession)
        .where(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.session_date.desc())
    )
    sessions = db.scalars(stmt).all()

    seen_slugs: dict[str, str] = {}

    for s in sessions:
        for ex in (s.exercise_details or []):
            if isinstance(ex, dict):
                slug = str(ex.get("slug") or "").strip().lower()
                title = str(ex.get("title") or "").strip()
                if slug and slug not in seen_slugs:
                    seen_slugs[slug] = title or slug

    # Add popular core exercises if not present yet
    popular_defaults = [
        ("bench-press", "Barbell Bench Press"),
        ("squat", "Barbell Squat"),
        ("deadlift", "Deadlift"),
        ("dumbbell-shoulder-press", "Dumbbell Shoulder Press"),
        ("pull-up", "Pull-Up"),
        ("push-up", "Push-Up"),
        ("barbell-row", "Barbell Row"),
        ("bicep-curl", "Bicep Curl"),
        ("dips", "Dips"),
        ("lunge", "Lunge"),
        ("leg-curl", "Leg Curl"),
        ("plank", "Plank"),
    ]

    for slug, title in popular_defaults:
        if slug not in seen_slugs:
            seen_slugs[slug] = title

    return [{"slug": s, "title": t} for s, t in seen_slugs.items()]

