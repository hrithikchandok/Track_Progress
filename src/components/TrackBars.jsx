import { secProgress } from '../utils/progress';

export default function TrackBars({ sections, progress, activeFilter = 'all' }) {
  const main = sections.filter(s => !s.sup);
  if (!main.length) return null;

  const bars = activeFilter === 'all'
    ? main
    : main.filter(s => (s.track || s.id) === activeFilter);

  if (!bars.length) return null;

  const cols = Math.min(bars.length, 4);

  return (
    <div className="tracks" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {bars.map(section => {
        const { pct } = secProgress(section, progress);
        const shortTitle = section.title.split('·')[0].trim();
        const isActive = activeFilter !== 'all' && (section.track || section.id) === activeFilter;
        return (
          <div key={section.id} className={isActive ? 'trk-active' : ''}>
            <div className="trk-top">
              <span className="trk-name">
                <span className="dot" style={{ background: section.color }}></span>
                {shortTitle}
              </span>
              <span className="trk-pct">{pct}%</span>
            </div>
            <div className="trk-bar">
              <i style={{ width: `${pct}%`, background: section.color }}></i>
            </div>
          </div>
        );
      })}
    </div>
  );
}
