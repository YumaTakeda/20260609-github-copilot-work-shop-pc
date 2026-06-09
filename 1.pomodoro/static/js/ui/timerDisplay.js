/**
 * ui/timerDisplay.js — DOM 操作：残り時間・進捗リング・フェーズ色
 */

const CIRCUMFERENCE = 2 * Math.PI * 96; // stroke-dasharray と一致

const elDisplay = document.getElementById("timer-display");
const elFill    = document.getElementById("progress-ring-fill");
const elCycleDots  = document.getElementById("cycle-dots");
const elCycleCount = document.getElementById("cycle-count");

/**
 * タイマー表示全体を state から更新する。
 * @param {Object} state
 * @param {string} formattedTime  formatTime(state) の結果
 * @param {number} prog           progress(state) 0.0〜1.0
 */
export function updateDisplay(state, formattedTime, prog) {
  // 残り時間テキスト
  elDisplay.textContent = formattedTime;

  // 進捗リング（1.0 = 満タン、0.0 = 空）
  const offset = CIRCUMFERENCE * (1 - prog);
  elFill.style.strokeDashoffset = offset.toFixed(2);

  // フェーズカラー（CSS カスタムプロパティ経由）
  document.body.className = `phase-${state.phase}`;

  // サイクル数
  elCycleCount.textContent = state.cycleCount;
  elCycleDots.textContent = "🍅".repeat(Math.min(state.cycleCount % state.settings.longBreakEvery || state.settings.longBreakEvery, 8));
}

/**
 * Start ボタンのラベルを切り替える。
 * @param {boolean} isRunning
 */
export function updateStartButton(isRunning) {
  const btn = document.getElementById("btn-start");
  btn.textContent = isRunning ? "Pause" : "Start";
}

/**
 * アクティブなフェーズタブを切り替える。
 * @param {string} phase
 */
export function updatePhaseTabs(phase) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.phase === phase);
    tab.setAttribute("aria-selected", tab.dataset.phase === phase ? "true" : "false");
  });
}

/**
 * 統計パネルを更新する。
 * @param {number} completedCount
 * @param {number} totalWorkSec
 */
export function updateStats(completedCount, totalWorkSec) {
  document.getElementById("stat-completed").textContent = completedCount;
  const minutes = Math.floor(totalWorkSec / 60);
  document.getElementById("stat-total-time").textContent = `${minutes}m`;
}
