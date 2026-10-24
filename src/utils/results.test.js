import { makeQuiz } from '../test/fixtures';
import { formatDate, getMissedQuestions, getPerformance } from './results';

describe('getPerformance', () => {
  it.each([
    [100, 'excellent'],
    [99, 'great'],
    [80, 'great'],
    [79, 'good'],
    [60, 'good'],
    [59, 'fair'],
    [40, 'fair'],
    [39, 'low'],
    [0, 'low'],
  ])('maps %i%% to %s', (percentage, tone) => {
    expect(getPerformance(percentage).tone).toBe(tone);
  });

  it('returns a title and message for each tier', () => {
    const { title, message } = getPerformance(50);
    expect(title).toBeTruthy();
    expect(message).toBeTruthy();
  });
});

describe('getMissedQuestions', () => {
  const quiz = makeQuiz();

  it('returns nothing when everything is correct', () => {
    const answers = Object.fromEntries(quiz.questions.map((q) => [q.id, 'a']));
    expect(getMissedQuestions(quiz, answers)).toEqual([]);
  });

  it('describes wrong and unanswered questions with 1-based numbers', () => {
    const missed = getMissedQuestions(quiz, { q1: 'a', q2: 'b', q3: 'a', q4: 'a' });
    expect(missed.map((m) => m.number)).toEqual([2, 5]);
    expect(missed[0]).toMatchObject({ prompt: 'Prompt 2', yourAnswer: 'Wrong 2', correctAnswer: 'Right 2', explanation: 'Because 2' });
    expect(missed[1].yourAnswer).toBeNull();
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date', () => {
    expect(formatDate('2026-01-01T10:00:00.000Z')).toMatch(/2026/);
  });

  it('falls back for invalid input', () => {
    expect(formatDate('garbage')).toBe('Unknown date');
    expect(formatDate(undefined)).toBe('Unknown date');
  });
});
