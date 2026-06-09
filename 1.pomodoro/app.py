import random
import time
try:
    import tkinter as tk
except ModuleNotFoundError:  # pragma: no cover - GUI unavailable in some test environments
    tk = None


FOCUS_SECONDS = 25 * 60


def clamp_ratio(value: float) -> float:
    return max(0.0, min(1.0, value))


def compute_remaining_ratio(total_seconds: int, remaining_seconds: float) -> float:
    if total_seconds <= 0:
        return 0.0
    return clamp_ratio(remaining_seconds / total_seconds)


def compute_progress_extent(remaining_ratio: float) -> float:
    return 360.0 * clamp_ratio(remaining_ratio)


def progress_color_hex(remaining_ratio: float) -> str:
    ratio = clamp_ratio(remaining_ratio)
    elapsed = 1.0 - ratio

    blue = (47, 128, 237)
    yellow = (255, 214, 10)
    red = (235, 87, 87)

    if elapsed < 0.5:
        blend = elapsed / 0.5
        start, end = blue, yellow
    else:
        blend = (elapsed - 0.5) / 0.5
        start, end = yellow, red

    r = int(start[0] + (end[0] - start[0]) * blend)
    g = int(start[1] + (end[1] - start[1]) * blend)
    b = int(start[2] + (end[2] - start[2]) * blend)
    return f"#{r:02x}{g:02x}{b:02x}"


class PomodoroApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Pomodoro Timer")
        self.root.geometry("520x560")
        self.root.configure(bg="#0f172a")

        self.canvas = tk.Canvas(root, width=520, height=520, bg="#0f172a", highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)

        self.center_x = 260
        self.center_y = 250
        self.radius = 145

        self.start_time: float | None = None
        self.running = False
        self.total_seconds = FOCUS_SECONDS
        self.remaining_seconds = float(self.total_seconds)

        self.ripple_radius = 0.0
        self.particles = [
            {
                "x": random.uniform(0, 520),
                "y": random.uniform(0, 520),
                "dx": random.uniform(-0.6, 0.6),
                "dy": random.uniform(-0.6, 0.6),
                "size": random.uniform(1.5, 4.0),
            }
            for _ in range(45)
        ]

        self.title_id = self.canvas.create_text(
            self.center_x,
            45,
            text="Focus Session",
            fill="#e2e8f0",
            font=("Helvetica", 22, "bold"),
        )

        self.background_ring = self.canvas.create_oval(
            self.center_x - self.radius,
            self.center_y - self.radius,
            self.center_x + self.radius,
            self.center_y + self.radius,
            outline="#1e293b",
            width=18,
        )

        self.progress_ring = self.canvas.create_arc(
            self.center_x - self.radius,
            self.center_y - self.radius,
            self.center_x + self.radius,
            self.center_y + self.radius,
            start=90,
            extent=-360,
            style="arc",
            outline=progress_color_hex(1.0),
            width=18,
        )

        self.time_text = self.canvas.create_text(
            self.center_x,
            self.center_y,
            text=self._format_time(self.total_seconds),
            fill="#f8fafc",
            font=("Helvetica", 42, "bold"),
        )

        self.button = tk.Button(
            root,
            text="Start Focus",
            command=self.toggle,
            bg="#2563eb",
            activebackground="#1d4ed8",
            fg="white",
            relief="flat",
            padx=16,
            pady=8,
            font=("Helvetica", 14, "bold"),
        )
        self.canvas.create_window(self.center_x, 500, window=self.button)

        self.draw_background_effects()
        self.update()

    @staticmethod
    def _format_time(seconds: float) -> str:
        total = max(0, int(round(seconds)))
        minutes = total // 60
        secs = total % 60
        return f"{minutes:02d}:{secs:02d}"

    def toggle(self):
        if self.running:
            self.running = False
            self.button.config(text="Resume Focus", bg="#0ea5e9", activebackground="#0284c7")
            return

        if self.remaining_seconds <= 0:
            self.remaining_seconds = float(self.total_seconds)

        self.start_time = time.monotonic() - (self.total_seconds - self.remaining_seconds)
        self.running = True
        self.button.config(text="Pause", bg="#dc2626", activebackground="#b91c1c")

    def draw_background_effects(self):
        if self.running:
            self.ripple_radius = (self.ripple_radius + 2.2) % 220
        else:
            self.ripple_radius = max(0, self.ripple_radius - 2.5)

        self.canvas.delete("effect")

        if self.ripple_radius > 0:
            alpha_color = "#334155"
            self.canvas.create_oval(
                self.center_x - self.ripple_radius,
                self.center_y - self.ripple_radius,
                self.center_x + self.ripple_radius,
                self.center_y + self.ripple_radius,
                outline=alpha_color,
                width=2,
                tags="effect",
            )

        for particle in self.particles:
            if self.running:
                particle["x"] = (particle["x"] + particle["dx"]) % 520
                particle["y"] = (particle["y"] + particle["dy"]) % 520

            x = particle["x"]
            y = particle["y"]
            size = particle["size"]
            self.canvas.create_oval(
                x - size,
                y - size,
                x + size,
                y + size,
                fill="#38bdf8" if self.running else "#1e3a8a",
                outline="",
                tags="effect",
            )

    def update(self):
        if self.running and self.start_time is not None:
            elapsed = time.monotonic() - self.start_time
            self.remaining_seconds = max(0.0, self.total_seconds - elapsed)
            if self.remaining_seconds <= 0:
                self.running = False
                self.button.config(text="Restart Focus", bg="#16a34a", activebackground="#15803d")

        ratio = compute_remaining_ratio(self.total_seconds, self.remaining_seconds)
        extent = compute_progress_extent(ratio)

        self.canvas.itemconfig(self.progress_ring, extent=-extent, outline=progress_color_hex(ratio))
        self.canvas.itemconfig(self.time_text, text=self._format_time(self.remaining_seconds))

        self.draw_background_effects()
        self.root.after(33, self.update)


def main():
    if tk is None:
        raise RuntimeError("tkinter is required to run the GUI app.")
    root = tk.Tk()
    PomodoroApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
