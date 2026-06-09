/**
 * ui/notificationManager.js — ブラウザ通知・サウンド通知
 */

let muted = false;

export function setMuted(val) { muted = val; }

/**
 * Web Audio API でビープ音を鳴らす。
 */
export function playSound() {
  if (muted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // Web Audio API 未対応環境では無視
  }
}

/**
 * デスクトップ通知を送る（許可済みの場合のみ）。
 * @param {string} title
 * @param {string} body
 */
export function sendNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/static/img/tomato.png" });
  }
}

/**
 * 通知許可をリクエストする。
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}
