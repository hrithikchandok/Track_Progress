import { useState, useEffect, useRef } from 'react';

const MODES = [
  { value: 'off',     label: 'Off',     glyph: '—',  desc: 'Static grid' },
  { value: 'glow',    label: 'Glow',    glyph: '✦',  desc: 'Follow mouse' },
  { value: 'shimmer', label: 'Shimmer', glyph: '◈',  desc: 'Random pulse' },
  { value: 'rain',    label: 'Rain',    glyph: '▾',  desc: 'Cascade drops' },
  { value: 'ripple',  label: 'Ripple',  glyph: '◎',  desc: 'Click to spawn' },
];

export default function BgPicker({ mode, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const current = MODES.find(m => m.value === mode) || MODES[0];

  return (
    <div ref={ref} className="bg-picker">
      {open && (
        <div className="bg-panel">
          <div className="bg-panel-label">Background</div>
          {MODES.map(m => (
            <button
              key={m.value}
              className={`bg-opt${mode === m.value ? ' active' : ''}`}
              onClick={() => { onChange(m.value); setOpen(false); }}
            >
              <span className="bg-glyph">{m.glyph}</span>
              <span className="bg-opt-text">
                <span className="bg-opt-name">{m.label}</span>
                <span className="bg-opt-desc">{m.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        className={`bg-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)}
        title="Background"
      >
        <span className="bg-glyph">{current.glyph}</span>
      </button>
    </div>
  );
}
