/**
 * core/timerState.js — 純粋関数（DOM非依存）
 * タイマー状態の生成・更新を副作用なしに扱う。
 */

export const PHASE = {
  WORK:        "work",
  SHORT_BREAK: "short_break",
  LONG_BREAK:  "long_break",
};

/**
 * デフォルト設定を返す。
 * @returns {Object}
 */
export function defaultSettings() {
  return {
    workMin:        25,
    shortBreakMin:  5,
    longBreakMin:   15,
    longBreakEvery: 4,
    autoStartBreak: false,
    autoStartWork:  false,
  };
}

/**
 * フェーズに対応する秒数を返す。
 * @param {string} phase
 * @param {Object} settings
 * @returns {number}
 */
export function durationSec(phase, settings) {
  switch (phase) {
    case PHASE.SHORT_BREAK: return settings.shortBreakMin * 60;
    case PHASE.LONG_BREAK:  return settings.longBreakMin  * 60;
    default:                return settings.workMin       * 60;
  }
}

/**
 * 初期状態を生成する。
 * @param {Object} [settings]
 * @returns {Object}
 */
export function createState(settings = defaultSettings()) {
  return {
    phase:       PHASE.WORK,
    targetTs:    null,           // 終了予定エポックミリ秒（停止中は null）
    remainingMs: durationSec(PHASE.WORK, settings) * 1000,
    pausedMs:    durationSec(PHASE.WORK, settings) * 1000,
    isRunning:   false,
    cycleCount:  0,
    settings,
  };
}

/**
 * タイマーを開始した新しい state を返す。
 * @param {Object} state
 * @param {number} nowMs  Date.now()
 * @returns {Object}
 */
export function start(state, nowMs) {
  if (state.isRunning) return state;
  return {
    ...state,
    isRunning: true,
    targetTs:  nowMs + state.pausedMs,
  };
}

/**
 * タイマーを一時停止した新しい state を返す。
 * @param {Object} state
 * @param {number} nowMs
 * @returns {Object}
 */
export function pause(state, nowMs) {
  if (!state.isRunning) return state;
  const remaining = Math.max(0, state.targetTs - nowMs);
  return {
    ...state,
    isRunning:   false,
    targetTs:    null,
    remainingMs: remaining,
    pausedMs:    remaining,
  };
}

/**
 * 現在フェーズをリセットした新しい state を返す。
 * @param {Object} state
 * @returns {Object}
 */
export function reset(state) {
  const ms = durationSec(state.phase, state.settings) * 1000;
  return {
    ...state,
    isRunning:   false,
    targetTs:    null,
    remainingMs: ms,
    pausedMs:    ms,
  };
}

/**
 * tick: nowMs を受け取り remainingMs を更新した state を返す。
 * @param {Object} state
 * @param {number} nowMs
 * @returns {Object}
 */
export function tick(state, nowMs) {
  if (!state.isRunning) return state;
  const remaining = Math.max(0, state.targetTs - nowMs);
  return { ...state, remainingMs: remaining };
}

/**
 * タイマーが 0 に達しているか。
 * @param {Object} state
 * @returns {boolean}
 */
export function isExpired(state) {
  return state.remainingMs === 0;
}

/**
 * 残り時間を MM:SS 文字列で返す。
 * @param {Object} state
 * @returns {string}
 */
export function formatTime(state) {
  const totalSec = Math.ceil(state.remainingMs / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * 進捗率（0.0〜1.0）を返す。開始直後は 1.0、終了時は 0.0。
 * @param {Object} state
 * @returns {number}
 */
export function progress(state) {
  const total = durationSec(state.phase, state.settings) * 1000;
  if (total === 0) return 0;
  return state.remainingMs / total;
}
