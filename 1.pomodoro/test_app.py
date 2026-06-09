from datetime import date
import unittest

from app import PomodoroGamification


class PomodoroGamificationTests(unittest.TestCase):
    def test_xp_and_level_increase_by_completed_pomodoro(self) -> None:
        tracker = PomodoroGamification()
        tracker.add_record(date(2026, 6, 1), 25, 25, True)
        tracker.add_record(date(2026, 6, 1), 25, 20, False)
        tracker.add_record(date(2026, 6, 2), 25, 25, True)
        tracker.add_record(date(2026, 6, 3), 25, 25, True)
        tracker.add_record(date(2026, 6, 4), 25, 25, True)

        self.assertEqual(tracker.completed_count, 4)
        self.assertEqual(tracker.xp, 100)
        self.assertEqual(tracker.level, 2)

    def test_streak_and_badges(self) -> None:
        tracker = PomodoroGamification()
        tracker.add_record(date(2026, 6, 7), 25, 25, True)
        tracker.add_record(date(2026, 6, 8), 25, 25, True)
        tracker.add_record(date(2026, 6, 9), 25, 25, True)
        tracker.add_record(date(2026, 6, 8), 25, 25, True)
        for _ in range(7):
            tracker.add_record(date(2026, 6, 9), 25, 25, True)

        self.assertEqual(tracker.current_streak(), 3)
        self.assertEqual(
            tracker.badges(reference_day=date(2026, 6, 9)),
            {"初回完了", "3日連続", "今週10回完了"},
        )

    def test_weekly_and_monthly_stats(self) -> None:
        tracker = PomodoroGamification()
        tracker.add_record(date(2026, 6, 1), 25, 25, True)
        tracker.add_record(date(2026, 6, 2), 25, 15, False)
        tracker.add_record(date(2026, 6, 3), 25, 25, True)
        tracker.add_record(date(2026, 6, 15), 25, 25, True)

        weekly = tracker.weekly_stats(reference_day=date(2026, 6, 3))
        self.assertEqual(weekly["completed"], 2.0)
        self.assertAlmostEqual(weekly["completion_rate"], 2 / 3)
        self.assertEqual(weekly["average_focus_minutes"], 25.0)

        monthly = tracker.monthly_stats(year=2026, month=6)
        self.assertEqual(monthly["completed"], 3.0)
        self.assertAlmostEqual(monthly["completion_rate"], 3 / 4)
        self.assertEqual(monthly["average_focus_minutes"], 25.0)


if __name__ == "__main__":
    unittest.main()
