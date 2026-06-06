import { SECTIONS, COLORS } from '../data/sections';
import { secProgress } from '../hooks/useProgress';

const TRACK_NAMES = { dsa: 'DSA · NeetCode', hld: 'HLD · Grokking', lld: 'LLD · Head First' };
const MAIN_TRACKS = ['dsa', 'hld', 'lld'];

export default function TrackBars({ progress }) {
  return (
    <div className="tracks">
      {MAIN_TRACKS.map(id => {
        const section = SECTIONS.find(s => s.id === id);
        const { pct } = secProgress(section, progress);
        return (
          <div key={id}>
            <div className="trk-top">
              <span className="trk-name">
                <span className="dot" style={{ background: COLORS[id] }}></span>
                {TRACK_NAMES[id]}
              </span>
              <span className="trk-pct">{pct}%</span>
            </div>
            <div className="trk-bar">
              <i style={{ width: `${pct}%`, background: COLORS[id] }}></i>
            </div>
          </div>
        );
      })}
    </div>
  );
}
