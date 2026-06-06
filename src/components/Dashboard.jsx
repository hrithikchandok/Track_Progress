import { overallStats, countdown } from '../hooks/useProgress';

export default function Dashboard({ progress }) {
  const { done, total, pct } = overallStats(progress);
  const { weeks, days } = countdown();

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
        <div className="cd-target">Target&nbsp;·&nbsp;31&nbsp;Dec&nbsp;2026</div>
      </div>
    </div>
  );
}
