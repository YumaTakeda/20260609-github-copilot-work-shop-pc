# ポモドーロタイマー アプリ 段階的実装計画

## Phase 1：バックエンド骨格（動作確認可能な最小構成）

**目標：** `flask run` でサーバーが起動し、`/` にアクセスすると画面が返ること

| 実装内容 | ファイル |
|---|---|
| `create_app()` ファクトリ + Blueprint 登録 | `app.py` |
| 環境別設定クラス | `config.py` |
| データモデル定義（`SessionRecord`, `Settings`） | `models.py` |
| SQLite 初期化（`settings` / `sessions` テーブル） | `app.py` 内 or `db.py` |
| UI 配信ルート `GET /` | `routes/web.py` |
| 最小限のプレースホルダー HTML | `templates/index.html` |

**完了基準：** `curl http://localhost:5000/` が 200 を返す

---

## Phase 2：Repository / Service 層

**目標：** DB とビジネスロジックをテスト可能な形で実装する

| 実装内容 | ファイル |
|---|---|
| `SessionRepository` 抽象基底クラス | `repositories/base.py` |
| SQLite 実装（`save` / `find_by_date`） | `repositories/sqlite_session_repo.py` |
| InMemory 実装（テスト用） | `repositories/in_memory_session_repo.py` |
| `TimerService`（セッション開始・完了） | `services/timer_service.py` |
| `StatsService`（日次統計・clock 注入） | `services/stats_service.py` |
| pytest fixtures + ユニットテスト | `tests/conftest.py`, `tests/unit/` |

**完了基準：** `pytest tests/unit/` が全てパス

---

## Phase 3：REST API 実装

**目標：** `curl` / Postman で全 API エンドポイントが正常動作すること

| 実装内容 | エンドポイント |
|---|---|
| 設定取得 | `GET /api/settings` |
| 設定更新 | `PUT /api/settings` |
| セッション開始ログ | `POST /api/sessions/start` |
| セッション完了ログ | `POST /api/sessions/complete` |
| 日次統計取得 | `GET /api/stats/daily` |
| 統合テスト | `tests/integration/` |

**完了基準：** `pytest tests/integration/` が全てパス

---

## Phase 4：UI 静的レイアウト（見た目の土台）

**目標：** デザインが画像に近い状態になること（タイマーはまだ動かない）

| 実装内容 | ファイル |
|---|---|
| フェーズ切替タブ（Work / Short Break / Long Break） | `index.html` |
| 残り時間表示エリア（MM:SS プレースホルダー） | `index.html` |
| SVG 進捗リング（静的） | `index.html` + `style.css` |
| サイクル数インジケーター | `index.html` |
| Start / Pause / Reset / Skip ボタン | `index.html` |
| 設定パネル（モーダルまたはドロワー） | `index.html` |
| 統計パネル | `index.html` |
| レスポンシブレイアウト（モバイル対応） | `style.css` |

**完了基準：** ブラウザで開いたとき、画像のデザインに近い見た目になっている

---

## Phase 5：タイマーロジック（core 層）

**目標：** ブラウザ非依存の純粋関数でタイマーロジックをテスト済みにする

| 実装内容 | ファイル |
|---|---|
| `tick(state, nowMs)` / `isExpired(state)` | `static/js/core/timerState.js` |
| `nextPhase(state)` / `shouldLongBreak(cycleCount, every)` | `static/js/core/phaseLogic.js` |
| `start(state, nowMs)` / `pause(state, nowMs)` / `reset(state)` | `static/js/core/timerState.js` |
| Vitest セットアップ | `package.json`, `vite.config.js` |
| JS ユニットテスト | `tests/js/timerState.test.js`, `tests/js/phaseLogic.test.js` |

**完了基準：** `npm test` が全てパス

---

## Phase 6：UI 層（DOM 操作・タイマー動作）

**目標：** ブラウザ上でタイマーが実際に動作すること

| 実装内容 | ファイル |
|---|---|
| 残り時間・進捗リングの DOM 更新 | `static/js/ui/timerDisplay.js` |
| ボタンイベント登録（Start/Pause/Reset/Skip） | `static/js/ui/controls.js` |
| 設定パネルの値読み書き | `static/js/ui/settingsPanel.js` |
| `setInterval` によるタイマー駆動 | `static/js/app.js` |
| Page Visibility API による再同期 | `static/js/app.js` |
| フェーズ自動遷移 | `static/js/app.js` |

**完了基準：** ブラウザでタイマーの開始・停止・リセット・フェーズ遷移が動作する

---

## Phase 7：API 接続（フロント↔バックエンド連携）

**目標：** 設定・セッションログがバックエンドに永続化されること

| 実装内容 | ファイル |
|---|---|
| 起動時に `GET /api/settings` を呼んで設定を反映 | `static/js/app.js` |
| 設定保存時に `PUT /api/settings` を呼ぶ | `static/js/ui/settingsPanel.js` |
| タイマー開始時に `POST /api/sessions/start` を呼ぶ | `static/js/app.js` |
| タイマー完了時に `POST /api/sessions/complete` を呼ぶ | `static/js/app.js` |
| 統計パネルに `GET /api/stats/daily` の結果を表示 | `static/js/ui/statsPanel.js` |

**完了基準：** リロード後も設定が保持され、統計に完了セッションが反映される

---

## Phase 8：通知・仕上げ

**目標：** 通知機能の追加とUX・品質の仕上げ

| 実装内容 | ファイル |
|---|---|
| Web Notifications API によるデスクトップ通知 | `static/js/ui/notificationManager.js` |
| Web Audio API による終了音再生 | `static/js/ui/notificationManager.js` |
| 音量・ミュート設定UI | `index.html`, `style.css` |
| アクセシビリティ対応（`aria-*`, キーボード操作） | `index.html` |
| レスポンシブ仕上げ（細部調整） | `style.css` |

**完了基準：** タイマー終了時に通知と音が鳴り、モバイルでも崩れない

---

## フェーズ依存関係

```
Phase 1 (骨格)
    └─→ Phase 2 (Repository/Service)
            └─→ Phase 3 (API)
                    └─→ Phase 7 (API接続)
Phase 1 (骨格)
    └─→ Phase 4 (UI静的レイアウト)
            └─→ Phase 6 (DOM・タイマー動作)
                    └─→ Phase 7 (API接続)
                            └─→ Phase 8 (通知・仕上げ)
Phase 5 (core層テスト) ← Phase 4 と並行して進められる
```

Phase 2〜3（バックエンド）と Phase 4〜5（フロントエンド）は並行作業が可能。
