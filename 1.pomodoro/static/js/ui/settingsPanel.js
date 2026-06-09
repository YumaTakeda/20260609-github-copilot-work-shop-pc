/**
 * ui/settingsPanel.js — 設定パネルの開閉・値読み書き
 */

const overlay = document.getElementById("settings-overlay");

export function openSettings(settings) {
  document.getElementById("setting-work-min").value        = settings.workMin;
  document.getElementById("setting-short-break-min").value = settings.shortBreakMin;
  document.getElementById("setting-long-break-min").value  = settings.longBreakMin;
  document.getElementById("setting-long-break-every").value= settings.longBreakEvery;
  document.getElementById("setting-auto-start-break").checked = settings.autoStartBreak;
  document.getElementById("setting-auto-start-work").checked  = settings.autoStartWork;
  overlay.classList.remove("hidden");
}

export function closeSettings() {
  overlay.classList.add("hidden");
}

/**
 * 入力値を読み取って設定オブジェクトを返す。
 * @returns {Object}
 */
export function readSettings() {
  return {
    workMin:        parseInt(document.getElementById("setting-work-min").value, 10),
    shortBreakMin:  parseInt(document.getElementById("setting-short-break-min").value, 10),
    longBreakMin:   parseInt(document.getElementById("setting-long-break-min").value, 10),
    longBreakEvery: parseInt(document.getElementById("setting-long-break-every").value, 10),
    autoStartBreak: document.getElementById("setting-auto-start-break").checked,
    autoStartWork:  document.getElementById("setting-auto-start-work").checked,
  };
}

/**
 * @param {Object} handlers
 * @param {Function} handlers.onOpen   設定を開く
 * @param {Function} handlers.onSave   設定を保存
 * @param {Function} handlers.onClose  設定を閉じる
 */
export function registerSettingsEvents({ onOpen, onSave, onClose }) {
  document.getElementById("btn-settings").addEventListener("click", onOpen);
  document.getElementById("btn-settings-save").addEventListener("click", onSave);
  document.getElementById("btn-settings-close").addEventListener("click", onClose);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) onClose();
  });
}
