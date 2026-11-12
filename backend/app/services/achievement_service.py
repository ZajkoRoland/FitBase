# Mérföldkövek és jelvények (badge-ek) kiszámítása és mentése a felhasználó edzései alapján.

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import UserAchievement, UserStats
from app.schemas import AchievementOut, PlayerRankOut

CategoryType = Literal["streak", "workouts", "dedication", "special"]
TierType = Literal["bronze", "silver", "gold", "diamond"]


@dataclass(frozen=True)
class AchievementBlueprint:
    # Egy megszerezhető jelvény szabályai és feltételei

    key: str
    title: str
    description: str
    category: CategoryType
    tier: TierType
    icon: str
    target_value: int
    unit: str
    metric_source: Literal["total_workouts", "best_streak", "total_hours", "weekly_goal"]


class AchievementDomainService:
    # Kitüntetések kiértékelése, mentése és rangszámítás

    BLUEPRINTS: tuple[AchievementBlueprint, ...] = (
        AchievementBlueprint(
            key="first_workout",
            title="First Step",
            description="Complete your first workout session in FitBase.",
            category="workouts",
            tier="bronze",
            icon="footsteps",
            target_value=1,
            unit="workout",
            metric_source="total_workouts",
        ),
        AchievementBlueprint(
            key="streak_3",
            title="Spark",
            description="Keep your momentum with an active 3-day streak.",
            category="streak",
            tier="bronze",
            icon="flame",
            target_value=3,
            unit="days",
            metric_source="best_streak",
        ),
        AchievementBlueprint(
            key="streak_7",
            title="Unstoppable",
            description="Achieve a full 7-day uninterrupted workout streak.",
            category="streak",
            tier="silver",
            icon="flash",
            target_value=7,
            unit="days",
            metric_source="best_streak",
        ),
        AchievementBlueprint(
            key="streak_14",
            title="Iron Habit",
            description="Reach a formidable 14-day training streak.",
            category="streak",
            tier="gold",
            icon="shield-checkmark",
            target_value=14,
            unit="days",
            metric_source="best_streak",
        ),
        AchievementBlueprint(
            key="workouts_5",
            title="High Five",
            description="Complete 5 total training sessions.",
            category="workouts",
            tier="bronze",
            icon="hand-left",
            target_value=5,
            unit="workouts",
            metric_source="total_workouts",
        ),
        AchievementBlueprint(
            key="workouts_10",
            title="Dedication",
            description="Finish 10 intense workout sessions.",
            category="workouts",
            tier="silver",
            icon="barbell",
            target_value=10,
            unit="workouts",
            metric_source="total_workouts",
        ),
        AchievementBlueprint(
            key="hours_5",
            title="Hourglass",
            description="Accumulate 5 total hours of focused training.",
            category="dedication",
            tier="silver",
            icon="hourglass",
            target_value=5,
            unit="hours",
            metric_source="total_hours",
        ),
        AchievementBlueprint(
            key="hours_20",
            title="Endurance Beast",
            description="Log 20 total training hours on your journey.",
            category="dedication",
            tier="gold",
            icon="speedometer",
            target_value=20,
            unit="hours",
            metric_source="total_hours",
        ),
        AchievementBlueprint(
            key="goal_crusher",
            title="Goal Crusher",
            description="Hit 100% of your weekly workout target.",
            category="special",
            tier="gold",
            icon="star",
            target_value=4,
            unit="sessions",
            metric_source="weekly_goal",
        ),
        AchievementBlueprint(
            key="century_club",
            title="Century Club",
            description="Legendary status: complete 100 workouts.",
            category="workouts",
            tier="diamond",
            icon="diamond",
            target_value=100,
            unit="workouts",
            metric_source="total_workouts",
        ),
    )

    @classmethod
    def _resolve_metric(cls, bp: AchievementBlueprint, stats: UserStats) -> tuple[int, int]:
        # Visszaadja az aktuális és célértéket a jelvény feltételei alapján
        total_workouts = max(stats.total_workouts or 0, stats.sessions_this_week or 0)
        best_streak = max(stats.best_streak or 0, stats.streak or 0)
        total_minutes = stats.total_minutes or ((stats.total_hours or 0) * 60)
        total_hours = max(stats.total_hours or 0, total_minutes // 60)
        weekly_target = max(stats.weekly_target or 4, 1)
        sessions_this_week = stats.sessions_this_week or 0

        if bp.metric_source == "total_workouts":
            return min(total_workouts, bp.target_value), bp.target_value
        if bp.metric_source == "best_streak":
            return min(best_streak, bp.target_value), bp.target_value
        if bp.metric_source == "total_hours":
            return min(total_hours, bp.target_value), bp.target_value
        if bp.metric_source == "weekly_goal":
            return min(sessions_this_week, weekly_target), weekly_target
        return 0, bp.target_value

    @classmethod
    def sync_user_achievements(
        cls,
        db: Session,
        user_id: uuid.UUID,
        stats: UserStats,
    ) -> tuple[list[AchievementOut], list[AchievementOut], PlayerRankOut]:
        # Szinkronizálja és elmenti a kitüntetéseket az adatbázisban
        existing_rows = {
            row.achievement_key: row
            for row in db.scalars(
                select(UserAchievement).where(UserAchievement.user_id == user_id)
            )
        }

        now = datetime.now(UTC)
        all_out: list[AchievementOut] = []
        newly_unlocked: list[AchievementOut] = []

        for bp in cls.BLUEPRINTS:
            current_val, target_val = cls._resolve_metric(bp, stats)
            qualified = current_val >= target_val

            row = existing_rows.get(bp.key)
            was_unlocked = bool(row.is_unlocked) if row else False

            if row is None:
                row = UserAchievement(
                    user_id=user_id,
                    achievement_key=bp.key,
                    title=bp.title,
                    description=bp.description,
                    category=bp.category,
                    tier=bp.tier,
                    icon=bp.icon,
                    current_value=current_val,
                    target_value=target_val,
                    unit=bp.unit,
                    is_unlocked=qualified,
                    unlocked_at=now if qualified else None,
                )
                db.add(row)
            else:
                row.title = bp.title
                row.description = bp.description
                row.category = bp.category
                row.tier = bp.tier
                row.icon = bp.icon
                row.target_value = target_val
                row.unit = bp.unit
                # Preserve highest achieved progress if already unlocked
                row.current_value = target_val if row.is_unlocked else current_val
                if qualified and not row.is_unlocked:
                    row.is_unlocked = True
                    row.unlocked_at = now
                    row.current_value = target_val

            unlocked_date_str = None
            if row.is_unlocked:
                dt = row.unlocked_at or now
                unlocked_date_str = dt.strftime("%b %d, %Y")

            item_out = AchievementOut(
                id=bp.key,
                achievement_key=bp.key,
                title=row.title,
                description=row.description,
                category=bp.category,
                tier=bp.tier,
                icon=row.icon,
                current_value=row.current_value,
                target_value=row.target_value,
                unit=row.unit,
                is_unlocked=row.is_unlocked,
                unlocked_at=row.unlocked_at,
                unlocked_date=unlocked_date_str,
            )
            all_out.append(item_out)
            if row.is_unlocked and not was_unlocked:
                newly_unlocked.append(item_out)

        db.flush()
        rank = cls.calculate_player_rank(all_out)
        return all_out, newly_unlocked, rank

    @staticmethod
    def calculate_player_rank(achievements: list[AchievementOut]) -> PlayerRankOut:
        # Kiszámítja a felhasználó szintjét a feloldott jelvények alapján
        total_count = len(achievements)
        unlocked_count = sum(1 for a in achievements if a.is_unlocked)
        progress_percent = round((unlocked_count / total_count) * 100) if total_count > 0 else 0

        if unlocked_count >= 8:
            level, title = 5, "Iron Legend"
        elif unlocked_count >= 6:
            level, title = 4, "Master of Strength"
        elif unlocked_count >= 4:
            level, title = 3, "Dedicated Warrior"
        elif unlocked_count >= 2:
            level, title = 2, "Rising Contender"
        else:
            level, title = 1, "Apprentice Athlete"

        return PlayerRankOut(
            level=level,
            title=title,
            unlocked_count=unlocked_count,
            total_count=total_count,
            progress_percent=progress_percent,
        )

