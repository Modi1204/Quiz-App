import { makeActive, makeCompleted, makeQuiz } from '../test/fixtures';
import { calculateScore, validateActiveAttempt, validateCompletedAttempt, validateQuiz } from './quizSchema';

describe('validateQuiz', () => {
  it('accepts a well-formed quiz', () => {
    expect(validateQuiz(makeQuiz())).toEqual([]);
  });

  it.each([null, undefined, 'x', 5])('rejects a non-object quiz (%s)', (value) => {
    expect(validateQuiz(value)).toEqual(['Quiz is missing']);
  });

  it('reports missing top-level fields', () => {
    const errors = validateQuiz(makeQuiz({ id: '', title: ' ', categoryId: undefined }));
    expect(errors).toEqual(expect.arrayContaining(['Quiz id is required', 'Quiz title is required', 'Quiz category is required']));
  });

  it('requires the minimum number of questions', () => {
    expect(validateQuiz(makeQuiz({ questions: [] }))[0]).toMatch(/at least 5 questions/);
    expect(validateQuiz(makeQuiz({ questions: undefined }))[0]).toMatch(/at least 5 questions/);
  });

  it('flags a correctOptionId that matches no option', () => {
    const quiz = makeQuiz();
    quiz.questions[2].correctOptionId = 'zzz';
    expect(validateQuiz(quiz)).toEqual(['Question 3: correctOptionId does not match an option']);
  });

  it('flags missing prompt and explanation', () => {
    const quiz = makeQuiz();
    quiz.questions[0].prompt = '';
    quiz.questions[0].explanation = '';
    expect(validateQuiz(quiz)).toEqual(['Question 1: prompt is required', 'Question 1: explanation is required']);
  });

  it('flags too few or malformed options', () => {
    const quiz = makeQuiz();
    quiz.questions[0].options = [{ id: 'a', text: 'only one' }];
    quiz.questions[1].options = [{ id: 'a', text: '' }, { id: 'b', text: 'ok' }];
    const errors = validateQuiz(quiz);
    expect(errors).toContain('Question 1: needs at least 2 options with id and text');
    expect(errors).toContain('Question 2: needs at least 2 options with id and text');
  });

  it('flags duplicate option ids and duplicate question ids', () => {
    const quiz = makeQuiz();
    quiz.questions[0].options = [{ id: 'a', text: 'x' }, { id: 'a', text: 'y' }];
    quiz.questions[1].id = quiz.questions[0].id;
    const errors = validateQuiz(quiz);
    expect(errors).toContain('Question 1: option ids must be unique');
    expect(errors).toContain('Question 2: duplicate id "q1"');
  });
});

describe('validateActiveAttempt', () => {
  const quiz = makeQuiz();

  it('accepts a fresh attempt and a mid-quiz attempt', () => {
    expect(validateActiveAttempt(makeActive(quiz), quiz)).toBe(true);
    expect(validateActiveAttempt(makeActive(quiz, { currentIndex: 2, answers: { q1: 'a', q2: 'b' } }), quiz)).toBe(true);
  });

  it('accepts a finished attempt (index === length)', () => {
    const answers = Object.fromEntries(quiz.questions.map((q) => [q.id, 'a']));
    expect(validateActiveAttempt(makeActive(quiz, { currentIndex: 5, answers }), quiz)).toBe(true);
  });

  it.each([
    ['null', null],
    ['wrong schema version', { schemaVersion: 99 }],
    ['wrong data version', { dataVersion: 99 }],
    ['other quiz', { quizId: 'other' }],
    ['empty attempt id', { attemptId: '' }],
    ['bad start date', { startedAt: 'nope' }],
    ['negative index', { currentIndex: -1 }],
    ['index beyond length', { currentIndex: 6 }],
    ['fractional index', { currentIndex: 1.5 }],
    ['answers is an array', { answers: [] }],
    ['unknown question id', { answers: { zzz: 'a' } }],
    ['unknown option id', { answers: { q1: 'zzz' }, currentIndex: 1 }],
    ['earlier question unanswered', { currentIndex: 2, answers: { q1: 'a' } }],
    ['answer beyond current question', { currentIndex: 0, answers: { q1: 'a', q2: 'a' } }],
  ])('rejects %s', (_name, patch) => {
    const attempt = patch === null ? null : { ...makeActive(quiz), ...patch };
    expect(validateActiveAttempt(attempt, quiz)).toBe(false);
  });
});

describe('validateCompletedAttempt', () => {
  it('accepts a valid entry', () => {
    expect(validateCompletedAttempt(makeCompleted())).toBe(true);
  });

  it.each([
    ['null', null],
    ['wrong schema', { schemaVersion: 0 }],
    ['no attempt id', { attemptId: '' }],
    ['bad completedAt', { completedAt: 'x' }],
    ['score above total', { score: 6 }],
    ['negative score', { score: -1 }],
    ['zero total', { total: 0, score: 0 }],
    ['percentage > 100', { percentage: 101 }],
    ['percentage as string', { percentage: '60' }],
    ['fractional score', { score: 2.5 }],
  ])('rejects %s', (_name, patch) => {
    const entry = patch === null ? null : { ...makeCompleted(), ...patch };
    expect(validateCompletedAttempt(entry)).toBe(false);
  });
});

describe('calculateScore', () => {
  const quiz = makeQuiz();

  it('counts only correct answers', () => {
    expect(calculateScore(quiz, { q1: 'a', q2: 'b', q3: 'a' })).toEqual({ score: 2, total: 5, percentage: 40 });
  });

  it('handles no answers and perfect scores', () => {
    expect(calculateScore(quiz, {})).toEqual({ score: 0, total: 5, percentage: 0 });
    const all = Object.fromEntries(quiz.questions.map((q) => [q.id, 'a']));
    expect(calculateScore(quiz, all)).toEqual({ score: 5, total: 5, percentage: 100 });
  });

  it('rounds the percentage', () => {
    const six = makeQuiz({ questions: [...quiz.questions, { ...quiz.questions[0], id: 'q6' }] });
    expect(calculateScore(six, { q1: 'a' }).percentage).toBe(17);
  });
});
