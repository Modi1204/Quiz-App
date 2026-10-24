import { categories, quizzes } from '../data/quizData';
import { validateQuiz } from '../utils/quizSchema';

const LATENCY_MS = 400;

// Dev helpers for exercising loading/error/empty states, e.g. in the console:
//   localStorage.setItem('quizapp:mock', 'error' | 'empty')
function mockMode() {
  try {
    return localStorage.getItem('quizapp:mock');
  } catch {
    return null;
  }
}

const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => JSON.parse(JSON.stringify(value));

async function simulateNetwork() {
  await delay();
  if (mockMode() === 'error') throw new Error('Unable to reach the quiz service. Please try again.');
}

/** GET /categories */
export async function fetchCategories() {
  await simulateNetwork();
  return mockMode() === 'empty' ? [] : clone(categories);
}

/** GET /quizzes — summaries only (no questions or answers) */
export async function fetchQuizzes() {
  await simulateNetwork();
  if (mockMode() === 'empty') return [];
  return quizzes.map(({ questions, ...summary }) => ({ ...summary, questionCount: questions.length }));
}

/** GET /quizzes/:id — full quiz, validated before it reaches the UI */
export async function fetchQuiz(quizId) {
  await simulateNetwork();
  const quiz = quizzes.find((q) => q.id === quizId);
  if (!quiz) throw new Error('This quiz could not be found.');
  const problems = validateQuiz(quiz);
  if (problems.length) throw new Error('This quiz has invalid data and cannot be started.');
  return clone(quiz);
}
