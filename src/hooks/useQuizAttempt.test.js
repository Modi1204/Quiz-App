import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { makeActive, makeQuiz } from '../test/fixtures';
import { loadActiveAttempt, loadHistory, saveActiveAttempt } from '../utils/storage';
import { attemptReducer, createAttempt, useQuizAttempt } from './useQuizAttempt';

const quiz = makeQuiz();
const run = (state, action) => attemptReducer(state, { quiz, now: '2026-01-01T00:00:00.000Z', ...action });

describe('createAttempt', () => {
  it('starts empty at the first question', () => {
    const attempt = createAttempt(quiz);
    expect(attempt).toMatchObject({ quizId: quiz.id, currentIndex: 0, answers: {} });
    expect(attempt.attemptId).toBeTruthy();
  });

  it('gives every attempt a unique id', () => {
    expect(createAttempt(quiz).attemptId).not.toBe(createAttempt(quiz).attemptId);
  });
});

describe('attemptReducer', () => {
  it('records an answer', () => {
    const s = run(createAttempt(quiz), { type: 'answer', questionId: 'q1', optionId: 'b' });
    expect(s.answers).toEqual({ q1: 'b' });
  });

  it('locks the first answer', () => {
    let s = run(createAttempt(quiz), { type: 'answer', questionId: 'q1', optionId: 'b' });
    const before = s;
    s = run(s, { type: 'answer', questionId: 'q1', optionId: 'a' });
    expect(s).toBe(before);
  });

  it('ignores answers for the wrong question or an unknown option', () => {
    const s = createAttempt(quiz);
    expect(run(s, { type: 'answer', questionId: 'q2', optionId: 'a' })).toBe(s);
    expect(run(s, { type: 'answer', questionId: 'q1', optionId: 'zzz' })).toBe(s);
  });

  it('refuses to advance before answering', () => {
    const s = createAttempt(quiz);
    expect(run(s, { type: 'next', fromIndex: 0 })).toBe(s);
  });

  it('advances once even when next is dispatched repeatedly', () => {
    let s = run(createAttempt(quiz), { type: 'answer', questionId: 'q1', optionId: 'a' });
    s = run(s, { type: 'next', fromIndex: 0 });
    s = run(s, { type: 'next', fromIndex: 0 });
    s = run(s, { type: 'next', fromIndex: 0 });
    expect(s.currentIndex).toBe(1);
  });

  it('stamps completedAt on the last question only', () => {
    let s = createAttempt(quiz);
    quiz.questions.forEach((q, i) => {
      s = run(s, { type: 'answer', questionId: q.id, optionId: 'a' });
      s = run(s, { type: 'next', fromIndex: i });
      if (i < quiz.questions.length - 1) expect(s.completedAt).toBeUndefined();
    });
    expect(s.currentIndex).toBe(quiz.questions.length);
    expect(s.completedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('restart creates a new attempt', () => {
    const s = run(createAttempt(quiz), { type: 'answer', questionId: 'q1', optionId: 'a' });
    const fresh = run(s, { type: 'restart' });
    expect(fresh.answers).toEqual({});
    expect(fresh.attemptId).not.toBe(s.attemptId);
  });

  it('ignores unknown actions', () => {
    const s = createAttempt(quiz);
    expect(run(s, { type: 'bogus' })).toBe(s);
  });
});

describe('useQuizAttempt', () => {
  const render = () => renderHook(() => useQuizAttempt(quiz), { wrapper: StrictMode });
  const answerAndNext = (result, optionId) => {
    act(() => result.current.answer(result.current.question.id, optionId));
    act(() => result.current.next());
  };

  it('starts a fresh attempt and does not persist it until answered', () => {
    const { result } = render();
    expect(result.current.resumed).toBe(false);
    expect(result.current.finished).toBe(false);
    expect(result.current.question.id).toBe('q1');
    expect(loadActiveAttempt(quiz).attempt).toBeNull();
  });

  it('persists progress after an answer', () => {
    const { result } = render();
    act(() => result.current.answer('q1', 'a'));
    expect(result.current.answeredCount).toBe(1);
    expect(loadActiveAttempt(quiz).attempt.answers).toEqual({ q1: 'a' });
  });

  it('does not double-count rapid answers and Next clicks within one batch', () => {
    const { result } = render();
    act(() => {
      result.current.answer('q1', 'a');
      result.current.answer('q1', 'b');
      result.current.next();
      result.current.next();
    });
    expect(result.current.answeredCount).toBe(1);
    expect(result.current.attempt.currentIndex).toBeLessThanOrEqual(1);
  });

  it('resumes a saved attempt', () => {
    saveActiveAttempt(makeActive(quiz, { currentIndex: 2, answers: { q1: 'a', q2: 'b' } }));
    const { result } = render();
    expect(result.current.resumed).toBe(true);
    expect(result.current.question.id).toBe('q3');
  });

  it('flags a discarded invalid saved attempt and starts fresh', () => {
    saveActiveAttempt(makeActive(quiz, { currentIndex: 99 }));
    const { result } = render();
    expect(result.current.discarded).toBe(true);
    expect(result.current.attempt.currentIndex).toBe(0);
  });

  it('completes a quiz, computes the score and saves history once', () => {
    const { result } = render();
    ['a', 'b', 'a', 'b', 'a'].forEach((choice) => answerAndNext(result, choice));
    expect(result.current.finished).toBe(true);
    expect(result.current.result).toEqual({ score: 3, total: 5, percentage: 60 });
    expect(result.current.historyStatus).toBe('saved');
    expect(loadHistory().entries).toHaveLength(1);
  });

  it('retake after finishing records a second distinct attempt', () => {
    const { result } = render();
    ['a', 'a', 'a', 'a', 'a'].forEach((choice) => answerAndNext(result, choice));
    act(() => result.current.restart());
    expect(result.current.finished).toBe(false);
    ['b', 'b', 'b', 'b', 'b'].forEach((choice) => answerAndNext(result, choice));
    const { entries } = loadHistory();
    expect(entries.map((e) => e.percentage).sort()).toEqual([0, 100]);
  });

  it('reports a history save failure and recovers on retry', () => {
    const { result } = render();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    ['a', 'a', 'a', 'a', 'a'].forEach((choice) => answerAndNext(result, choice));
    expect(result.current.historyStatus).toBe('failed');
    expect(result.current.saveFailed).toBe(true);
    spy.mockRestore();
    act(() => result.current.retrySave());
    expect(result.current.historyStatus).toBe('saved');
    expect(loadHistory().entries).toHaveLength(1);
  });
});
