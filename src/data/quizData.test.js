import { validateQuiz } from '../utils/quizSchema';
import { DATA_VERSION, categories, quizzes } from './quizData';

describe('quizData', () => {
  it('has a positive integer data version', () => {
    expect(Number.isInteger(DATA_VERSION)).toBe(true);
    expect(DATA_VERSION).toBeGreaterThan(0);
  });

  it('has unique category and quiz ids', () => {
    expect(new Set(categories.map((c) => c.id)).size).toBe(categories.length);
    expect(new Set(quizzes.map((q) => q.id)).size).toBe(quizzes.length);
  });

  it.each(quizzes.map((q) => [q.id, q]))('quiz "%s" is valid and belongs to a known category', (_id, quiz) => {
    expect(validateQuiz(quiz)).toEqual([]);
    expect(categories.some((c) => c.id === quiz.categoryId)).toBe(true);
  });

  it('every category has display fields', () => {
    categories.forEach((c) => {
      expect(c.name).toBeTruthy();
      expect(c.description).toBeTruthy();
    });
  });
});
