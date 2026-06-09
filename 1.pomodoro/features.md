# ポモドーロタイマー アプリ 実装機能一覧

## タイマー機能

### 1. 作業タイマー（25分）
- デフォルト25分の作業フェーズタイマー
- `setInterval` + `targetTs - Date.now()` によるドリフト防止
- Page Visibility API によるタブ非アクティブ時の再同期

### 2. 休憩タイマー（5分 / 15分）
- デフォルト5分の短い休憩タイマー
- デフォルト15分の長い休憩タイマー（4サイクルごと）
- フェーズ遷移ルール（`phaseLogic.js`）

### 3. タイマーの開始・停止・リセット
- Start / Pause / Reset / Skip ボタン
- ボタン状態の管理（実行中/停止中で表示切替）
- リセット時に残り時間を初期値に戻す

---

## 表示・UI機能

### 4. 進捗表示
- 残り時間のMM:SS形式表示
- SVG 進捗リング（経過割合のアニメーション）
- サイクル数インジケーター（現在何サイクル目か）
- フェーズ切替タブ（Work / Short Break / Long Break）

### 5. 統計機能
- 今日の完了セッション数
- 今日の累計作業時間
- `GET /api/stats/daily` エンドポイント
- `StatsService`（clock 依存性注入でテスト可能）

### 6. レスポンシブ Web UI
- モバイル・タブレット・デスクトップ対応レイアウト（`style.css`）
- Vanilla HTML / CSS（フレームワーク不使用）
- 設定パネル（各種時間・自動開始オプション）

---

## 通知機能

### 7. ブラウザ通知
- Web Notifications API によるデスクトップ通知
- タイマー終了時に通知（フェーズ名・次のアクション表示）
- 通知許可リクエスト処理

### 8. サウンド通知
- タイマー終了時に終了音を再生
- Web Audio API または `<audio>` 要素で実装
- 音量・ミュート設定

---

## バックエンド機能

### 9. アプリケーション骨格・設定
- `create_app()` ファクトリ（`app.py`）
- 環境別設定クラス（`config.py`）
- SQLite 初期化（`settings` / `sessions` テーブル）

### 10. 設定 API
- `GET /api/settings` — 設定取得
- `PUT /api/settings` — 設定更新（各タイマー時間・自動開始オプション）

### 11. セッションログ API
- `POST /api/sessions/start` — セッション開始ログ
- `POST /api/sessions/complete` — セッション完了ログ（actual_sec・completed フラグ）

### 12. Repository / Service 層
- `SessionRepository` 抽象クラス + SQLite 実装 + InMemory 実装
- `TimerService`（セッション開始・完了ロジック）
- `StatsService`（日次統計集計）

---

## テスト

### 13. Python テスト（pytest）
- ユニットテスト：`TimerService` / `StatsService`
- 統合テスト：設定API・セッションAPI エンドポイント

### 14. JavaScript テスト（Vitest）
- `timerState.test.js`：`tick()` / `isExpired()` の純粋関数テスト
- `phaseLogic.test.js`：フェーズ遷移ルールのテスト

---

## 機能マッピング（要件 → 実装項目）

| 要件 | 対応実装項目 |
|---|---|
| 25分の作業タイマー | #1, #9 (DEFAULT_WORK_MIN=25) |
| 5分の休憩タイマー | #2, #9 (DEFAULT_SHORT_BREAK_MIN=5) |
| タイマーの開始・停止・リセット | #3 |
| 進捗表示と統計機能 | #4, #5, #11 |
| ブラウザ通知とサウンド通知 | #7, #8 |
| レスポンシブなWebUI | #6 |
