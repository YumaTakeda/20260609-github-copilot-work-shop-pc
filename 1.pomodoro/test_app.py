import unittest

from app import (
    PomodoroTimer,
    TimerSettings,
    get_theme_palette,
)


class TimerSettingsTest(unittest.TestCase):
    def test_accepts_customizable_options(self):
        settings = TimerSettings(
            work_minutes=45,
            break_minutes=15,
            theme="focus",
            start_sound_enabled=False,
            end_sound_enabled=True,
            tick_sound_enabled=True,
        )
        self.assertEqual(settings.work_minutes, 45)
        self.assertEqual(settings.break_minutes, 15)
        self.assertEqual(settings.theme, "focus")
        self.assertFalse(settings.start_sound_enabled)
        self.assertTrue(settings.end_sound_enabled)
        self.assertTrue(settings.tick_sound_enabled)

    def test_rejects_unsupported_work_minutes(self):
        with self.assertRaises(ValueError):
            TimerSettings(work_minutes=20)


class PomodoroTimerTest(unittest.TestCase):
    def test_switches_between_work_and_break_with_selected_durations(self):
        settings = TimerSettings(work_minutes=15, break_minutes=10)
        timer = PomodoroTimer(settings)

        timer.remaining_seconds = 1
        phase = timer.tick()
        self.assertEqual(phase, "break")
        self.assertEqual(timer.remaining_seconds, 10 * 60)

        timer.remaining_seconds = 1
        phase = timer.tick()
        self.assertEqual(phase, "work")
        self.assertEqual(timer.remaining_seconds, 15 * 60)

    def test_sound_toggles_are_reflected(self):
        settings = TimerSettings(
            start_sound_enabled=False,
            end_sound_enabled=True,
            tick_sound_enabled=False,
        )
        timer = PomodoroTimer(settings)

        self.assertFalse(timer.should_play_sound("start"))
        self.assertTrue(timer.should_play_sound("end"))
        self.assertFalse(timer.should_play_sound("tick"))


class ThemeTest(unittest.TestCase):
    def test_returns_theme_palette(self):
        palette = get_theme_palette("light")
        self.assertIn("background", palette)
        self.assertIn("foreground", palette)


if __name__ == "__main__":
    unittest.main()
