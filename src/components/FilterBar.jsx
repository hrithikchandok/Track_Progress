export default function FilterBar({ sections, activeFilter, onFilterChange }) {
  // Generate unique track chips from sections
  const seen = new Set();
  const chips = [{ key: 'all', label: 'All' }];
  for (const s of sections) {
    const track = s.track || s.id || '';
    if (track && !seen.has(track)) {
      seen.add(track);
      chips.push({ key: track, label: track.toUpperCase(), color: s.color });
    }
  }

  if (chips.length <= 1) return null;

  return (
    <div className="filter">
      <span className="lbl">Filter</span>
      {chips.map(f => (
        <button
          key={f.key}
          className={`chip${activeFilter === f.key ? ' active' : ''}`}
          onClick={() => onFilterChange(f.key)}
          style={activeFilter === f.key && f.color ? { background: f.color, borderColor: f.color, color: '#0b0b0d' } : {}}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
