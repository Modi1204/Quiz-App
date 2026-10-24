import { useCallback, useEffect, useReducer, useState } from 'react';
import { DATA_VERSION } from '../data/quizData';
import { STORAGE_SCHEMA_VERSION, calculateScore } from '../utils/quizSchema';
import { clearActiveAttempt, loadActiveAttempt, recordCompletedAttempt, saveActiveAttempt } from '../utils/storage';

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createAttempt(quiz) {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    dataVersion: DATA_VERSION,
    attemptId: newId(),
    quizId: quiz.id,
    startedAt: new Date().toISOString(),
    currentIndex: 0,
    answers: {},
  };
}

/**
 * The only place attempt state changes. It is pure and sequential, so two rapid events are
 * always applied one after the other against the latest state, and each action names the
 * question/index it was meant for. Anything stale, duplicate or out of order is a no-op.
 */
export function attemptReducer(state, action) {
  switch (action.type) {
    case 'answer': {
      const question = action.quiz.questions[state.currentIndex];
      if (!question || question.id !== action.questionId) return state;
      if (state.answers[question.id] !== undefined) return state; // answer is locked
      if (!question.options.some((o) => o.id === action.optionId)) return state;
      return { ...state, answers: { ...state.answers, [question.id]: action.optionId } };
    }
    case 'next': {
      if (action.fromIndex !== state.currentIndex) return state; // already advanced
      const question = action.quiz.questions[state.currentIndex];
      if (!question || state.answers[question.id] === undefined) return state; // cannot skip
      return { ...state, currentIndex: state.currentIndex + 1, ...(state.currentIndex + 1 >= action.quiz.questions.length ? { completedAt: action.now } : {}) };
    }
    case 'restart':
      return createAttempt(action.quiz);
    default:
      return state;
  }
}

export function useQuizAttempt(quiz) {
  const [initial] = useState(() => {
    const { attempt, discarded } = loadActiveAttempt(quiz);
    return { attempt: attempt ?? createAttempt(quiz), resumed: Boolean(attempt), discarded };
  });
  const [attempt, dispatch] = useReducer(attemptReducer, initial.attempt);
  const [saveFailed, setSaveFailed] = useState(false);

  // Persist after every change. An untouched attempt is not saved (and clears any stale entry).
  useEffect(() => {
    if (Object.keys(attempt.answers).length === 0) {
      clearActiveAttempt(quiz.id);
      return;
    }
    setSaveFailed(!saveActiveAttempt(attempt));
  }, [attempt, quiz.id]);

  const total = quiz.questions.length;
  const finished = attempt.currentIndex >= total;
  const question = finished ? null : quiz.questions[attempt.currentIndex];
  const selectedOptionId = question ? attempt.answers[question.id] : undefined;
  const result = finished ? calculateScore(quiz, attempt.answers) : null;

  // Save the completed attempt to history. recordCompletedAttempt is idempotent per attemptId,
  // so re-renders, StrictMode double effects and refreshes cannot create duplicates.
  const [historyStatus, setHistoryStatus] = useState('idle'); // idle | saved | failed
  const [saveTick, setSaveTick] = useState(0);
  useEffect(() => {
    if (!finished) {
      setHistoryStatus('idle');
      return;
    }
    const { score, total: count, percentage } = calculateScore(quiz, attempt.answers);
    const { ok } = recordCompletedAttempt({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      attemptId: attempt.attemptId,
      quizId: quiz.id,
      quizTitle: quiz.title,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt ?? new Date().toISOString(),
      answers: attempt.answers,
      score,
      total: count,
      percentage,
    });
    setHistoryStatus(ok ? 'saved' : 'failed');
  }, [finished, attempt.attemptId, saveTick]);

  const retrySave = useCallback(() => setSaveTick((t) => t + 1), []);

  const answer = useCallback(
    (questionId, optionId) => dispatch({ type: 'answer', quiz, questionId, optionId }),
    [quiz],
  );
  const next = useCallback(
    () => dispatch({ type: 'next', quiz, fromIndex: attempt.currentIndex, now: new Date().toISOString() }),
    [quiz, attempt.currentIndex],
  );
  const restart = useCallback(() => dispatch({ type: 'restart', quiz }), [quiz]);

  return {
    attempt,
    total,
    finished,
    question,
    selectedOptionId,
    answeredCount: Object.keys(attempt.answers).length,
    result,
    historyStatus,
    retrySave,
    resumed: initial.resumed,
    discarded: initial.discarded,
    saveFailed,
    answer,
    next,
    restart,
  };
}
