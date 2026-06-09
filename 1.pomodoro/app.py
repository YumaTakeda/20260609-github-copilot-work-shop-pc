"""Pomodoro Timer App (customizable settings)."""

from __future__ import annotations

import argparse
from dataclasses import dataclass

WORK_MINUTE_OPTIONS = (15, 25, 35, 45)
BREAK_MINUTE_OPTIONS = (5, 10, 15)
THEME_OPTIONS = ("dark", "light", "focus")

THEME_PALETTES = {
    "dark": {"background": "#121212", "foreground": "#F5F5F5"},
    "light": {"background": "#F8F8F8", "foreground": "#1E1E1E"},
    "focus": {"background": "#0B0F10", "foreground": "#9EE493"},
}


@dataclass(frozen=True)
class TimerSettings:
    work_minutes: int = 25
    break_minutes: int = 5
    theme: str = "dark"
    start_sound_enabled: bool = True
    end_sound_enabled: bool = True
    tick_sound_enabled: bool = False

    def __post_init__(self) -> None:
        if self.work_minutes not in WORK_MINUTE_OPTIONS:
            raise ValueError(
                f"work_minutes must be one of {WORK_MINUTE_OPTIONS}, got {self.work_minutes}"
            )
        if self.break_minutes not in BREAK_MINUTE_OPTIONS:
            raise ValueError(
                f"break_minutes must be one of {BREAK_MINUTE_OPTIONS}, got {self.break_minutes}"
            )
        if self.theme not in THEME_OPTIONS:
            raise ValueError(f"theme must be one of {THEME_OPTIONS}, got {self.theme}")


class PomodoroTimer:
    def __init__(self, settings: TimerSettings) -> None:
        self.settings = settings
        self.phase = "work"
        self.remaining_seconds = settings.work_minutes * 60

    def should_play_sound(self, event_name: str) -> bool:
        options = {
            "start": self.settings.start_sound_enabled,
            "end": self.settings.end_sound_enabled,
            "tick": self.settings.tick_sound_enabled,
        }
        if event_name not in options:
            raise ValueError(
                f"event_name must be one of: start, end, tick, got {event_name}"
            )
        return options[event_name]

    def tick(self) -> str | None:
        if self.remaining_seconds > 0:
            self.remaining_seconds -= 1

        if self.remaining_seconds == 0:
            return self._switch_phase()
        return None

    def _switch_phase(self) -> str:
        if self.phase == "work":
            self.phase = "break"
            self.remaining_seconds = self.settings.break_minutes * 60
        else:
            self.phase = "work"
            self.remaining_seconds = self.settings.work_minutes * 60
        return self.phase


def get_theme_palette(theme: str) -> dict[str, str]:
    if theme not in THEME_PALETTES:
        raise ValueError(f"theme must be one of {THEME_OPTIONS}, got {theme}")
    return THEME_PALETTES[theme]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Customizable Pomodoro Timer")
    parser.add_argument("--work-minutes", type=int, choices=WORK_MINUTE_OPTIONS, default=25)
    parser.add_argument("--break-minutes", type=int, choices=BREAK_MINUTE_OPTIONS, default=5)
    parser.add_argument("--theme", choices=THEME_OPTIONS, default="dark")
    parser.add_argument("--disable-start-sound", action="store_true")
    parser.add_argument("--disable-end-sound", action="store_true")
    parser.add_argument("--enable-tick-sound", action="store_true")
    parser.add_argument(
        "--demo-ticks",
        type=int,
        default=0,
        help="Run n ticks for verification without waiting in real time.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = TimerSettings(
        work_minutes=args.work_minutes,
        break_minutes=args.break_minutes,
        theme=args.theme,
        start_sound_enabled=not args.disable_start_sound,
        end_sound_enabled=not args.disable_end_sound,
        tick_sound_enabled=args.enable_tick_sound,
    )
    timer = PomodoroTimer(settings)
    palette = get_theme_palette(settings.theme)

    print("Pomodoro Timer")
    print(f"  work_minutes={settings.work_minutes}")
    print(f"  break_minutes={settings.break_minutes}")
    print(f"  theme={settings.theme} {palette}")
    print(
        "  sounds="
        f"start:{settings.start_sound_enabled}, "
        f"end:{settings.end_sound_enabled}, "
        f"tick:{settings.tick_sound_enabled}"
    )

    for _ in range(args.demo_ticks):
        timer.tick()

    if args.demo_ticks > 0:
        print(
            f"  phase={timer.phase}, remaining_seconds={timer.remaining_seconds}"
        )


if __name__ == "__main__":
    main()
