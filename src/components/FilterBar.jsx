const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'dsa', label: 'DSA' },
  { key: 'hld', label: 'HLD' },
  { key: 'lld', label: 'LLD' },
  { key: 'core', label: 'Java Core' },
  { key: 'proc', label: 'Process' },
  { key: 'go', label: 'Go' },
];

export default function FilterBar({ activeFilter, onFilterChange }) {
  return (
    <div className="filter">
      <span className="lbl">Filter</span>
      {FILTERS.map(f => (
        <button
          key={f.key}
          className={`chip${activeFilter === f.key ? ' active' : ''}`}
          onClick={() => onFilterChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
