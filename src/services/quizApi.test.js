import { categories, quizzes } from '../data/quizData';
import { fetchCategories, fetchQuiz, fetchQuizzes } from './quizApi';

async function settle(promise) {
  await vi.advanceTimersByTimeAsync(500);
  return promise;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('quizApi', () => {
  it('fetchCategories returns a copy of the categories', async () => {
    const result = await settle(fetchCategories());
    expect(result).toEqual(categories);
    expect(result).not.toBe(categories);
  });

  it('fetchQuizzes returns summaries without questions', async () => {
    const result = await settle(fetchQuizzes());
    expect(result).toHaveLength(quizzes.length);
    result.forEach((summary, i) => {
      expect(summary).not.toHaveProperty('questions');
      expect(summary.questionCount).toBe(quizzes[i].questions.length);
    });
  });

  it('fetchQuiz returns the full quiz', async () => {
    const result = await settle(fetchQuiz(quizzes[0].id));
    expect(result.questions).toHaveLength(quizzes[0].questions.length);
  });

  it('fetchQuiz rejects for an unknown id', async () => {
    const promise = fetchQuiz('missing');
    const assertion = expect(promise).rejects.toThrow('could not be found');
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });

  it('fetchQuiz does not leak mutations back into the data', async () => {
    const result = await settle(fetchQuiz(quizzes[0].id));
    result.title = 'changed';
    expect(quizzes[0].title).not.toBe('changed');
  });

  it('simulates a network failure in error mode', async () => {
    localStorage.setItem('quizapp:mock', 'error');
    const assertions = [
      expect(fetchCategories()).rejects.toThrow('Unable to reach'),
      expect(fetchQuizzes()).rejects.toThrow('Unable to reach'),
      expect(fetchQuiz(quizzes[0].id)).rejects.toThrow('Unable to reach'),
    ];
    await vi.advanceTimersByTimeAsync(500);
    await Promise.all(assertions);
  });

  it('returns empty lists in empty mode', async () => {
    localStorage.setItem('quizapp:mock', 'empty');
    expect(await settle(fetchQuizzes())).toEqual([]);
    expect(await settle(fetchCategories())).toEqual([]);
  });
});
