import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import ProgressChart from '../components/ProgressChart';
import { clearHistory, loadHistory } from '../utils/storage';
import { formatDate } from '../utils/results';

function groupByQuiz(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const group = groups.get(entry.quizId) ?? { quizId: entry.quizId, quizTitle: entry.quizTitle, attempts: [] };
    group.quizTitle = entry.quizTitle;
    group.attempts.push(entry);
    groups.set(entry.quizId, group);
  }
  return [...groups.values()].sort(
    (a, b) => Date.parse(b.attempts.at(-1).completedAt) - Date.parse(a.attempts.at(-1).completedAt),
  );
}

const average = (list) => Math.round(list.reduce((sum, a) => sum + a.percentage, 0) / list.length);

export default function Progress() {
  const [version, setVersion] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearFailed, setClearFailed] = useState(false);
  const history = useMemo(() => loadHistory(), [version]);
  const groups = useMemo(() => groupByQuiz(history.entries), [history]);
  const { entries } = history;

  function handleClear() {
    setConfirmClear(false);
    setClearFailed(!clearHistory());
    setVersion((v) => v + 1);
  }

  return (
    <section>
      <h2>Your progress</h2>

      {history.status === 'unavailable' && (
        <p className="notice notice-warn" role="alert">
          Browser storage is unavailable, so your history cannot be loaded or saved in this session.
        </p>
      )}
      {history.status === 'corrupt' && (
        <p className="notice notice-warn" role="alert">
          Your saved history was unreadable and could not be loaded. It will be kept as a backup and replaced when you complete your next quiz.
        </p>
      )}
      {history.invalidCount > 0 && (
        <p className="notice notice-warn" role="status">
          {history.invalidCount} saved record{history.invalidCount === 1 ? ' was' : 's were'} damaged or outdated and skipped.
        </p>
      )}
      {clearFailed && (
        <p className="notice notice-warn" role="alert">
          History could not be cleared because browser storage is unavailable.
        </p>
      )}

      {entries.length === 0 ? (
        <div className="state state-empty" role="status">
          <h2>No attempts yet</h2>
          <p>Complete a quiz and your scores will appear here so you can track your progress.</p>
          <Link className="btn btn-link" to="/">
            Browse quizzes
          </Link>
        </div>
      ) : (
        <>
          <dl className="stats">
            <div className="card stat"><dt>Attempts</dt><dd>{entries.length}</dd></div>
            <div className="card stat"><dt>Average score</dt><dd>{average(entries)}%</dd></div>
            <div className="card stat"><dt>Best score</dt><dd>{Math.max(...entries.map((a) => a.percentage))}%</dd></div>
          </dl>

          {groups.map((group) => {
            const best = Math.max(...group.attempts.map((a) => a.percentage));
            return (
              <article key={group.quizId} className="card progress-group">
                <header className="progress-group-header">
                  <h3>{group.quizTitle}</h3>
                  <span className="card-meta">
                    {group.attempts.length} attempt{group.attempts.length === 1 ? '' : 's'} · best {best}% · average {average(group.attempts)}%
                  </span>
                </header>
                <ProgressChart attempts={group.attempts} title={group.quizTitle} />
                <table className="history-table">
                  <caption className="sr-only">Attempts for {group.quizTitle}, oldest first</caption>
                  <thead>
                    <tr><th scope="col">#</th><th scope="col">Date</th><th scope="col">Score</th><th scope="col">Percent</th></tr>
                  </thead>
                  <tbody>
                    {group.attempts.map((a, i) => (
                      <tr key={a.attemptId}>
                        <td>{i + 1}</td>
                        <td>{formatDate(a.completedAt)}</td>
                        <td>{a.score} / {a.total}</td>
                        <td>{a.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link className="btn btn-secondary btn-link" to={`/quiz/${group.quizId}`}>
                  Take again
                </Link>
              </article>
            );
          })}

          <button type="button" className="btn btn-secondary" onClick={() => setConfirmClear(true)}>
            Clear history
          </button>
        </>
      )}

      {confirmClear && (
        <ConfirmDialog
          title="Clear all history?"
          message="This permanently removes all saved attempts and scores from this browser."
          confirmLabel="Clear history"
          onCancel={() => setConfirmClear(false)}
          onConfirm={handleClear}
        />
      )}
    </section>
  );
}
