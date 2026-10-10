import { secProgress } from '../utils/progress';
import { vaultStats } from '../utils/vaultProgress';

export default function TrackBars({ sections, progress, activeFilter = 'all', onFilterChange, vault }) {
  const main = sections.filter(s => !s.sup);
  if (!main.length && !vault) return null;

  // Filter chips — one per distinct track, plus "All".
  const seen = new Set();
  const chips = [{ key: 'all', label: 'All' }];
  for (const s of sections) {
    const track = s.track || s.id || '';
    if (track && !seen.has(track)) {
      seen.add(track);
      chips.push({ key: track, label: track.toUpperCase() });
    }
  }

  if (vault) for (const track of ['hld', 'lld']) {
    if (!seen.has(track)) chips.push({ key: track, label: track.toUpperCase() });
  }

  return (
    <div className="tracks">
      {main.map(section => {
        const { pct } = secProgress(section, progress);
        const shortTitle = section.title.split('·')[0].trim();
        return (
          <div key={section.id}>
            <div className="trk-top">
              <span className="trk-name">{shortTitle}</span>
              <span className="trk-pct">{pct}%</span>
            </div>
            <div className="trk-bar">
              <i style={{ width: `${pct}%` }}></i>
            </div>
          </div>
        );
      })}

      {vault && ['HLD', 'LLD'].map(track => {
        const stats = vaultStats(vault.notes, track, vault.targets[track]);
        return <div key={`vault-${track}`}>
          <div className="trk-top"><span className="trk-name">{track} · Vault</span><span className="trk-pct">{stats.pct === null ? 'Set targets' : `${stats.pct}%`}</span></div>
          <div className="trk-bar"><i style={{ width: `${stats.pct || 0}%` }} /></div>
          <p className="sub">{stats.total ? `${stats.created}/${stats.total} targets created` : `${stats.items.length} notes · add targets in Obsidian Notes`} · Confidence {stats.confidence || '—'}/3</p>
        </div>;
      })}
      {onFilterChange && chips.length > 1 && (
        <div className="trk-filter">
          {chips.map(f => (
            <button
              key={f.key}
              className={`chip${activeFilter === f.key ? ' active' : ''}`}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
