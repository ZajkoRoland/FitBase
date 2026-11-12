from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.schemas import AchievementsEnvelopeOut
from app.services.account_state_service import AccountStateService
from app.services.achievement_service import AchievementDomainService

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=AchievementsEnvelopeOut)
def get_achievements(user: CurrentUser, db: DbSession) -> AchievementsEnvelopeOut:
    """Kitüntetések lekérése a bejelentkezett felhasználóhoz."""
    _, stats, _ = AccountStateService.ensure_account_entities(db, user)
    achievements, _, rank = AchievementDomainService.sync_user_achievements(db, user.id, stats)
    db.commit()
    return AchievementsEnvelopeOut(achievements=achievements, rank=rank)


@router.post("/sync", response_model=AchievementsEnvelopeOut)
def sync_achievements(user: CurrentUser, db: DbSession) -> AchievementsEnvelopeOut:
    """Kitüntetések szinkronizálása és feloldása a bejelentkezett felhasználónál."""
    _, stats, _ = AccountStateService.ensure_account_entities(db, user)
    achievements, _, rank = AchievementDomainService.sync_user_achievements(db, user.id, stats)
    db.commit()
    return AchievementsEnvelopeOut(achievements=achievements, rank=rank)

