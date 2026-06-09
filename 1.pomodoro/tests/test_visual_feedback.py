import importlib.util
import pathlib
import unittest


APP_PATH = pathlib.Path(__file__).resolve().parents[1] / "app.py"
SPEC = importlib.util.spec_from_file_location("pomodoro_app", APP_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class VisualFeedbackTest(unittest.TestCase):
    def test_remaining_ratio_is_clamped(self):
        self.assertEqual(MODULE.compute_remaining_ratio(100, 120), 1.0)
        self.assertEqual(MODULE.compute_remaining_ratio(100, -10), 0.0)

    def test_progress_extent(self):
        self.assertEqual(MODULE.compute_progress_extent(1.0), 360.0)
        self.assertEqual(MODULE.compute_progress_extent(0.5), 180.0)
        self.assertEqual(MODULE.compute_progress_extent(-1.0), 0.0)

    def test_color_transition_blue_to_yellow_to_red(self):
        self.assertEqual(MODULE.progress_color_hex(1.0), "#2f80ed")
        self.assertEqual(MODULE.progress_color_hex(0.5), "#ffd60a")
        self.assertEqual(MODULE.progress_color_hex(0.0), "#eb5757")


if __name__ == "__main__":
    unittest.main()
