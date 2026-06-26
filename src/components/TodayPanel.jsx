import { itemDone } from '../utils/progress';

const pad = n => String(n).padStart(2, '0');

// Marking a today task done/undone from the panel. Counters jump to target / 0.
function completionValue(item, done) {
  if ((item.type || 'boolean') === 'counter') return done ? 0 : (item.target || 1);
  return !done;
}

export default function TodayPanel({ items, progress, clock, onToggle, onToggleToday }) {
  const total = items.length;
  const done = items.filter(i => itemDone(i, progress)).length;
  const remaining = total - done;
  const allDone = total > 0 && remaining === 0;
  const { hours, minutes, seconds } = clock;

  return (
    <div id="today-panel" className={`today-panel${remaining > 0 ? ' has-pending' : ''}${allDone ? ' all-done' : ''}`}>
      <div className="today-top">
        <div className="today-info">
          <div className="today-head">
            <span className="today-label">◎ Today</span>
            {total > 0 && <span className="today-count">{done}/{total} done</span>}
          </div>
          <p className="today-help">
            Star any task below to commit to it today, then hit <b>⚡ Focus</b> to lock in. The clock is watching.
          </p>
        </div>

        <div className="death-clock">
          <span className="dc-time">{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
          <span className="dc-label">{remaining > 0 ? 'left to finish today' : 'left in the day'}</span>
        </div>
      </div>

      {total > 0 ? (
        <ul className="today-list">
          {items.map(item => {
            const d = itemDone(item, progress);
            const tag = (item.track || '').toUpperCase();
            return (
              <li key={item.id} className={`today-item${d ? ' done' : ''}`}>
                <button
                  className="today-check"
                  onClick={() => onToggle(item.id, completionValue(item, d))}
                  aria-label={d ? 'Mark not done' : 'Mark done'}
                >
                  {d ? '✓' : ''}
                </button>
                <span className="today-text">{item.text}</span>
                {tag && <span className="today-tag">{tag}</span>}
                <button className="today-unstar" onClick={() => onToggleToday(item.id)} title="Remove from Today">×</button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="today-empty-box">
          <span className="te-star">☆</span> No tasks for today yet — star a topic in the Roadmap below to add it here.
        </div>
      )}

      {allDone && (
        <div className="today-victory">All commitments cleared. The day is yours. 🎯</div>
      )}
    </div>
  );
}
