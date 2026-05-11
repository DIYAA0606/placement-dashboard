"use strict";

const ACTIVITY_KEY = "placeprep_activity";

function recordActivity() {

  const today = new Date().toISOString().split("T")[0];

  const log = Storage.get(ACTIVITY_KEY, []);

  if (!log.includes(today)) {
    log.push(today);
  }

  Storage.set(ACTIVITY_KEY, log);
}

function calculateStreak() {

  const log = Storage.get(ACTIVITY_KEY, []).sort();
  if (!log.length) return 0;

  let streak = 1;
  const today = new Date().toISOString().split("T")[0];

  // Walk backwards from today
  for (let i = log.length - 1; i > 0; i--) {
    const curr = new Date(log[i]);
    const prev = new Date(log[i - 1]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }

  // Streak only valid if today or yesterday is in log
  const last = log[log.length - 1];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  if (last !== today && last !== yStr) return 0;

  return streak;
}
const ACTIVITY_LOG_KEY = "placeprep_activity_log";
const MAX_LOG = 20;

function logEvent(type, label) {
  const log = Storage.get(ACTIVITY_LOG_KEY, []);
  log.unshift({ type, label, time: new Date().toISOString() });
  Storage.set(ACTIVITY_LOG_KEY, log.slice(0, MAX_LOG));
}

function getActivityLog() {
  return Storage.get(ACTIVITY_LOG_KEY, []);
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}