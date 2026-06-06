import { overallStats, countdown } from '../utils/progress';

export default function Dashboard({ sections, progress, targetDate }) {
  const { done, total, pct } = overallStats(sections, progress);
  const { weeks, days } = countdown(targetDate);
  const dateLabel = targetDate
    ? new Date(targetDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '31 Dec 2026';

  return (
    <div className="dash">
      <div className="card count">
        <div>
          <div className="overall-label">Overall completion</div>
          <div className="big-pct">{pct}<span>%</span></div>
        </div>
        <div>
          <div className="overall-bar">
            <i style={{ width: `${pct}%` }}></i>
          </div>
          <div className="done-count">{done} / {total} items done</div>
        </div>
      </div>

      <div className="card countdown">
        <div className="cd-sub">Weeks until target</div>
        <div className="cd-num">{weeks}</div>
        <div className="cd-sub">{days} days remaining</div>
        <div className="cd-target">Target&nbsp;·&nbsp;{dateLabel}</div>
      </div>
    </div>
  );
}
