# ポモドーロタイマー Webアプリ アーキテクチャ案

## 技術スタック

| 層 | 技術 |
|---|---|
| バックエンド | Python / Flask |
| フロントエンド | Vanilla HTML / CSS / JavaScript |
| データベース | SQLite |
| テスト（Python） | pytest |
| テスト（JS） | Vitest（ブラウザ不要） |

---

## 全体構成

```
flowchart LR
  U[Browser UI] --> S[Flask Routes / API]
  S --> SV[Service Layer]
  SV --> R[Repository Interface]
  R --> DB[(SQLite)]
  R --> MEM[(InMemory - テスト用)]
```

タイマーの進行・ボタン状態・アニメーションは**ブラウザ側で管理**し、FlaskはUIの配信・設定保存・セッション履歴保存のAPIとして機能する「フロントエンド中心」設計を採用する。

---

## ディレクトリ構成

```
1.pomodoro/
├── app.py                          # create_app() エントリポイント
├── config.py                       # 環境別設定クラス
├── models.py                       # データモデル定義
├── routes/
│   ├── web.py                      # 画面配信ルート
│   └── api.py                      # REST APIルート
├── services/
│   ├── timer_service.py            # セッション開始/完了ロジック
│   └── stats_service.py            # 統計集計ロジック
├── repositories/
│   ├── base.py                     # Repositoryインターフェイス（ABC）
│   ├── sqlite_session_repo.py      # SQLite実装
│   └── in_memory_session_repo.py   # テスト用InMemory実装
├── templates/
│   └── index.html                  # シングルページHTML
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── core/
│       │   ├── timerState.js       # 純粋関数（DOM非依存）
│       │   └── phaseLogic.js       # フェーズ遷移ルール
│       ├── ui/
│       │   ├── timerDisplay.js     # DOM操作（残時間・進捗リング）
│       │   ├── controls.js         # ボタンイベント登録
│       │   └── settingsPanel.js    # 設定パネルUI
│       └── app.js                  # core と ui の接続
└── tests/
    ├── conftest.py                  # shared fixtures
    ├── unit/
    │   ├── test_timer_service.py
    │   ├── test_stats_service.py
    │   └── test_phase_logic.py
    ├── integration/
    │   ├── test_api_settings.py
    │   └── test_api_sessions.py
    └── js/
        ├── timerState.test.js
        └── phaseLogic.test.js
```

---

## バックエンド設計

### Application Factory パターン

グローバルインスタンスを避け、テスト時に設定差し替えが可能な構造とする。

```python
# app.py
def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(config or "config.DevelopmentConfig")
    db.init_app(app)
    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp)
    return app
```

### 設定クラス（config.py）

```python
class BaseConfig:
    TESTING = False
    DATABASE = "pomodoro.db"
    DEFAULT_WORK_MIN = 25
    DEFAULT_SHORT_BREAK_MIN = 5
    DEFAULT_LONG_BREAK_MIN = 15
    DEFAULT_LONG_BREAK_EVERY = 4

class TestingConfig(BaseConfig):
    TESTING = True
    DATABASE = ":memory:"

class DevelopmentConfig(BaseConfig):
    DEBUG = True
```

### REST API 設計

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/` | UI配信 |
| GET | `/api/settings` | 現在設定取得 |
| PUT | `/api/settings` | 設定更新 |
| POST | `/api/sessions/start` | セッション開始ログ |
| POST | `/api/sessions/complete` | セッション完了ログ |
| GET | `/api/stats/daily` | 日次統計取得 |

### サービス層の設計原則

サービスクラスはFlaskオブジェクト（`request`, `current_app`等）に依存しない Pure Python クラスとして実装する。FlaskへのI/O変換はルート層が担う。

```python
# 良い例：Flask非依存
class TimerService:
    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def start_session(self, phase: str, planned_sec: int) -> SessionRecord:
        ...
```

### Repository パターン

サービス層をDBから切り離し、テスト時はInMemory実装に差し替え可能にする。

```python
# repositories/base.py
from abc import ABC, abstractmethod

class SessionRepository(ABC):
    @abstractmethod
    def save(self, session: SessionRecord) -> None: ...

    @abstractmethod
    def find_by_date(self, date: date) -> list[SessionRecord]: ...
```

### 時刻の依存性注入

`datetime.now()` を直接呼ばず、`clock` 関数をコンストラクタで受け取ることでテスト時に任意の時刻を設定可能にする。

```python
class StatsService:
    def __init__(self, repo: SessionRepository,
                 clock: Callable[[], datetime] = datetime.now):
        self._repo = repo
        self._clock = clock

    def get_daily_stats(self) -> DailyStats:
        today = self._clock().date()
        ...
```

---

## データモデル

### settings テーブル

| カラム | 型 | 説明 |
|---|---|---|
| id | INTEGER | PK |
| work_min | INTEGER | 作業時間（分） |
| short_break_min | INTEGER | 短い休憩（分） |
| long_break_min | INTEGER | 長い休憩（分） |
| long_break_every | INTEGER | 長い休憩を挟む間隔（サイクル数） |
| auto_start_break | BOOLEAN | 休憩を自動開始するか |
| auto_start_work | BOOLEAN | 作業を自動開始するか |
| updated_at | DATETIME | 最終更新日時 |

### sessions テーブル

| カラム | 型 | 説明 |
|---|---|---|
| id | INTEGER | PK |
| phase | TEXT | work / short_break / long_break |
| planned_sec | INTEGER | 予定秒数 |
| actual_sec | INTEGER | 実際の経過秒数 |
| started_at | DATETIME | 開始日時 |
| ended_at | DATETIME | 終了日時 |
| completed | BOOLEAN | 完了フラグ |
| interrupted_reason | TEXT | 中断理由（任意） |

---

## フロントエンド設計

### UIコンポーネント

| コンポーネント | 責務 |
|---|---|
| TimerDisplay | 残り時間表示・進捗リング描画 |
| PhaseTabs | 作業/休憩フェーズ切替タブ |
| Controls | start / pause / reset / skip ボタン |
| CycleIndicator | 現在のサイクル数表示 |
| SettingsPanel | 各種時間設定・自動開始設定 |
| StatsPanel | 今日の完了回数・累計時間 |
| NotificationManager | 終了音・デスクトップ通知 |

### タイマー状態管理

単一のstateオブジェクトで管理する。

```js
const state = {
  phase: "work",          // "work" | "short_break" | "long_break"
  targetTs: null,         // 終了予定エポックミリ秒
  remainingMs: 0,
  isRunning: false,
  cycleCount: 0,
  settings: {
    workMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    longBreakEvery: 4,
    autoStartBreak: false,
    autoStartWork: false,
  }
};
```

**設計ポイント:** タイマーは `remainingMs = targetTs - Date.now()` を毎tick計算することで、`setInterval` のドリフトを防止する。タブ非アクティブ時は Page Visibility API で再同期する。

### JSの層分離（テスト容易性）

DOM操作とロジックを分離し、ロジック層はNode.js環境でテスト可能にする。

```
static/js/
├── core/           ← 純粋関数のみ（副作用なし、DOM非依存）
│   ├── timerState.js
│   └── phaseLogic.js
├── ui/             ← DOM操作・イベント登録
│   ├── timerDisplay.js
│   └── controls.js
└── app.js          ← core と ui を接続
```

```js
// core/timerState.js（純粋関数の例）
export function tick(state, nowMs) {
  const remaining = Math.max(0, state.targetTs - nowMs);
  return { ...state, remainingMs: remaining };
}

export function isExpired(state) {
  return state.remainingMs === 0;
}
```

---

## テスト設計

### Python テスト

```python
# conftest.py
@pytest.fixture
def app():
    return create_app("config.TestingConfig")  # インメモリDB使用

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def session_repo():
    return InMemorySessionRepository()
```

```python
# unit/test_stats_service.py（DB不要・時刻固定）
def test_counts_only_completed_sessions(session_repo):
    fixed = datetime(2026, 6, 9, 10, 0, 0)
    repo = session_repo
    repo.save(SessionRecord(phase="work", completed=True, started_at=fixed))
    repo.save(SessionRecord(phase="work", completed=False, started_at=fixed))
    service = StatsService(repo, clock=lambda: fixed)
    result = service.get_daily_stats()
    assert result.completed_count == 1
```

### JavaScript テスト（Vitest）

```js
// js/timerState.test.js（ブラウザ不要）
import { tick, isExpired } from "../core/timerState.js";

test("時間切れで残時間が0になる", () => {
  const state = { targetTs: 1000, remainingMs: 500 };
  const result = tick(state, 1001);
  expect(isExpired(result)).toBe(true);
});
```

### テスト種別と目的

| 種別 | 対象 | 目的 |
|---|---|---|
| unit | Service, Repository, JS core | ロジックの正確性を高速に検証 |
| integration | Flask API エンドポイント | ルート〜DB間の結合を検証 |
| js unit | timerState, phaseLogic | フロントエンドロジックをブラウザ不要で検証 |

---

## 実装ステップ

1. **骨格作成** — `create_app()`, Blueprint, `config.py`, SQLite初期化
2. **Repository実装** — SQLite実装 + InMemory実装（テスト用）
3. **Service実装** — `TimerService`, `StatsService`（Flask非依存・clock注入済み）
4. **API実装** — 設定CRUD・セッションログ・統計エンドポイント
5. **UI実装** — モック準拠の静的レイアウト（HTML/CSS）
6. **タイマーロジック実装** — core層（純粋関数）→ ui層（DOM）の順に実装
7. **API接続** — 設定保存・セッションログのフロント↔バックエンド連携
8. **通知・仕上げ** — 終了音・デスクトップ通知・アクセシビリティ・レスポンシブ
9. **テスト整備** — unit / integration / js の各テストスイート完成
