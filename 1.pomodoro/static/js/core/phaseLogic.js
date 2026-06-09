/**
 * core/phaseLogic.js — フェーズ遷移ルール（純粋関数）
 */

import { PHASE, durationSec } from "./timerState.js";

/**
 * 長い休憩を取るべきか判定する。
 * @param {number} cycleCount  現在の完了サイクル数（work 完了ごとにインクリメント）
 * @param {number} every       何サイクルごとに長い休憩を取るか
 * @returns {boolean}
 */
export function shouldLongBreak(cycleCount, every) {
  return cycleCount > 0 && cycleCount % every === 0;
}

/**
 * 現在フェーズが終了したとき、次のフェーズと新しい cycleCount を返す。
 * @param {Object} state  現在の state
 * @returns {{ phase: string, cycleCount: number }}
 */
export function nextPhase(state) {
  const { phase, cycleCount, settings } = state;

  if (phase === PHASE.WORK) {
    const newCycle = cycleCount + 1;
    const next = shouldLongBreak(newCycle, settings.longBreakEvery)
      ? PHASE.LONG_BREAK
      : PHASE.SHORT_BREAK;
    return { phase: next, cycleCount: newCycle };
  }

  // 休憩終了 → 作業へ戻る
  return { phase: PHASE.WORK, cycleCount };
}

/**
 * フェーズ遷移後の state を返す（remainingMs・pausedMs も更新）。
 * @param {Object} state
 * @returns {Object}
 */
export function advancePhase(state) {
  const { phase, cycleCount } = nextPhase(state);
  const ms = durationSec(phase, state.settings) * 1000;
  return {
    ...state,
    phase,
    cycleCount,
    isRunning:   false,
    targetTs:    null,
    remainingMs: ms,
    pausedMs:    ms,
  };
}
