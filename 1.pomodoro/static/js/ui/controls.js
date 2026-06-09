/**
 * ui/controls.js — ボタンイベント登録
 * コールバックを受け取ることで app.js との結合を疎にする。
 */

/**
 * @param {Object} handlers
 * @param {Function} handlers.onStart   Start/Pause ボタン
 * @param {Function} handlers.onReset   Reset ボタン
 * @param {Function} handlers.onSkip    Skip ボタン
 * @param {Function} handlers.onPhaseSelect  フェーズタブ選択（phase: string）
 */
export function registerControls({ onStart, onReset, onSkip, onPhaseSelect }) {
  document.getElementById("btn-start").addEventListener("click", onStart);
  document.getElementById("btn-reset").addEventListener("click", onReset);
  document.getElementById("btn-skip").addEventListener("click", onSkip);

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => onPhaseSelect(tab.dataset.phase));
  });
}
