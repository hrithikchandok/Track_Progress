import { overallStats, countdown, calcStreak, calcVelocity } from '../utils/progress';

export default function Dashboard({ sections, progress, dailyLogs = {} }) {
  const { done, total, pct } = overallStats(sections, progress);
  const { weeks, days } = countdown();
  const streak = calcStreak(dailyLogs);
  const velocity = calcVelocity(dailyLogs);
  const remaining = total - done;
  const etaText = velocity > 0 && remaining > 0
    ? (() => {
        const eta = new Date();
        eta.setDate(eta.getDate() + Math.ceil(remaining / velocity));
        return eta.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
      })()
    : null;

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
          {etaText && (
            <div className="pace-eta">at current pace · est. <b>{etaText}</b></div>
          )}
        </div>
      </div>

      <div className="card streak-card">
        <div className="overall-label">Current streak</div>
        <div className="streak-num">{streak}<span style={{ fontSize: 24, color: 'var(--faint)' }}> days</span></div>
        <div className="streak-sub">
          {streak === 0 ? 'No activity yet today' : streak === 1 ? 'Active today — keep it up' : `${streak} days in a row`}
        </div>
        <div className="streak-label">
          {velocity > 0 ? `${velocity.toFixed(1)} activities / day (7-day avg)` : 'Log activity by checking off items'}
        </div>
      </div>

      <div className="card countdown">
        <div className="cd-sub">Weeks until target</div>
        <div className="cd-num">{weeks}</div>
        <div className="cd-sub">{days} days remaining</div>
        <div className="cd-target">Target&nbsp;·&nbsp;31 Dec 2026</div>
      </div>
    </div>
  );
}
