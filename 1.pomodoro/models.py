from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Settings:
    id: Optional[int] = None
    work_min: int = 25
    short_break_min: int = 5
    long_break_min: int = 15
    long_break_every: int = 4
    auto_start_break: bool = False
    auto_start_work: bool = False
    updated_at: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "work_min": self.work_min,
            "short_break_min": self.short_break_min,
            "long_break_min": self.long_break_min,
            "long_break_every": self.long_break_every,
            "auto_start_break": self.auto_start_break,
            "auto_start_work": self.auto_start_work,
        }


@dataclass
class SessionRecord:
    phase: str  # "work" | "short_break" | "long_break"
    planned_sec: int
    id: Optional[int] = None
    actual_sec: Optional[int] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    completed: bool = False
    interrupted_reason: Optional[str] = None


@dataclass
class DailyStats:
    completed_count: int = 0
    total_work_sec: int = 0
