from fastapi import APIRouter, status
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.errors import AppError
from app.models import WeeklyPlanDay
from app.schemas import PlanDay, PlanUpdate
from app.services.account_state_service import AccountStateService

router = APIRouter(prefix="/plan", tags=["plan"])


@router.get("", response_model=list[PlanDay])
def get_plan(user: CurrentUser, db: DbSession) -> list[WeeklyPlanDay]:
    stmt = (
        select(WeeklyPlanDay)
        .where(WeeklyPlanDay.user_id == user.id)
        .order_by(WeeklyPlanDay.day_of_week)
    )
    rows = list(db.scalars(stmt))
    if 0 < len(rows) < 7:
        rows = AccountStateService.ensure_weekly_plan_days(db, user.id)
        AccountStateService.sync_weekly_target_from_plan(db, user.id)
        db.commit()
        rows = list(db.scalars(stmt))
    return rows


@router.put("", response_model=list[PlanDay])
def upsert_plan(body: PlanUpdate, user: CurrentUser, db: DbSession) -> list[WeeklyPlanDay]:
    days = [d.day_of_week for d in body.days]
    if len(days) != len(set(days)):
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "validation_failed", "Duplicate day_of_week."
        )

    AccountStateService.ensure_account_entities(db, user)
    existing = {
        row.day_of_week: row
        for row in AccountStateService.ensure_weekly_plan_days(db, user.id)
    }
    for day in body.days:
        row = existing.get(day.day_of_week)
        if row is None:
            row = WeeklyPlanDay(user_id=user.id, day_of_week=day.day_of_week)
            db.add(row)
        row.day_name = day.day_name
        row.type = day.type
        row.workout_title = day.workout_title if day.type == "workout" else None
        row.workout_meta = day.workout_meta if day.type == "workout" else None
        row.exercises = day.exercises if day.type == "workout" else []

    AccountStateService.sync_weekly_target_from_plan(db, user.id)
    db.commit()
    return get_plan(user, db)
