import { DATA_VERSION } from '../data/quizData';
import { STORAGE_SCHEMA_VERSION } from '../utils/quizSchema';

export function makeQuiz(overrides = {}) {
  return {
    id: 'test-quiz',
    categoryId: 'cat',
    title: 'Test Quiz',
    description: 'A quiz for tests',
    difficulty: 'beginner',
    questions: Array.from({ length: 5 }, (_, i) => ({
      id: `q${i + 1}`,
      prompt: `Prompt ${i + 1}`,
      options: [
        { id: 'a', text: `Right ${i + 1}` },
        { id: 'b', text: `Wrong ${i + 1}` },
      ],
      correctOptionId: 'a',
      explanation: `Because ${i + 1}`,
    })),
    ...overrides,
  };
}

export function makeCompleted(overrides = {}) {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    attemptId: 'attempt-1',
    quizId: 'test-quiz',
    quizTitle: 'Test Quiz',
    startedAt: '2026-01-01T10:00:00.000Z',
    completedAt: '2026-01-01T10:05:00.000Z',
    answers: {},
    score: 3,
    total: 5,
    percentage: 60,
    ...overrides,
  };
}

export function makeActive(quiz, overrides = {}) {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    dataVersion: DATA_VERSION,
    attemptId: 'active-1',
    quizId: quiz.id,
    startedAt: '2026-01-01T10:00:00.000Z',
    currentIndex: 0,
    answers: {},
    ...overrides,
  };
}
