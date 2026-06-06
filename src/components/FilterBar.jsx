export default function FilterBar({ sections, activeFilter, onFilterChange }) {
  // Generate unique track chips from sections
  const seen = new Set();
  const chips = [{ key: 'all', label: 'All' }];
  for (const s of sections) {
    if (!seen.has(s.track)) {
      seen.add(s.track);
      chips.push({ key: s.track, label: s.track.toUpperCase(), color: s.color });
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
