export default function ProgressBar({ current, total, answered }) {
  const percent = Math.round((answered / total) * 100);
  return (
    <div className="progress">
      <div className="progress-label">
        <span>
          Question {Math.min(current + 1, total)} of {total}
        </span>
        <span>{answered} answered</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-label="Quiz progress"
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
