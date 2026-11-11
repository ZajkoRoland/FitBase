from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.schemas import UserSettingsOut, UserSettingsUpdate
from app.services.account_state_service import AccountStateService

router = APIRouter(prefix="/settings", tags=["settings"])

_SETTINGS_FIELDS = {
    "notifications_enabled",
    "workout_reminder_enabled",
    "workout_reminder_window",
    "rest_day_reminder_enabled",
    "rest_day_reminder_window",
    "streak_reminder_enabled",
    "streak_reminder_window",
    "achievement_alerts_enabled",
    "sound_enabled",
    "vibration_enabled",
    "language",
    "units",
    "plan_structure",
    "read_notification_ids",
    "deleted_notification_ids",
}


@router.get("", response_model=UserSettingsOut)
def get_settings(user: CurrentUser, db: DbSession) -> UserSettingsOut:
    """Fetches notification and application settings strictly for the current account."""
    _, _, settings = AccountStateService.ensure_account_entities(db, user)
    db.commit()
    return UserSettingsOut.model_validate(settings)


@router.patch("", response_model=UserSettingsOut)
def update_settings(
    body: UserSettingsUpdate, user: CurrentUser, db: DbSession
) -> UserSettingsOut:
    """Updates notification and application settings strictly for the current account."""
    _, _, settings = AccountStateService.ensure_account_entities(db, user)
    changes = body.model_dump(exclude_unset=True)

    for field, value in changes.items():
        if field in _SETTINGS_FIELDS:
            setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return UserSettingsOut.model_validate(settings)

