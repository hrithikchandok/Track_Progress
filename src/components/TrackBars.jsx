import { secProgress } from '../utils/progress';

export default function TrackBars({ sections, progress }) {
  // Show bars for the first 3 non-supplemental sections
  const main = sections.filter(s => !s.sup).slice(0, 3);
  if (!main.length) return null;

  return (
    <div className="tracks" style={{ gridTemplateColumns: `repeat(${main.length}, 1fr)` }}>
      {main.map(section => {
        const { pct } = secProgress(section, progress);
        const shortTitle = section.title.split('·')[0].trim();
        return (
          <div key={section.id}>
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
