import { Link } from 'react-router-dom';
import Button from './Button';
import { getMissedQuestions, getPerformance } from '../utils/results';

export default function QuizResult({ quiz, attempt, result, historyStatus, onRetake, onRetrySave }) {
  const performance = getPerformance(result.percentage);
  const missed = getMissedQuestions(quiz, attempt.answers);

  return (
    <section className="result" aria-labelledby="result-title">
      <div className={`card result-summary tone-${performance.tone}`}>
        <h3 id="result-title">{performance.title}</h3>
        <p className="result-score">
          {result.score} / {result.total} correct <span className="result-percent">({result.percentage}%)</span>
        </p>
        <p>{performance.message}</p>

        {historyStatus === 'saved' && <p className="notice notice-info" role="status">✓ Result saved to your progress history.</p>}
        {historyStatus === 'failed' && (
          <p className="notice notice-warn" role="alert">
            Your result could not be saved to your history (browser storage unavailable or full).{' '}
            <button type="button" className="link-button" onClick={onRetrySave}>
              Try saving again
            </button>
          </p>
        )}

        <div className="question-actions">
          <Button onClick={onRetake}>Retake quiz</Button>
          <Link className="btn btn-secondary btn-link" to="/">
            Back to quizzes
          </Link>
          <Link className="btn btn-secondary btn-link" to="/progress">
            View progress
          </Link>
        </div>
      </div>

      <h3>Review</h3>
      {missed.length === 0 ? (
        <p className="state state-empty">You answered every question correctly — nothing to review.</p>
      ) : (
        <>
          <p className="category-desc">
            You missed {missed.length} question{missed.length === 1 ? '' : 's'}:
          </p>
          <ol className="review-list">
            {missed.map((m) => (
              <li key={m.number} className="card review-item">
                <h4>
                  Question {m.number}: {m.prompt}
                </h4>
                <p className="review-wrong">
                  <strong>✗ Your answer:</strong> {m.yourAnswer ?? 'No answer'}
                </p>
                <p className="review-right">
                  <strong>✓ Correct answer:</strong> {m.correctAnswer}
                </p>
                <p className="review-explain">{m.explanation}</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
