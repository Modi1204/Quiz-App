import { DATA_VERSION } from '../data/quizData';
import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION, validateActiveAttempt, validateCompletedAttempt } from './quizSchema';

// localStorage can be unavailable (private mode, quota, disabled) or hold corrupt data,
// so every access is guarded and writes report success instead of assuming it.
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// Active attempts are stored as a map keyed by quizId so several quizzes can be in progress.
function readActiveMap() {
  const value = readJson(STORAGE_KEYS.activeAttempt, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/** Returns { attempt, discarded }. A stored attempt that fails validation is reported as discarded. */
export function loadActiveAttempt(quiz) {
  const entry = readActiveMap()[quiz.id];
  if (entry === undefined) return { attempt: null, discarded: false };
  if (validateActiveAttempt(entry, quiz)) return { attempt: entry, discarded: false };
  return { attempt: null, discarded: true };
}

/** Returns true if the write succeeded. */
export function saveActiveAttempt(attempt) {
  const map = readActiveMap();
  map[attempt.quizId] = attempt;
  return writeJson(STORAGE_KEYS.activeAttempt, map);
}

export function clearActiveAttempt(quizId) {
  const map = readActiveMap();
  if (!(quizId in map)) return true;
  delete map[quizId];
  return writeJson(STORAGE_KEYS.activeAttempt, map);
}

/**
 * Lightweight check for the quiz list, which only has summaries (no question ids).
 * Full validation happens when the quiz itself loads.
 * Returns null, or { status: 'in-progress' | 'finished', currentIndex, total }.
 */
export function getResumeInfo(summary) {
  const entry = readActiveMap()[summary.id];
  if (
    !entry ||
    entry.schemaVersion !== STORAGE_SCHEMA_VERSION ||
    entry.dataVersion !== DATA_VERSION ||
    entry.quizId !== summary.id ||
    !Number.isInteger(entry.currentIndex) ||
    entry.currentIndex < 0 ||
    entry.currentIndex > summary.questionCount ||
    !entry.answers ||
    typeof entry.answers !== 'object'
  ) {
    return null;
  }
  const finished = entry.currentIndex === summary.questionCount;
  return { status: finished ? 'finished' : 'in-progress', currentIndex: entry.currentIndex, total: summary.questionCount };
}

/**
 * Reads the attempt history. Never throws.
 * status: 'ok' | 'corrupt' (stored value is not a list) | 'unavailable' (storage cannot be read)
 * invalidCount: records that failed validation or were duplicates and were skipped.
 */
export function loadHistory() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.history);
  } catch {
    return { entries: [], invalidCount: 0, status: 'unavailable' };
  }
  if (raw == null) return { entries: [], invalidCount: 0, status: 'ok' };

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed)) return { entries: [], invalidCount: 0, status: 'corrupt', raw };

  const seen = new Set();
  const entries = [];
  let invalidCount = 0;
  for (const entry of parsed) {
    if (validateCompletedAttempt(entry) && !seen.has(entry.attemptId)) {
      seen.add(entry.attemptId);
      entries.push(entry);
    } else {
      invalidCount += 1;
    }
  }
  entries.sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));
  return { entries, invalidCount, status: 'ok' };
}

/**
 * Appends a completed attempt exactly once (idempotent by attemptId), so repeated calls from
 * re-renders, refreshes or double clicks cannot create duplicate history entries.
 * Returns { ok, added }; ok is false when the data could not be persisted.
 */
export function recordCompletedAttempt(entry) {
  const history = loadHistory();
  if (history.status === 'unavailable') return { ok: false, added: false };
  if (history.entries.some((e) => e.attemptId === entry.attemptId)) return { ok: true, added: false };
  if (history.status === 'corrupt') {
    // Keep the unreadable data for recovery rather than silently destroying it.
    try {
      localStorage.setItem(STORAGE_KEYS.historyBackup, history.raw);
    } catch {
      /* best effort */
    }
  }
  return { ok: writeJson(STORAGE_KEYS.history, [...history.entries, entry]), added: true };
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEYS.history);
    return true;
  } catch {
    return false;
  }
}
