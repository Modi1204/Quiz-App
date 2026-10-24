export function getPerformance(percentage) {
  if (percentage === 100) return { tone: 'excellent', title: 'Perfect score!', message: 'Flawless. You clearly have a strong grasp of this topic.' };
  if (percentage >= 80) return { tone: 'great', title: 'Great job!', message: 'You know this material well. Review the few you missed to lock it in.' };
  if (percentage >= 60) return { tone: 'good', title: 'Good effort', message: 'A solid foundation. Read the explanations below and try again to improve.' };
  if (percentage >= 40) return { tone: 'fair', title: 'Keep practicing', message: 'You are getting there. Study the explanations for the missed questions, then retake the quiz.' };
  return { tone: 'low', title: 'Time to review', message: 'This topic needs more attention. Go through the explanations carefully and try again.' };
}

/** Questions answered incorrectly (or unanswered), with the chosen and correct option text. */
export function getMissedQuestions(quiz, answers) {
  return quiz.questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => answers[question.id] !== question.correctOptionId)
    .map(({ question, index }) => ({
      number: index + 1,
      prompt: question.prompt,
      explanation: question.explanation,
      yourAnswer: question.options.find((o) => o.id === answers[question.id])?.text ?? null,
      correctAnswer: question.options.find((o) => o.id === question.correctOptionId)?.text,
    }));
}

export function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Unknown date' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
