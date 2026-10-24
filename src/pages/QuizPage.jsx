import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AsyncState from '../components/AsyncState';
import ConfirmDialog from '../components/ConfirmDialog';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import QuizResult from '../components/QuizResult';
import { useAsync } from '../hooks/useAsync';
import { useQuizAttempt } from '../hooks/useQuizAttempt';
import { fetchQuiz } from '../services/quizApi';

export default function QuizPage() {
  const { quizId } = useParams();
  const loader = useCallback(() => fetchQuiz(quizId), [quizId]);
  const { status, data: quiz, error, retry } = useAsync(loader);

  return (
    <>
      <AsyncState status={status} error={error} onRetry={retry} loadingText="Loading quiz…">
        {status === 'success' && <QuizSession key={quiz.id} quiz={quiz} />}
      </AsyncState>
      {status === 'error' && (
        <p>
          <Link to="/">← Back to all quizzes</Link>
        </p>
      )}
    </>
  );
}

function QuizSession({ quiz }) {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState(null); // 'leave' | 'restart' | null
  const session = useQuizAttempt(quiz);
  const { attempt, total, finished, question, answeredCount, result } = session;
  const inProgress = answeredCount > 0 && !finished;

  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <div className="quiz">
      <header className="quiz-header">
        <div>
          <h2>{quiz.title}</h2>
          <p className="quiz-sub">{quiz.description}</p>
        </div>
        <div className="quiz-controls">
          <button type="button" className="btn btn-secondary" onClick={() => (inProgress ? setDialog('leave') : navigate('/'))}>
            Leave quiz
          </button>
          {inProgress && (
            <button type="button" className="btn btn-secondary" onClick={() => setDialog('restart')}>
              Restart
            </button>
          )}
        </div>
      </header>

      {session.discarded && (
        <p className="notice notice-warn" role="status">
          Your previously saved progress for this quiz could not be restored (it was out of date or damaged), so a fresh attempt was started.
        </p>
      )}
      {session.resumed && !finished && (
        <p className="notice notice-info" role="status">
          Welcome back — resuming from question {attempt.currentIndex + 1} of {total}.
        </p>
      )}
      {session.saveFailed && (
        <p className="notice notice-warn" role="alert">
          Your progress could not be saved in this browser. You can keep going, but it may be lost if you refresh.
        </p>
      )}

      {finished ? (
        <QuizResult
          quiz={quiz}
          attempt={attempt}
          result={result}
          historyStatus={session.historyStatus}
          onRetake={session.restart}
          onRetrySave={session.retrySave}
        />
      ) : (
        <>
          <ProgressBar current={attempt.currentIndex} total={total} answered={answeredCount} />
          <QuestionCard
            key={question.id}
            question={question}
            selectedOptionId={session.selectedOptionId}
            onAnswer={session.answer}
            onNext={session.next}
            isLast={attempt.currentIndex === total - 1}
          />
        </>
      )}

      {dialog === 'leave' && (
        <ConfirmDialog
          title="Leave this quiz?"
          message="Your progress is saved. You can resume from where you left off."
          confirmLabel="Leave quiz"
          cancelLabel="Keep going"
          onCancel={closeDialog}
          onConfirm={() => navigate('/')}
        />
      )}
      {dialog === 'restart' && (
        <ConfirmDialog
          title="Restart this quiz?"
          message="Your current answers will be discarded and you will begin again from question 1."
          confirmLabel="Restart"
          cancelLabel="Keep going"
          onCancel={closeDialog}
          onConfirm={() => {
            session.restart();
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
