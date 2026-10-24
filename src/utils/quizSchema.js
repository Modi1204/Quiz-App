import { DATA_VERSION } from '../data/quizData';

export const STORAGE_KEYS = {
  history: 'quizapp:history',
  historyBackup: 'quizapp:history:corrupt-backup',
  activeAttempt: 'quizapp:activeAttempt',
};

// Bump when the persisted record shape changes; older records are discarded.
export const STORAGE_SCHEMA_VERSION = 1;

export const MIN_QUESTIONS = 5;

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Quiz shape:
 * { id, categoryId, title, description, difficulty,
 *   questions: [{ id, prompt, options: [{ id, text }], correctOptionId, explanation }] }
 * Returns a list of problems; an empty list means the quiz is valid.
 */
export function validateQuiz(quiz) {
  const errors = [];
  if (!quiz || typeof quiz !== 'object') return ['Quiz is missing'];
  if (!isNonEmptyString(quiz.id)) errors.push('Quiz id is required');
  if (!isNonEmptyString(quiz.title)) errors.push('Quiz title is required');
  if (!isNonEmptyString(quiz.categoryId)) errors.push('Quiz category is required');
  if (!Array.isArray(quiz.questions) || quiz.questions.length < MIN_QUESTIONS) {
    errors.push(`Quiz needs at least ${MIN_QUESTIONS} questions`);
    return errors;
  }
  const seen = new Set();
  quiz.questions.forEach((q, i) => {
    const label = `Question ${i + 1}`;
    if (!isNonEmptyString(q?.id)) errors.push(`${label}: id is required`);
    else if (seen.has(q.id)) errors.push(`${label}: duplicate id "${q.id}"`);
    else seen.add(q.id);
    if (!isNonEmptyString(q?.prompt)) errors.push(`${label}: prompt is required`);
    if (!isNonEmptyString(q?.explanation)) errors.push(`${label}: explanation is required`);
    const options = Array.isArray(q?.options) ? q.options : [];
    const optionIds = options.map((o) => o?.id);
    if (options.length < 2 || options.some((o) => !isNonEmptyString(o?.id) || !isNonEmptyString(o?.text))) {
      errors.push(`${label}: needs at least 2 options with id and text`);
    } else if (new Set(optionIds).size !== optionIds.length) {
      errors.push(`${label}: option ids must be unique`);
    }
    if (!optionIds.includes(q?.correctOptionId)) errors.push(`${label}: correctOptionId does not match an option`);
  });
  return errors;
}

/**
 * Active (unfinished) attempt:
 * { schemaVersion, dataVersion, attemptId, quizId, startedAt,
 *   currentIndex, answers: { [questionId]: selectedOptionId }, status: 'in-progress' }
 *
 * Completed attempt (history entry):
 * { schemaVersion, attemptId, quizId, quizTitle, startedAt, completedAt,
 *   answers: { [questionId]: selectedOptionId }, score, total, percentage }
 *
 * Score is always recomputed from answers, never trusted from a click counter.
 */
export function validateActiveAttempt(attempt, quiz) {
  if (!attempt || typeof attempt !== 'object') return false;
  if (attempt.schemaVersion !== STORAGE_SCHEMA_VERSION || attempt.dataVersion !== DATA_VERSION) return false;
  if (!isNonEmptyString(attempt.attemptId) || attempt.quizId !== quiz?.id) return false;
  if (Number.isNaN(Date.parse(attempt.startedAt))) return false;
  const length = quiz.questions.length;
  // currentIndex === length means every question was answered and the quiz is finished.
  if (!Number.isInteger(attempt.currentIndex) || attempt.currentIndex < 0 || attempt.currentIndex > length) return false;
  if (!attempt.answers || typeof attempt.answers !== 'object' || Array.isArray(attempt.answers)) return false;
  const answers = attempt.answers;
  const validOptions = quiz.questions.every((q) => answers[q.id] === undefined || q.options.some((o) => o.id === answers[q.id]));
  const knownIds = Object.keys(answers).every((qid) => quiz.questions.some((q) => q.id === qid));
  // Consistency: every earlier question is answered, and nothing beyond the current one is.
  const consistent = quiz.questions.every((q, i) => (i < attempt.currentIndex ? answers[q.id] !== undefined : i === attempt.currentIndex || answers[q.id] === undefined));
  return validOptions && knownIds && consistent;
}

export function validateCompletedAttempt(entry) {
  if (!entry || typeof entry !== 'object') return false;
  const { schemaVersion, attemptId, quizId, startedAt, completedAt, score, total, percentage } = entry;
  return (
    schemaVersion === STORAGE_SCHEMA_VERSION &&
    isNonEmptyString(attemptId) &&
    isNonEmptyString(quizId) &&
    !Number.isNaN(Date.parse(startedAt)) &&
    !Number.isNaN(Date.parse(completedAt)) &&
    Number.isInteger(score) && Number.isInteger(total) && total > 0 &&
    score >= 0 && score <= total &&
    typeof percentage === 'number' && percentage >= 0 && percentage <= 100
  );
}

export function calculateScore(quiz, answers) {
  const total = quiz.questions.length;
  const score = quiz.questions.filter((q) => answers[q.id] === q.correctOptionId).length;
  return { score, total, percentage: Math.round((score / total) * 100) };
}
