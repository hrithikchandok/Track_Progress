import { itemDone } from '../utils/progress';

const pad = n => String(n).padStart(2, '0');

// Marking a today task done/undone from the panel. Counters jump to target / 0.
function completionValue(item, done) {
  if ((item.type || 'boolean') === 'counter') return done ? 0 : (item.target || 1);
  return !done;
}

export default function TodayPanel({ items, progress, clock, dread, onToggle, onToggleToday }) {
  const total = items.length;
  const done = items.filter(i => itemDone(i, progress)).length;
  const remaining = total - done;
  const allDone = total > 0 && remaining === 0;
  const { hours, minutes, seconds } = clock;
  const critical = dread > 0.5;

  return (
    <div className={`today-panel${remaining > 0 ? ' has-pending' : ''}${allDone ? ' all-done' : ''}${critical ? ' critical' : ''}`}>
      <div className="today-head">
        <span className="today-label">◎ Today</span>
        {total > 0 && <span className="today-count">{done}/{total} done</span>}
      </div>

      <div className="death-clock">
        <span className="dc-time">{pad(hours)}<i>:</i>{pad(minutes)}<i>:</i>{pad(seconds)}</span>
        <span className="dc-label">{remaining > 0 ? 'left to finish today' : 'left in the day'}</span>
      </div>

      {total === 0 ? (
        <p className="today-empty">Star tasks below (☆) to commit to them today. The clock is watching.</p>
      ) : (
        <ul className="today-list">
          {items.map(item => {
            const d = itemDone(item, progress);
            return (
              <li key={item.id} className={`today-item${d ? ' done' : ''}`}>
                <button className="today-check" onClick={() => onToggle(item.id, completionValue(item, d))}>
                  {d ? '✓' : '○'}
                </button>
                <span className="today-text">{item.text}</span>
                <button className="today-unstar" onClick={() => onToggleToday(item.id)} title="Remove from Today">×</button>
              </li>
            );
          })}
        </ul>
      )}

      {allDone && (
        <div className="today-victory">All commitments cleared. The day is yours. 🎯</div>
      )}
    </div>
  );
}
