/**
 * app.js — ポモドーロタイマー メインスクリプト（単一ファイル）
 * ES module import を使わず、全ロジックをここに統合。
 */

// ===== 定数 =====
var PHASE = { WORK: "work", SHORT_BREAK: "short_break", LONG_BREAK: "long_break" };
var CIRCUMFERENCE = 2 * Math.PI * 108; // ring-fill の r=108 に対応

// ===== 状態 =====
var state = {
  phase:       PHASE.WORK,
  targetTs:    null,
  remainingMs: 25 * 60 * 1000,
  pausedMs:    25 * 60 * 1000,
  isRunning:   false,
  cycleCount:  0,
  settings: {
    workMin:        25,
    shortBreakMin:  5,
    longBreakMin:   15,
    longBreakEvery: 4,
    autoStartBreak: false,
    autoStartWork:  false,
  }
};

// ===== 統計（ローカル） =====
var statsCompleted    = 0;
var statsTotalWorkSec = 0;

// ===== タイマーループ =====
var intervalId = null;

function startLoop() {
  if (intervalId) return;
  intervalId = setInterval(function () { render(Date.now()); }, 200);
}

function stopLoop() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

// ===== core: タイマー操作 =====
function durationSec(phase, settings) {
  if (phase === PHASE.SHORT_BREAK) return settings.shortBreakMin * 60;
  if (phase === PHASE.LONG_BREAK)  return settings.longBreakMin  * 60;
  return settings.workMin * 60;
}

function timerStart(nowMs) {
  if (state.isRunning) return;
  state.isRunning = true;
  state.targetTs  = nowMs + state.pausedMs;
}

function timerPause(nowMs) {
  if (!state.isRunning) return;
  var remaining = Math.max(0, state.targetTs - nowMs);
  state.isRunning   = false;
  state.targetTs    = null;
  state.remainingMs = remaining;
  state.pausedMs    = remaining;
}

function timerReset() {
  var ms = durationSec(state.phase, state.settings) * 1000;
  state.isRunning   = false;
  state.targetTs    = null;
  state.remainingMs = ms;
  state.pausedMs    = ms;
}

function timerTick(nowMs) {
  if (!state.isRunning) return;
  state.remainingMs = Math.max(0, state.targetTs - nowMs);
}

function formatTime() {
  var totalSec = Math.ceil(state.remainingMs / 1000);
  var m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  var s = (totalSec % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

function calcProgress() {
  var total = durationSec(state.phase, state.settings) * 1000;
  if (total === 0) return 0;
  return state.remainingMs / total;
}

// ===== core: フェーズ遷移 =====
function shouldLongBreak(cycleCount, every) {
  return cycleCount > 0 && cycleCount % every === 0;
}

function advancePhase() {
  var next, newCycle = state.cycleCount;

  if (state.phase === PHASE.WORK) {
    newCycle = state.cycleCount + 1;
    next = shouldLongBreak(newCycle, state.settings.longBreakEvery)
      ? PHASE.LONG_BREAK : PHASE.SHORT_BREAK;
  } else {
    next = PHASE.WORK;
  }

  var ms = durationSec(next, state.settings) * 1000;
  state.phase       = next;
  state.cycleCount  = newCycle;
  state.isRunning   = false;
  state.targetTs    = null;
  state.remainingMs = ms;
  state.pausedMs    = ms;
}

// ===== DOM 参照 =====
var elDisplay     = document.getElementById("timer-display");
var elPhaseLabel  = document.getElementById("timer-phase");
var elRingFill    = document.getElementById("ring-fill");
var elCycleTmts   = document.getElementById("cycle-tomatoes");
var elCycleCount  = document.getElementById("cycle-count");
var elBtnStart    = document.getElementById("btn-start");
var elStatComp    = document.getElementById("stat-completed");
var elStatTime    = document.getElementById("stat-total-time");
var elOverlay     = document.getElementById("settings-overlay");

// ===== UI: 表示更新 =====
var PHASE_LABEL = {};
PHASE_LABEL[PHASE.WORK]        = "作業中";
PHASE_LABEL[PHASE.SHORT_BREAK] = "短い休憩";
PHASE_LABEL[PHASE.LONG_BREAK]  = "長い休憩";

function updateDisplay() {
  elDisplay.textContent = formatTime();
  elPhaseLabel.textContent = PHASE_LABEL[state.phase] || state.phase;

  var prog   = calcProgress();
  var offset = CIRCUMFERENCE * (1 - prog);
  elRingFill.style.strokeDashoffset = offset.toFixed(2);

  document.body.className = "phase-" + state.phase;

  elCycleCount.textContent = state.cycleCount;
  var tomatoes = Math.min(state.cycleCount % state.settings.longBreakEvery || 0, 8);
  elCycleTmts.textContent = "🍅".repeat(tomatoes);
}

function updateStartBtn() {
  elBtnStart.textContent = state.isRunning ? "PAUSE" : "START";
}

function updateTabs() {
  document.querySelectorAll(".tab").forEach(function (tab) {
    var active = tab.dataset.phase === state.phase;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function updateStats() {
  elStatComp.textContent = statsCompleted;
  elStatTime.textContent = Math.floor(statsTotalWorkSec / 60) + "m";
}

// ===== タイマー tick & 期限切れ =====
function render(nowMs) {
  timerTick(nowMs);
  updateDisplay();

  if (state.isRunning && state.remainingMs === 0) {
    stopLoop();
    onExpired();
  }
}

function onExpired() {
  playSound();
  sendNotification(
    "タイマー終了",
    PHASE_LABEL[state.phase] + " が終わりました。"
  );

  if (state.phase === PHASE.WORK) {
    statsCompleted    += 1;
    statsTotalWorkSec += state.settings.workMin * 60;
    updateStats();
    postSessionComplete();
  }

  advancePhase();
  updateDisplay();
  updateStartBtn();
  updateTabs();

  var autoStart = state.phase === PHASE.WORK
    ? state.settings.autoStartWork
    : state.settings.autoStartBreak;
  if (autoStart) { handleStart(); }
}

// ===== ボタンハンドラ =====
function handleStart() {
  if (state.isRunning) {
    timerPause(Date.now());
    stopLoop();
  } else {
    timerStart(Date.now());
    startLoop();
  }
  updateStartBtn();
}

function handleReset() {
  stopLoop();
  timerReset();
  updateDisplay();
  updateStartBtn();
}

function handleSkip() {
  stopLoop();
  advancePhase();
  updateDisplay();
  updateStartBtn();
  updateTabs();
}

function handlePhaseSelect(phase) {
  stopLoop();
  var ms = durationSec(phase, state.settings) * 1000;
  state.phase       = phase;
  state.isRunning   = false;
  state.targetTs    = null;
  state.remainingMs = ms;
  state.pausedMs    = ms;
  updateDisplay();
  updateStartBtn();
  updateTabs();
}

// ===== 設定ハンドラ =====
function openSettings() {
  document.getElementById("s-work").value  = state.settings.workMin;
  document.getElementById("s-short").value = state.settings.shortBreakMin;
  document.getElementById("s-long").value  = state.settings.longBreakMin;
  document.getElementById("s-every").value = state.settings.longBreakEvery;
  document.getElementById("s-auto-break").checked = state.settings.autoStartBreak;
  document.getElementById("s-auto-work").checked  = state.settings.autoStartWork;
  elOverlay.classList.remove("hidden");
}

function closeSettings() { elOverlay.classList.add("hidden"); }

function saveSettings() {
  var ns = {
    workMin:        parseInt(document.getElementById("s-work").value,  10),
    shortBreakMin:  parseInt(document.getElementById("s-short").value, 10),
    longBreakMin:   parseInt(document.getElementById("s-long").value,  10),
    longBreakEvery: parseInt(document.getElementById("s-every").value, 10),
    autoStartBreak: document.getElementById("s-auto-break").checked,
    autoStartWork:  document.getElementById("s-auto-work").checked,
  };
  stopLoop();
  state.settings  = ns;
  state.phase     = PHASE.WORK;
  state.cycleCount = 0;
  timerReset();
  closeSettings();
  updateDisplay();
  updateStartBtn();
  updateTabs();
  saveSettingsToServer(ns);
}

// ===== 通知・サウンド =====
var isMuted = false;

function playSound() {
  if (isMuted) return;
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {}
}

function sendNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body: body });
  }
}

// ===== API 通信 =====
function loadSettingsFromServer() {
  fetch("/api/settings")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      state.settings = {
        workMin:        d.work_min        || 25,
        shortBreakMin:  d.short_break_min || 5,
        longBreakMin:   d.long_break_min  || 15,
        longBreakEvery: d.long_break_every|| 4,
        autoStartBreak: !!d.auto_start_break,
        autoStartWork:  !!d.auto_start_work,
      };
      timerReset();
      updateDisplay();
    })
    .catch(function () {});
}

function saveSettingsToServer(settings) {
  fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      work_min:         settings.workMin,
      short_break_min:  settings.shortBreakMin,
      long_break_min:   settings.longBreakMin,
      long_break_every: settings.longBreakEvery,
      auto_start_break: settings.autoStartBreak,
      auto_start_work:  settings.autoStartWork,
    })
  }).catch(function () {});
}

function postSessionComplete() {
  fetch("/api/sessions/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phase:       state.phase,
      planned_sec: state.settings.workMin * 60,
      actual_sec:  state.settings.workMin * 60,
      completed:   true,
    })
  }).catch(function () {});
}

function loadStats() {
  fetch("/api/stats/daily")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      statsCompleted    = d.completed_count || 0;
      statsTotalWorkSec = d.total_work_sec  || 0;
      updateStats();
    })
    .catch(function () {});
}

// ===== Page Visibility API =====
document.addEventListener("visibilitychange", function () {
  if (!document.hidden && state.isRunning) render(Date.now());
});

// ===== イベント登録 =====
document.getElementById("btn-start").addEventListener("click", handleStart);
document.getElementById("btn-reset").addEventListener("click", handleReset);
document.getElementById("btn-skip").addEventListener("click",  handleSkip);

document.querySelectorAll(".tab").forEach(function (tab) {
  tab.addEventListener("click", function () { handlePhaseSelect(tab.dataset.phase); });
});

document.getElementById("btn-settings").addEventListener("click",       openSettings);
document.getElementById("btn-close-settings").addEventListener("click", closeSettings);
document.getElementById("btn-save-settings").addEventListener("click",  saveSettings);
document.getElementById("settings-overlay").addEventListener("click", function (e) {
  if (e.target === elOverlay) closeSettings();
});

document.getElementById("s-mute").addEventListener("change", function (e) {
  isMuted = e.target.checked;
});

// ===== 通知許可リクエスト =====
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission().catch(function () {});
}

// ===== 初期描画 =====
loadSettingsFromServer();
loadStats();
updateDisplay();
updateStartBtn();
updateTabs();

import { advancePhase } from "./core/phaseLogic.js";
import {
  updateDisplay, updateStartButton, updatePhaseTabs, updateStats,
} from "./ui/timerDisplay.js";
import { registerControls } from "./ui/controls.js";
import {
  openSettings, closeSettings, readSettings, registerSettingsEvents,
} from "./ui/settingsPanel.js";
import {
  playSound, sendNotification, requestNotificationPermission, setMuted,
} from "./ui/notificationManager.js";

// ===== 状態 =====
let state = createState();

// ===== 統計（ローカル） =====
let statsCompleted = 0;
let statsTotalWorkSec = 0;

// ===== タイマーループ =====
let intervalId = null;

function startLoop() {
  if (intervalId) return;
  intervalId = setInterval(() => render(Date.now()), 200);
}

function stopLoop() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

function render(nowMs) {
  state = tick(state, nowMs);
  updateDisplay(state, formatTime(state), progress(state));

  if (isExpired(state)) {
    stopLoop();
    onTimerExpired();
  }
}

// ===== タイマー終了処理 =====
async function onTimerExpired() {
  playSound();

  const phaseLabel = {
    [PHASE.WORK]:        "作業",
    [PHASE.SHORT_BREAK]: "短い休憩",
    [PHASE.LONG_BREAK]:  "長い休憩",
  }[state.phase] ?? state.phase;

  sendNotification("タイマー終了", `${phaseLabel}が終わりました。`);

  // 作業フェーズ完了時に統計を更新
  if (state.phase === PHASE.WORK) {
    statsCompleted += 1;
    statsTotalWorkSec += state.settings.workMin * 60;
    updateStats(statsCompleted, statsTotalWorkSec);
    await postSessionComplete(state);
  }

  // フェーズ遷移
  state = advancePhase(state);
  updateDisplay(state, formatTime(state), progress(state));
  updateStartButton(false);
  updatePhaseTabs(state.phase);

  // 自動開始
  const autoStart = state.phase === PHASE.WORK
    ? state.settings.autoStartWork
    : state.settings.autoStartBreak;
  if (autoStart) handleStart();
}

// ===== ボタンハンドラ =====
function handleStart() {
  if (state.isRunning) {
    state = pause(state, Date.now());
    stopLoop();
  } else {
    state = start(state, Date.now());
    startLoop();
  }
  updateStartButton(state.isRunning);
}

function handleReset() {
  stopLoop();
  state = reset(state);
  updateDisplay(state, formatTime(state), progress(state));
  updateStartButton(false);
}

function handleSkip() {
  stopLoop();
  state = advancePhase(state);
  updateDisplay(state, formatTime(state), progress(state));
  updateStartButton(false);
  updatePhaseTabs(state.phase);
}

function handlePhaseSelect(phase) {
  stopLoop();
  const ms = durationSec(phase, state.settings) * 1000;
  state = {
    ...state,
    phase,
    isRunning:   false,
    targetTs:    null,
    remainingMs: ms,
    pausedMs:    ms,
  };
  updateDisplay(state, formatTime(state), progress(state));
  updateStartButton(false);
  updatePhaseTabs(phase);
}

// ===== 設定ハンドラ =====
function handleOpenSettings() {
  openSettings(state.settings);
}

function handleSaveSettings() {
  const newSettings = readSettings();
  stopLoop();
  state = createState(newSettings);
  closeSettings();
  updateDisplay(state, formatTime(state), progress(state));
  updateStartButton(false);
  updatePhaseTabs(state.phase);
  saveSettingsToServer(newSettings);
}

// ===== Page Visibility API（タブ切替時の再同期） =====
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.isRunning) {
    render(Date.now());
  }
});

// ===== API 通信 =====
async function loadSettingsFromServer() {
  try {
    const res = await fetch("/api/settings");
    if (!res.ok) return;
    const data = await res.json();
    state = createState({
      workMin:        data.work_min,
      shortBreakMin:  data.short_break_min,
      longBreakMin:   data.long_break_min,
      longBreakEvery: data.long_break_every,
      autoStartBreak: !!data.auto_start_break,
      autoStartWork:  !!data.auto_start_work,
    });
  } catch (_) { /* オフライン時はデフォルト設定を使用 */ }
}

async function saveSettingsToServer(settings) {
  try {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        work_min:        settings.workMin,
        short_break_min: settings.shortBreakMin,
        long_break_min:  settings.longBreakMin,
        long_break_every: settings.longBreakEvery,
        auto_start_break: settings.autoStartBreak,
        auto_start_work:  settings.autoStartWork,
      }),
    });
  } catch (_) {}
}

async function postSessionComplete(s) {
  try {
    await fetch("/api/sessions/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phase:       s.phase,
        planned_sec: s.settings.workMin * 60,
        actual_sec:  s.settings.workMin * 60,
        completed:   true,
      }),
    });
  } catch (_) {}
}

async function loadStats() {
  try {
    const res = await fetch("/api/stats/daily");
    if (!res.ok) return;
    const data = await res.json();
    statsCompleted    = data.completed_count ?? 0;
    statsTotalWorkSec = data.total_work_sec  ?? 0;
    updateStats(statsCompleted, statsTotalWorkSec);
  } catch (_) {}
}

// ===== 初期化 =====
async function init() {
  await requestNotificationPermission();
  await loadSettingsFromServer();
  await loadStats();

  // ミュートチェックボックス
  document.getElementById("setting-mute").addEventListener("change", e => {
    setMuted(e.target.checked);
  });

  registerControls({
    onStart:       handleStart,
    onReset:       handleReset,
    onSkip:        handleSkip,
    onPhaseSelect: handlePhaseSelect,
  });

  registerSettingsEvents({
    onOpen:  handleOpenSettings,
    onSave:  handleSaveSettings,
    onClose: closeSettings,
  });

  updateDisplay(state, formatTime(state), progress(state));
  updateStartButton(false);
  updatePhaseTabs(state.phase);
}

init();
