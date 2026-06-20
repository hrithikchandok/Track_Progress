import { overallStats, countdown, calcStreak, calcVelocity, requiredPace, TARGET_DATE } from '../utils/progress';

const fmtDate = (d) => d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Dashboard({ sections, progress, dailyLogs = {}, completionLogs = {} }) {
  const { done, total, pct } = overallStats(sections, progress);
  const { weeks, days } = countdown();
  const streak = calcStreak(dailyLogs);
  const velocity = calcVelocity(completionLogs);
  const remaining = total - done;
  const target = new Date(TARGET_DATE + 'T00:00:00');

  // Forecast: when you'll actually finish at your current completion rate.
  let etaText = null, trackText = null, trackAhead = false;
  if (velocity > 0 && remaining > 0) {
    const eta = new Date();
    eta.setHours(0, 0, 0, 0);
    eta.setDate(eta.getDate() + Math.ceil(remaining / velocity));
    etaText = fmtDate(eta);

    // Compare that forecast against the target date.
    const diffDays = Math.round((target - eta) / 864e5);
    trackAhead = diffDays >= 0;
    const n = Math.abs(diffDays);
    trackText = diffDays === 0
      ? 'right on target'
      : `${n} day${n === 1 ? '' : 's'} ${trackAhead ? 'ahead of' : 'behind'} target`;
  }

  // Pace required to finish everything left by the target date.
  const pace = requiredPace(remaining);
  const aimText = pace && (
    pace.overdue
      ? 'target date passed'
      : pace.perDay < 1
        ? '<1 / day to hit target'
        : `${Math.ceil(pace.perDay)} / day to hit target`
  );

  return (
    <div className="dash">
      <div className="card count">
        <div className="overall-label">Overall completion</div>
        <div className="big-pct">{pct}<span>%</span></div>
        <div className="overall-bar">
          <i style={{ width: `${pct}%` }}></i>
        </div>
        <div className="done-count">{done} / {total} items done</div>
        {etaText && (
          <div className="pace-eta">at current pace · est. <b>{etaText}</b></div>
        )}
        {trackText && (
          <div className={`pace-eta track ${trackAhead ? 'ahead' : 'behind'}`}>
            {trackAhead ? '✓' : '⚠'} {trackText}
          </div>
        )}
        {aimText && (
          <div className="pace-eta">aim for <b>{aimText}</b></div>
        )}
      </div>

      <div className="card streak-card">
        <div className="overall-label">Current streak</div>
        <div className="streak-num">{streak}<span style={{ fontSize: 20, color: 'var(--faint)' }}> days</span></div>
        <div className="streak-sub">
          {streak === 0 ? 'No activity yet today' : streak === 1 ? 'Active today — keep it up' : `${streak} days in a row`}
        </div>
        <div className="streak-label">
          {velocity > 0 ? `${velocity.toFixed(1)} completions / day (recent avg)` : 'Log activity by checking off items'}
        </div>
      </div>

      <div className="card countdown">
        <div className="overall-label">Weeks until target</div>
        <div className="cd-num">{weeks}</div>
        <div className="cd-sub">{days} days remaining</div>
        <div className="cd-target">Target&nbsp;·&nbsp;{fmtDate(target)}</div>
      </div>
    </div>
  );
}
