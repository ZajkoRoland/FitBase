
#FitBase Napi Edzéssorozat (Streak) és Pihenőnap Logika Egységtesztek.


import unittest
import uuid
from datetime import date, timedelta
from typing import Any


class MockPlanDay:
    def __init__(self, day_of_week: int, day_name: str, day_type: str):
        self.day_of_week = day_of_week
        self.day_name = day_name
        self.type = day_type
        self.workout_title = None if day_type == "rest" else "Workout"
        self.workout_meta = None if day_type == "rest" else "0 exercises"
        self.exercises: list[Any] = []


class MockUserStats:
    def __init__(self):
        self.streak = 0
        self.best_streak = 0
        self.last_workout_date: str | None = None
        self.weekly_target = 4
        self.sessions_this_week = 0
        self.total_workouts = 0


class StreakLogicSimulator:
    #A backend AccountStateService streak logikáját szimuláló és ellenőrző osztály.

    @staticmethod
    def get_default_week_plan() -> dict[int, str]:
        
        return {
            0: "workout",
            1: "workout",
            2: "rest",
            3: "workout",
            4: "workout",
            5: "rest",
            6: "rest",
        }

    @classmethod
    def evaluate_active_streak(
        cls,
        stats: MockUserStats,
        current_date: date,
        plan_by_weekday: dict[int, str],
    ) -> int:
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

        if days_diff <= 0:
            return current_streak

        if days_diff == 1:
            return current_streak

        if days_diff > 14:
            stats.streak = 0
            return 0

        for offset in range(1, days_diff):
            check_date = last_date + timedelta(days=offset)
            weekday_idx = check_date.weekday()
            day_type = plan_by_weekday.get(weekday_idx, "workout")
            if day_type == "workout":
                stats.streak = 0
                return 0

        return current_streak

    @classmethod
    def record_workout(
        cls,
        stats: MockUserStats,
        workout_date: date,
        plan_by_weekday: dict[int, str],
    ) -> tuple[int, int]:
        today_iso = workout_date.isoformat()

        already_worked_out_today = False
        if stats.last_workout_date:
            try:
                last_d = date.fromisoformat(stats.last_workout_date[:10])
                if last_d == workout_date:
                    already_worked_out_today = True
            except (ValueError, TypeError):
                pass

        if already_worked_out_today:
            new_streak = max(stats.streak or 1, 1)
        else:
            prior_streak = cls.evaluate_active_streak(stats, workout_date, plan_by_weekday)
            if prior_streak > 0:
                new_streak = prior_streak + 1
            else:
                new_streak = 1

        stats.streak = new_streak
        stats.best_streak = max(stats.best_streak or 0, new_streak)
        stats.last_workout_date = today_iso
        stats.total_workouts += 1
        return stats.streak, stats.best_streak


class TestStreakLogic(unittest.TestCase):
    def setUp(self):
        self.stats = MockUserStats()
        self.plan = StreakLogicSimulator.get_default_week_plan()
        # Referencia
        self.monday = date(2026, 11, 9)
        self.tuesday = date(2026, 11, 10)
        self.wednesday = date(2026, 11, 11)   # Rest day
        self.thursday = date(2026, 11, 12)    # Workout day
        self.friday = date(2026, 11, 13)      # Workout day
        self.saturday = date(2026, 11, 14)    # Rest day
        self.sunday = date(2026, 11, 15)      # Rest day
        self.next_monday = date(2026, 11, 16) # Workout day

    def test_01_new_user_starts_with_zero_streak(self):
        self.assertEqual(self.stats.streak, 0)
        self.assertEqual(self.stats.best_streak, 0)
        self.assertIsNone(self.stats.last_workout_date)
        eval_streak = StreakLogicSimulator.evaluate_active_streak(self.stats, self.monday, self.plan)
        self.assertEqual(eval_streak, 0)

    def test_02_first_workout_gives_one_day_streak(self):
        s, best = StreakLogicSimulator.record_workout(self.stats, self.monday, self.plan)
        self.assertEqual(s, 1)
        self.assertEqual(best, 1)
        self.assertEqual(self.stats.last_workout_date, "2026-11-09")

    def test_03_consecutive_active_day_reaches_two_streak(self):
        StreakLogicSimulator.record_workout(self.stats, self.monday, self.plan)
        s, best = StreakLogicSimulator.record_workout(self.stats, self.tuesday, self.plan)
        self.assertEqual(s, 2)
        self.assertEqual(best, 2)
        self.assertEqual(self.stats.last_workout_date, "2026-11-10")

    def test_04_same_day_multiple_workouts_no_double_increment(self):
        StreakLogicSimulator.record_workout(self.stats, self.monday, self.plan)
        s1, _ = StreakLogicSimulator.record_workout(self.stats, self.tuesday, self.plan)
        self.assertEqual(s1, 2)
        s2, best2 = StreakLogicSimulator.record_workout(self.stats, self.tuesday, self.plan)
        self.assertEqual(s2, 2)
        self.assertEqual(best2, 2)
        self.assertEqual(self.stats.total_workouts, 3)

    def test_05_rest_day_preserves_streak(self):
        StreakLogicSimulator.record_workout(self.stats, self.monday, self.plan)
        StreakLogicSimulator.record_workout(self.stats, self.tuesday, self.plan)
        active_streak = StreakLogicSimulator.evaluate_active_streak(self.stats, self.wednesday, self.plan)
        self.assertEqual(active_streak, 2)
        self.assertEqual(self.stats.streak, 2)

    def test_06_workout_after_rest_day_continues_counting(self):
        StreakLogicSimulator.record_workout(self.stats, self.monday, self.plan)
        StreakLogicSimulator.record_workout(self.stats, self.tuesday, self.plan)
        s, best = StreakLogicSimulator.record_workout(self.stats, self.thursday, self.plan)
        self.assertEqual(s, 3)
        self.assertEqual(best, 3)

    def test_07_multiple_consecutive_rest_days_preserved(self):
        StreakLogicSimulator.record_workout(self.stats, self.friday, self.plan)
        self.stats.streak = 3  
        self.stats.best_streak = 3

        self.assertEqual(StreakLogicSimulator.evaluate_active_streak(self.stats, self.saturday, self.plan), 3)
        
        self.assertEqual(StreakLogicSimulator.evaluate_active_streak(self.stats, self.sunday, self.plan), 3)

        self.assertEqual(StreakLogicSimulator.evaluate_active_streak(self.stats, self.next_monday, self.plan), 3)

        s, best = StreakLogicSimulator.record_workout(self.stats, self.next_monday, self.plan)
        self.assertEqual(s, 4)
        self.assertEqual(best, 4)

    def test_08_skipped_unplanned_day_breaks_streak(self):
        StreakLogicSimulator.record_workout(self.stats, self.monday, self.plan)
        StreakLogicSimulator.record_workout(self.stats, self.tuesday, self.plan)
        active_streak = StreakLogicSimulator.evaluate_active_streak(self.stats, self.friday, self.plan)
        self.assertEqual(active_streak, 0)
        self.assertEqual(self.stats.streak, 0)

    def test_09_workout_after_broken_streak_restarts_at_one_keeps_best(self):
        StreakLogicSimulator.record_workout(self.stats, self.monday, self.plan)
        StreakLogicSimulator.record_workout(self.stats, self.tuesday, self.plan)
        
        s, best = StreakLogicSimulator.record_workout(self.stats, self.friday, self.plan)
        self.assertEqual(s, 1)
        self.assertEqual(best, 2)  

    def test_10_workout_on_rest_day_increments_streak(self):
        StreakLogicSimulator.record_workout(self.stats, self.monday, self.plan)
        StreakLogicSimulator.record_workout(self.stats, self.tuesday, self.plan)
        s, best = StreakLogicSimulator.record_workout(self.stats, self.wednesday, self.plan)
        self.assertEqual(s, 3)
        self.assertEqual(best, 3)
        s2, best2 = StreakLogicSimulator.record_workout(self.stats, self.thursday, self.plan)
        self.assertEqual(s2, 4)
        self.assertEqual(best2, 4)


if __name__ == "__main__":
    unittest.main()

