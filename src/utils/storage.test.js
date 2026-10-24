import { makeActive, makeCompleted, makeQuiz } from '../test/fixtures';
import { STORAGE_KEYS } from './quizSchema';
import {
  clearActiveAttempt,
  clearHistory,
  getResumeInfo,
  loadActiveAttempt,
  loadHistory,
  recordCompletedAttempt,
  saveActiveAttempt,
} from './storage';

const quiz = makeQuiz();

describe('active attempts', () => {
  it('returns no attempt when nothing is stored', () => {
    expect(loadActiveAttempt(quiz)).toEqual({ attempt: null, discarded: false });
  });

  it('round-trips a valid attempt', () => {
    const attempt = makeActive(quiz, { currentIndex: 1, answers: { q1: 'a' } });
    expect(saveActiveAttempt(attempt)).toBe(true);
    expect(loadActiveAttempt(quiz)).toEqual({ attempt, discarded: false });
  });

  it('keeps attempts for different quizzes separate', () => {
    saveActiveAttempt(makeActive(quiz));
    saveActiveAttempt(makeActive({ ...quiz, id: 'other' }, { attemptId: 'x' }));
    clearActiveAttempt('other');
    expect(loadActiveAttempt(quiz).attempt).not.toBeNull();
  });

  it('discards invalid stored attempts', () => {
    saveActiveAttempt(makeActive(quiz, { currentIndex: 99 }));
    expect(loadActiveAttempt(quiz)).toEqual({ attempt: null, discarded: true });
  });

  it('survives corrupt JSON and wrong-shaped containers', () => {
    localStorage.setItem(STORAGE_KEYS.activeAttempt, '{not json');
    expect(loadActiveAttempt(quiz)).toEqual({ attempt: null, discarded: false });
    localStorage.setItem(STORAGE_KEYS.activeAttempt, '[1,2]');
    expect(loadActiveAttempt(quiz)).toEqual({ attempt: null, discarded: false });
  });

  it('clears an attempt and tolerates clearing a missing one', () => {
    saveActiveAttempt(makeActive(quiz));
    expect(clearActiveAttempt(quiz.id)).toBe(true);
    expect(loadActiveAttempt(quiz).attempt).toBeNull();
    expect(clearActiveAttempt('nope')).toBe(true);
  });

  it('reports write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(saveActiveAttempt(makeActive(quiz))).toBe(false);
  });
});

describe('getResumeInfo', () => {
  const summary = { id: quiz.id, questionCount: 5 };

  it('is null with no saved attempt', () => {
    expect(getResumeInfo(summary)).toBeNull();
  });

  it('reports in-progress and finished states', () => {
    saveActiveAttempt(makeActive(quiz, { currentIndex: 2, answers: { q1: 'a', q2: 'a' } }));
    expect(getResumeInfo(summary)).toEqual({ status: 'in-progress', currentIndex: 2, total: 5 });
    saveActiveAttempt(makeActive(quiz, { currentIndex: 5 }));
    expect(getResumeInfo(summary).status).toBe('finished');
  });

  it('ignores stale or malformed entries', () => {
    saveActiveAttempt(makeActive(quiz, { currentIndex: 9 }));
    expect(getResumeInfo(summary)).toBeNull();
    saveActiveAttempt(makeActive(quiz, { dataVersion: 999 }));
    expect(getResumeInfo(summary)).toBeNull();
  });
});

describe('history', () => {
  it('is empty and ok by default', () => {
    expect(loadHistory()).toEqual({ entries: [], invalidCount: 0, status: 'ok' });
  });

  it('records an attempt exactly once per attemptId', () => {
    const entry = makeCompleted();
    expect(recordCompletedAttempt(entry)).toEqual({ ok: true, added: true });
    expect(recordCompletedAttempt(entry)).toEqual({ ok: true, added: false });
    expect(loadHistory().entries).toHaveLength(1);
  });

  it('returns entries sorted oldest first', () => {
    recordCompletedAttempt(makeCompleted({ attemptId: 'late', completedAt: '2026-02-01T00:00:00.000Z' }));
    recordCompletedAttempt(makeCompleted({ attemptId: 'early', completedAt: '2026-01-01T00:00:00.000Z' }));
    expect(loadHistory().entries.map((e) => e.attemptId)).toEqual(['early', 'late']);
  });

  it('skips invalid and duplicate records and counts them', () => {
    const good = makeCompleted();
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify([good, good, { bad: true }, null]));
    const result = loadHistory();
    expect(result.entries).toHaveLength(1);
    expect(result.invalidCount).toBe(3);
  });

  it('flags corrupt data and backs it up before overwriting', () => {
    localStorage.setItem(STORAGE_KEYS.history, 'garbage');
    expect(loadHistory().status).toBe('corrupt');
    expect(recordCompletedAttempt(makeCompleted())).toEqual({ ok: true, added: true });
    expect(localStorage.getItem(STORAGE_KEYS.historyBackup)).toBe('garbage');
    expect(loadHistory().status).toBe('ok');
  });

  it('treats a non-array value as corrupt', () => {
    localStorage.setItem(STORAGE_KEYS.history, '{"a":1}');
    expect(loadHistory().status).toBe('corrupt');
  });

  it('reports unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(loadHistory().status).toBe('unavailable');
    expect(recordCompletedAttempt(makeCompleted())).toEqual({ ok: false, added: false });
  });

  it('reports a failed write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(recordCompletedAttempt(makeCompleted()).ok).toBe(false);
  });

  it('clears history', () => {
    recordCompletedAttempt(makeCompleted());
    expect(clearHistory()).toBe(true);
    expect(loadHistory().entries).toEqual([]);
  });

  it('reports a failed clear', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(clearHistory()).toBe(false);
  });
});
