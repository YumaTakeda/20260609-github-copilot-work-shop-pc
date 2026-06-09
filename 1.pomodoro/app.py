from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Dict, List, Set


XP_PER_COMPLETED_POMODORO = 25
XP_PER_LEVEL = 100


@dataclass(frozen=True)
class PomodoroRecord:
    day: date
    planned_minutes: int
    actual_minutes: int
    completed: bool


class PomodoroGamification:
    def __init__(self) -> None:
        self._records: List[PomodoroRecord] = []

    def add_record(
        self,
        day: date,
        planned_minutes: int,
        actual_minutes: int,
        completed: bool,
    ) -> None:
        self._records.append(
            PomodoroRecord(
                day=day,
                planned_minutes=planned_minutes,
                actual_minutes=actual_minutes,
                completed=completed,
            )
        )

    @property
    def records(self) -> List[PomodoroRecord]:
        return list(self._records)

    @property
    def completed_count(self) -> int:
        return sum(1 for record in self._records if record.completed)

    @property
    def xp(self) -> int:
        return self.completed_count * XP_PER_COMPLETED_POMODORO

    @property
    def level(self) -> int:
        return (self.xp // XP_PER_LEVEL) + 1

    def current_streak(self) -> int:
        completed_days = {record.day for record in self._records if record.completed}
        if not completed_days:
            return 0

        streak = 1
        cursor = max(completed_days)
        while (cursor - timedelta(days=1)) in completed_days:
            cursor = cursor - timedelta(days=1)
            streak += 1
        return streak

    def weekly_stats(self, reference_day: date) -> Dict[str, float]:
        start = reference_day - timedelta(days=reference_day.weekday())
        end = start + timedelta(days=7)
        return self._stats_for_range(start=start, end=end)

    def monthly_stats(self, year: int, month: int) -> Dict[str, float]:
        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)
        return self._stats_for_range(start=start, end=end)

    def badges(self, reference_day: date) -> Set[str]:
        earned: Set[str] = set()
        if self.completed_count >= 1:
            earned.add("初回完了")
        if self.current_streak() >= 3:
            earned.add("3日連続")
        if self.weekly_stats(reference_day)["completed"] >= 10:
            earned.add("今週10回完了")
        return earned

    def _stats_for_range(self, start: date, end: date) -> Dict[str, float]:
        scoped = [record for record in self._records if start <= record.day < end]
        if not scoped:
            return {
                "completed": 0.0,
                "completion_rate": 0.0,
                "average_focus_minutes": 0.0,
            }

        completed = [record for record in scoped if record.completed]
        completion_rate = len(completed) / len(scoped)
        average_focus_minutes = (
            sum(record.actual_minutes for record in completed) / len(completed)
            if completed
            else 0.0
        )
        return {
            "completed": float(len(completed)),
            "completion_rate": completion_rate,
            "average_focus_minutes": average_focus_minutes,
        }
