# A felhasználói profil, edzésstatisztikák és beállítások kezelése.
# Minden lekérdezést szigorúan a bejelentkezett user_id alapján szűrünk.
import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import desc, select

from sqlalchemy.orm import Session

from app.models import (
Profile,
    User,
    UserSettings,
    UserStats,
    WeeklyPlanDay,
    WorkoutSession,
)
from app.schemas import (
    AIUserContextOut,
    ActivityWeekOut,
    ProfileOut,
    UserSettingsOut,
)
from app.services.achievement_service import AchievementDomainService


class AccountStateService:
    # Felhasználói adatok betöltése és edzéselőzmények kiszámítása

    DAY_NAMES_HU = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"]
    DAY_CODES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    @classmethod
    def ensure_account_entities(
        cls, db: Session, user: User
    ) -> tuple[Profile, UserStats, UserSettings]:
        # Gondoskodik arról, hogy a Profile, UserStats és UserSettings létezzen a felhasználóhoz
        profile = db.get(Profile, user.id)
        if profile is None:
            fallback_name = user.email.split("@")[0] if user.email else "Athlete"
            profile = Profile(
                id=user.id,
                username=fallback_name[:30],
                display_name=fallback_name[:60],
                onboarding_completed=False,
            )
            db.add(profile)
            db.flush()

        stats = db.get(UserStats, user.id)
        if stats is None:
            stats = UserStats(user_id=user.id)
            db.add(stats)
            db.flush()

        settings = db.get(UserSettings, user.id)
        if settings is None:
            settings = UserSettings(user_id=user.id)
            db.add(settings)
            db.flush()

        return profile, stats, settings

    @classmethod
    def ensure_weekly_plan_days(
        cls, db: Session, user_id: uuid.UUID
    ) -> list[WeeklyPlanDay]:
        # Gondoskodik arról,, hogy a hét mind a 7 napja létezzen az edzéstervben
        existing = {
            row.day_of_week: row
            for row in db.scalars(
                select(WeeklyPlanDay).where(WeeklyPlanDay.user_id == user_id)
            )
        }
        result: list[WeeklyPlanDay] = []
        for idx in range(7):
            row = existing.get(idx)
            if row is None:
                row = WeeklyPlanDay(
                    user_id=user_id,
                    day_of_week=idx,
                    day_name=cls.DAY_CODES[idx],
                    type="workout",
                    workout_title="Workout",
                    workout_meta="0 exercises",
                    exercises=[],
                )
                db.add(row)
            else:
                if not row.day_name:
                    row.day_name = cls.DAY_CODES[idx]
                if row.type == "workout":
                    if row.exercises is None:
                        row.exercises = []
                    if not row.workout_title:
                        row.workout_title = "Workout"
                    if not row.workout_meta:
                        ex_cnt = len(row.exercises)
                        row.workout_meta = f"{ex_cnt} {'exercise' if ex_cnt == 1 else 'exercises'}"
                else:
                    row.exercises = []
            result.append(row)
        db.flush()
        return result

    @classmethod
    def sync_weekly_target_from_plan(
        cls, db: Session, user_id: uuid.UUID
    ) -> int:
        # Újraszámolja a heti edzéscélt a betervezett napok alapján
        days = cls.ensure_weekly_plan_days(db, user_id)
        workout_days_count = sum(1 for d in days if d.type == "workout")
        new_target = max(1, workout_days_count)

        stats = db.get(UserStats, user_id)
        if stats is None:
            stats = UserStats(user_id=user_id, weekly_target=new_target)
            db.add(stats)
        else:
            stats.weekly_target = new_target
        db.flush()
        return new_target

    @classmethod
    def compute_5_week_activity(
        cls, db: Session, user_id: uuid.UUID, stats: UserStats
    ) -> list[ActivityWeekOut]:
        # Kiszámítja az elmúlt 5 hét edzésaktivitását a naplóbol
        today = datetime.now(UTC).date()
        current_monday = today - timedelta(days=today.weekday())
        weekly_target = max(stats.weekly_target or 4, 1)

        # Az elmúlt 5 hét hétfői kezdődátumainak kiszámítása
        week_mondays: list[date] = [
            current_monday - timedelta(weeks=w) for w in range(4, -1, -1)
        ]
        oldest_monday_iso = week_mondays[0].isoformat()

        # A fiók befejezett edzéseinek lekérdezése az elmúlt 5 hétből
        stmt = select(WorkoutSession).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.session_date >= oldest_monday_iso,
        )
        sessions = list(db.scalars(stmt))

        counts_by_week: dict[str, int] = {m.isoformat(): 0 for m in week_mondays}
        for sess in sessions:
            try:
                s_date = date.fromisoformat(sess.session_date[:10])
                s_monday = (s_date - timedelta(days=s_date.weekday())).isoformat()
                if s_monday in counts_by_week:
                    counts_by_week[s_monday] += 1
            except ValueError:
                continue

        # A korábbi előzményadatok összefésülése csak a lezárt hetekre vonatkozik
        current_monday_iso = current_monday.isoformat()
        if isinstance(stats.activity_history, list):
            for entry in stats.activity_history:
                if isinstance(entry, dict):
                    wk_start = entry.get("week_start")
                    cnt = entry.get("count")
                    if (
                        isinstance(wk_start, str)
                        and wk_start in counts_by_week
                        and wk_start != current_monday_iso
                        and isinstance(cnt, int)
                    ):
                        counts_by_week[wk_start] = max(counts_by_week[wk_start], cnt)

        # Az aktuális hétnél kizárólag a valós naplózott edzéseket vesszük figyelembe
        real_current_week_sessions = counts_by_week.get(current_monday_iso, 0)
        stats.sessions_this_week = real_current_week_sessions
        counts_by_week[current_monday_iso] = real_current_week_sessions

        result: list[ActivityWeekOut] = []
        for m_date in week_mondays:
            m_iso = m_date.isoformat()
            cnt = counts_by_week.get(m_iso, 0)
            label = f"{m_date.strftime('%b')} {m_date.day}"
            bar_height = max(16, min(96, round((cnt / 7) * 96)))
            result.append(
                ActivityWeekOut(
                    label=label,
                    week_start=m_iso,
                    count=cnt,
                    height=bar_height,
                    target=weekly_target,
                )
            )
        return result

    @classmethod
    def evaluate_active_streak(
        cls,
        db: Session,
        user_id: uuid.UUID,
        stats: UserStats,
        current_date: date | None = None,
    ) -> int:
        # Ellenőrzi, hogy a felhasználó edzéssorozata él még, vagy megszakadt
        if current_date is None:
            current_date = datetime.now(UTC).date()

        current_streak = stats.streak or 0
        if current_streak <= 0:
            return 0

        if not stats.last_workout_date:
            stats.streak = 0
            return 0

        try:
            last_date = date.fromisoformat(stats.last_workout_date[:10])
        except (ValueError, TypeError):
            stats.streak = 0
            return 0

        days_diff = (current_date - last_date).days

        # Ma volt edzés (vagy a kliens órája előrébb jár)
        if days_diff <= 0:
            return current_streak

        # Tegnap volt edzés -> a széria még él (a mai nap még tart)
        if days_diff == 1:
            return current_streak

        # Vesztett széria mindenképp
        if days_diff > 7:
            stats.streak = 0
            return 0

        # A köztes naptári napok ellenőrzése az utolsó edzés és a mai nap között
        plan_days = cls.ensure_weekly_plan_days(db, user_id)
        plan_by_weekday = {d.day_of_week: d.type for d in plan_days}

        for offset in range(1, days_diff):
            check_date = last_date + timedelta(days=offset)
            weekday_idx = check_date.weekday()
            day_type = plan_by_weekday.get(weekday_idx, "workout")
            if day_type == "workout":
                # Tervezett edzésnap maradt ki, a széria megszakadt
                stats.streak = 0
                return 0

        # Minden köztes nap pihenőnap volt a terv szerint -> a széria megmaradt!
        return current_streak

    @classmethod
    def record_workout_streak(
        cls,
        db: Session,
        user_id: uuid.UUID,
        stats: UserStats,
        current_date: date | None = None,
    ) -> tuple[int, int]:
        # Frissíti az edzéssorozatot egy edzés elvégzése után
        if current_date is None:
            current_date = datetime.now(UTC).date()

        today_iso = current_date.isoformat()

        already_worked_out_today = False
        if stats.last_workout_date:
            try:
                last_d = date.fromisoformat(stats.last_workout_date[:10])
                if last_d == current_date:
                    already_worked_out_today = True
            except (ValueError, TypeError):
                pass

        if already_worked_out_today:
            new_streak = max(stats.streak or 1, 1)
        else:
            prior_streak = cls.evaluate_active_streak(db, user_id, stats, current_date)
            if prior_streak > 0:
                new_streak = prior_streak + 1
            else:
                new_streak = 1

        stats.streak = new_streak
        stats.best_streak = max(stats.best_streak or 0, new_streak)
        stats.last_workout_date = today_iso
        return stats.streak, stats.best_streak

    @classmethod
    def to_profile_out(
        cls, db: Session, profile: Profile, stats: UserStats
    ) -> ProfileOut:
        # Összefésüli a profil és statisztika adatokat a kimeneti modellbe
        cls.evaluate_active_streak(db, profile.id, stats)
        activity_5_weeks = cls.compute_5_week_activity(db, profile.id, stats)
        stats.activity_history = [item.model_dump() for item in activity_5_weeks]

        streak = stats.streak or 0
        best_streak = max(stats.best_streak or 0, streak)
        sessions_this_week = stats.sessions_this_week or 0
        total_workouts = max(stats.total_workouts or 0, sessions_this_week)
        weekly_target = stats.weekly_target or 4
        total_hours = stats.total_hours or 0
        total_minutes = stats.total_minutes or (total_hours * 45 if total_hours > 0 else 0)
        estimated_calories_today = stats.estimated_calories_today or 0
        total_calories_burned = max(
            stats.total_calories_burned or 0, estimated_calories_today
        )

        return ProfileOut(
            id=profile.id,
            username=profile.username,
            display_name=profile.display_name,
            avatar_url=profile.avatar_url,
            onboarding_completed=bool(profile.onboarding_completed),
            gender=stats.gender,
            age=stats.age,
            
            height=stats.height,
            weight=stats.weight,
            target_weight=stats.target_weight,
            fitness_goal=stats.fitness_goal,
            fitness_level=stats.fitness_level,
            streak=streak,
            best_streak=best_streak,
            sessions_this_week=sessions_this_week,
            total_workouts=total_workouts,
            weekly_target=weekly_target,
            estimated_calories_today=estimated_calories_today,
            total_calories_burned=total_calories_burned,
            total_hours=total_hours,
            total_minutes=total_minutes,
            last_workout_date=stats.last_workout_date,
            completed_exercises_today=(
                stats.completed_exercises_today
                if isinstance(stats.completed_exercises_today, dict)
                else {}
            ),
            activity_history=activity_5_weeks,
        )

    @staticmethod
    def compute_bmi_info(weight: float | None, height: float | None) -> dict[str, Any]:
        # Kiszámítja a BMI értéket a WHO szabvány szerint
        if not weight or not height or weight <= 0 or height <= 0:
            return {"bmi": None, "category": None}
        h_m = height / 100.0
        bmi = round(weight / (h_m * h_m), 1)
        if bmi < 18.5:
            category = "Underweight"
        elif bmi < 25.0:
            category = "Normal weight"
        elif bmi < 30.0:
            category = "Overweight"
        else:
            category = "Obese"
        return {"bmi": bmi, "category": category}

    @classmethod
    def build_ai_user_context(cls, db: Session, user: User) -> AIUserContextOut:
        # Összeállítja a felhasználói kontextust a személyi edző AI számára
        profile, stats, settings = cls.ensure_account_entities(db, user)
        profile_out = cls.to_profile_out(db, profile, stats)
        achievements, _, player_rank = AchievementDomainService.sync_user_achievements(
            db, user.id, stats
        )

        # A 7 napos heti edzésterv betöltése a fiókhoz
        plan_days_by_idx: dict[int, WeeklyPlanDay] = {}
        stmt_plan = (
            select(WeeklyPlanDay)
            .where(WeeklyPlanDay.user_id == user.id)
            .order_by(WeeklyPlanDay.day_of_week)
        )
        for row in db.scalars(stmt_plan):
            plan_days_by_idx[row.day_of_week] = row

        weekly_schedule: list[dict[str, Any]] = []
        workout_days_count = 0
        for idx in range(7):
            pday = plan_days_by_idx.get(idx)
            d_hu = cls.DAY_NAMES_HU[idx]
            d_code = cls.DAY_CODES[idx]
            if pday is not None and pday.type == "rest":
                weekly_schedule.append({
                    "day_index": idx,
                    "day_name": f"{d_hu} ({d_code})",
                    "type": "rest",
                    "workout_title": "Pihenőnap (Rest Day)",
                    "workout_meta": "",
                    "exercise_count": 0,
                    "exercises": [],
                    "exercises_detail": [],
                })
            else:
                workout_days_count += 1
                exercises = (pday.exercises or []) if pday else []
                ex_list = [
                    f"{e.get('title', 'Exercise')} ({e.get('details', '')})"
                    for e in exercises
                    if isinstance(e, dict)
                ]
                exercises_detail = [
                    {
                        "id": str(e.get("id") or ""),
                        "slug": str(e.get("slug") or ""),
                        "title": str(e.get("title") or "Exercise"),
                        "details": str(e.get("details") or ""),
                        "badgeText": str(e.get("badgeText") or ""),
                    }
                    for e in exercises
                    if isinstance(e, dict)
                ]
                weekly_schedule.append({
                    "day_index": idx,
                    "day_name": f"{d_hu} ({d_code})",
                    "type": "workout",
                    "workout_title": (pday.workout_title if pday and pday.workout_title else "Workout"),
                    "workout_meta": (pday.workout_meta if pday and pday.workout_meta else f"{len(exercises)} exercises"),
                    "exercise_count": len(exercises),
                    "exercises": ex_list,
                    "exercises_detail": exercises_detail,
                })

        # A legutóbbi edzésnaplók betöltése a fiókhoz
        stmt_sessions = (
            select(WorkoutSession)
            .where(WorkoutSession.user_id == user.id)
            .order_by(desc(WorkoutSession.completed_at))
            .limit(10)
        )
        recent_sessions = [
            {
                "session_date": s.session_date,
                "workout_title": s.workout_title or "Workout",
                "exercises_completed": s.exercises_completed,
                "duration_minutes": s.duration_minutes,
                "calories_burned": s.calories_burned,
            }
            for s in db.scalars(stmt_sessions)
        ]

        # Biometrikus és BMI adatok elemzése
        bmi_info = cls.compute_bmi_info(profile_out.weight, profile_out.height)
        weight_diff = None
        weight_direction = None
        if profile_out.weight and profile_out.target_weight:
            diff = round(profile_out.target_weight - profile_out.weight, 1)
            weight_diff = abs(diff)
            if diff < 0:
                weight_direction = f"{abs(diff)} kg to lose"
            elif diff > 0:
                weight_direction = f"{diff} kg to gain"
            else:
                weight_direction = "Target weight reached"

        # Kitüntetések és rang összefoglalása
        unlocked_badges = [
            {"key": a.achievement_key, "title": a.title, "tier": a.tier, "unlocked_date": a.unlocked_date}
            for a in achievements
            if a.is_unlocked
        ]
        locked_badges = [a for a in achievements if not a.is_unlocked]
        locked_badges.sort(
            key=lambda a: (a.current_value / max(a.target_value, 1)), reverse=True
        )
        next_closest = locked_badges[0] if locked_badges else None

        # Személyre szabott összefüggések és minták felépítése az AI számára
        patterns: list[str] = []
        if bmi_info["bmi"] and profile_out.fitness_goal:
            patterns.append(
                f"Athlete has BMI {bmi_info['bmi']} ({bmi_info['category']}) paired with primary goal '{profile_out.fitness_goal}'."
            )
        if weight_direction:
            patterns.append(
                f"Weight trajectory: current {profile_out.weight} kg vs target {profile_out.target_weight} kg ({weight_direction})."
            )
        patterns.append(
            f"Weekly consistency: {profile_out.sessions_this_week}/{profile_out.weekly_target} workouts completed this week "
            f"(active streak: {profile_out.streak} days, best streak: {profile_out.best_streak} days, lifetime workouts: {profile_out.total_workouts})."
        )
        if workout_days_count != profile_out.weekly_target:
            patterns.append(
                f"Schedule vs Target pattern: Weekly plan has {workout_days_count} scheduled workout days while weekly target is {profile_out.weekly_target}."
            )
        if next_closest:
            rem = max(0, next_closest.target_value - next_closest.current_value)
            patterns.append(
                f"Closest achievement milestone: '{next_closest.title}' ({next_closest.current_value}/{next_closest.target_value} {next_closest.unit}, only {rem} {next_closest.unit} away)."
            )

        settings_out = UserSettingsOut.model_validate(settings)

        return AIUserContextOut(
            account_id=user.id,
            identity={
                "username": profile_out.username,
                "display_name": profile_out.display_name,
                "name": profile_out.display_name or profile_out.username or "Athlete",
                "onboarding_completed": profile_out.onboarding_completed,
            },
            biometrics_and_bmi={
                "weight_kg": profile_out.weight,
                "height_cm": profile_out.height,
                "target_weight_kg": profile_out.target_weight,
                "bmi": bmi_info["bmi"],
                "bmi_category": bmi_info["category"],
                "weight_delta_kg": weight_diff,
                "weight_trajectory": weight_direction,
                "fitness_goal": profile_out.fitness_goal,
                "fitness_level": profile_out.fitness_level,
                "gender": profile_out.gender,
                "age": profile_out.age,
            },
            consistency_and_streaks={
                "streak_days": profile_out.streak,
                "best_streak_days": profile_out.best_streak,
                "sessions_this_week": profile_out.sessions_this_week,
                "weekly_target": profile_out.weekly_target,
                "weekly_completion_percent": min(
                    100, round((profile_out.sessions_this_week / max(profile_out.weekly_target, 1)) * 100)
                ),
                "total_workouts": profile_out.total_workouts,
                "total_hours": profile_out.total_hours,
                "total_minutes": profile_out.total_minutes,
                "estimated_calories_today": profile_out.estimated_calories_today,
                "total_calories_burned": profile_out.total_calories_burned,
                "last_workout_date": profile_out.last_workout_date,
                "completed_exercises_today": profile_out.completed_exercises_today,
            },
            weekly_schedule=weekly_schedule,
            recent_workout_sessions=recent_sessions,
            activity_5_weeks=profile_out.activity_history,
            achievements_summary={
                "player_rank": player_rank.model_dump(),
                "unlocked_badges": unlocked_badges,
                "next_milestone": (
                    {
                        "title": next_closest.title,
                        "description": next_closest.description,
                        "current_value": next_closest.current_value,
                        "target_value": next_closest.target_value,
                        "unit": next_closest.unit,
                    }
                    if next_closest
                    else None
                ),
            },
            preferences_and_notifications=settings_out.model_dump(exclude={"user_id", "updated_at"}),
            recognized_patterns=patterns,
        )
