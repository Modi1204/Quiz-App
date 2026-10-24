import { formatDate } from '../utils/results';

const W = 320;
const H = 120;
const PAD = 16;

/** Lightweight SVG line chart of percentage scores in chronological order. */
export default function ProgressChart({ attempts, title }) {
  const n = attempts.length;
  const x = (i) => (n === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (n - 1));
  const y = (pct) => H - PAD - (pct / 100) * (H - PAD * 2);
  const points = attempts.map((a, i) => `${x(i)},${y(a.percentage)}`).join(' ');
  const summary = attempts.map((a, i) => `attempt ${i + 1}: ${a.percentage}%`).join(', ');

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Score trend for ${title}. ${summary}`}>
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} className="chart-grid" />
          <text x={0} y={y(v) + 3} className="chart-axis">{v}</text>
        </g>
      ))}
      {n > 1 && <polyline points={points} className="chart-line" fill="none" />}
      {attempts.map((a, i) => (
        <circle key={a.attemptId} cx={x(i)} cy={y(a.percentage)} r="4" className="chart-dot">
          <title>{`${a.percentage}% on ${formatDate(a.completedAt)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
