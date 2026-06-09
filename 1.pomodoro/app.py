import sqlite3
import os
from flask import Flask, g
from routes.web import web_bp
from routes.api import api_bp


def get_db(app: Flask) -> sqlite3.Connection:
    """アプリケーションコンテキスト内でDB接続を取得する。"""
    if "db" not in g:
        g.db = sqlite3.connect(
            app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app: Flask) -> None:
    """テーブルが存在しない場合のみ作成する。"""
    with app.app_context():
        db = get_db(app)
        db.executescript("""
            CREATE TABLE IF NOT EXISTS settings (
                id               INTEGER PRIMARY KEY,
                work_min         INTEGER NOT NULL DEFAULT 25,
                short_break_min  INTEGER NOT NULL DEFAULT 5,
                long_break_min   INTEGER NOT NULL DEFAULT 15,
                long_break_every INTEGER NOT NULL DEFAULT 4,
                auto_start_break BOOLEAN NOT NULL DEFAULT 0,
                auto_start_work  BOOLEAN NOT NULL DEFAULT 0,
                updated_at       DATETIME
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                phase              TEXT    NOT NULL,
                planned_sec        INTEGER NOT NULL,
                actual_sec         INTEGER,
                started_at         DATETIME,
                ended_at           DATETIME,
                completed          BOOLEAN NOT NULL DEFAULT 0,
                interrupted_reason TEXT
            );
        """)
        db.commit()

        # settings 行がなければデフォルト値で1行挿入
        row = db.execute("SELECT COUNT(*) FROM settings").fetchone()
        if row[0] == 0:
            db.execute("""
                INSERT INTO settings
                    (id, work_min, short_break_min, long_break_min,
                     long_break_every, auto_start_break, auto_start_work,
                     updated_at)
                VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                app.config["DEFAULT_WORK_MIN"],
                app.config["DEFAULT_SHORT_BREAK_MIN"],
                app.config["DEFAULT_LONG_BREAK_MIN"],
                app.config["DEFAULT_LONG_BREAK_EVERY"],
                False,
                False,
            ))
            db.commit()


def create_app(config: str = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config or "config.DevelopmentConfig")

    # DB接続をリクエスト終了時にクローズ
    app.teardown_appcontext(close_db)

    # Blueprint 登録
    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp)

    # DB初期化
    init_db(app)

    return app


if __name__ == "__main__":
    application = create_app()
    application.run()
