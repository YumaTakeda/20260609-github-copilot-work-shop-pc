import sqlite3
from datetime import date, datetime
from flask import Blueprint, jsonify, request, current_app, g

api_bp = Blueprint("api", __name__, url_prefix="/api")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
    return g.db


# ===== 設定 =====

@api_bp.get("/settings")
def get_settings():
    row = get_db().execute("SELECT * FROM settings WHERE id = 1").fetchone()
    if row is None:
        return jsonify({}), 404
    return jsonify(dict(row))


@api_bp.put("/settings")
def update_settings():
    data = request.get_json(silent=True) or {}
    allowed = {
        "work_min", "short_break_min", "long_break_min",
        "long_break_every", "auto_start_break", "auto_start_work",
    }
    fields = {k: v for k, v in data.items() if k in allowed}
    if not fields:
        return jsonify({"error": "No valid fields provided"}), 400

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [datetime.utcnow().isoformat()]
    db = get_db()
    db.execute(
        f"UPDATE settings SET {set_clause}, updated_at = ? WHERE id = 1",
        values,
    )
    db.commit()
    row = db.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    return jsonify(dict(row))


# ===== セッション =====

@api_bp.post("/sessions/start")
def session_start():
    data = request.get_json(silent=True) or {}
    phase       = data.get("phase", "work")
    planned_sec = int(data.get("planned_sec", 1500))
    started_at  = datetime.utcnow().isoformat()

    db = get_db()
    cursor = db.execute(
        """INSERT INTO sessions (phase, planned_sec, started_at, completed)
           VALUES (?, ?, ?, 0)""",
        (phase, planned_sec, started_at),
    )
    db.commit()
    return jsonify({"id": cursor.lastrowid, "started_at": started_at}), 201


@api_bp.post("/sessions/complete")
def session_complete():
    data = request.get_json(silent=True) or {}
    phase       = data.get("phase", "work")
    planned_sec = int(data.get("planned_sec", 1500))
    actual_sec  = int(data.get("actual_sec", planned_sec))
    completed   = bool(data.get("completed", True))
    ended_at    = datetime.utcnow().isoformat()

    db = get_db()
    cursor = db.execute(
        """INSERT INTO sessions
               (phase, planned_sec, actual_sec, ended_at, completed)
           VALUES (?, ?, ?, ?, ?)""",
        (phase, planned_sec, actual_sec, ended_at, completed),
    )
    db.commit()
    return jsonify({"id": cursor.lastrowid, "ended_at": ended_at}), 201


# ===== 統計 =====

@api_bp.get("/stats/daily")
def daily_stats():
    today = date.today().isoformat()
    db = get_db()
    row = db.execute(
        """SELECT
               COUNT(*)            AS completed_count,
               COALESCE(SUM(actual_sec), 0) AS total_work_sec
           FROM sessions
           WHERE phase = 'work'
             AND completed = 1
             AND DATE(ended_at) = ?""",
        (today,),
    ).fetchone()
    return jsonify(dict(row))
