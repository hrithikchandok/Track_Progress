import { useState } from 'react';
import { PRESET_COLORS } from '../data/sections';
import { slugify } from '../utils/id';

export default function AddSectionModal({ onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [sub, setSub] = useState('');
  const [unit, setUnit] = useState('items');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [track, setTrack] = useState('');
  const [sup, setSup] = useState(false);

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      sub: sub.trim(),
      unit: unit.trim() || 'items',
      color,
      track: track.trim() || slugify(title.trim()),
      sup,
      items: [],
    });
  }

  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: 4 }}>Add section</h3>
        <p style={{ marginBottom: 16 }}>A section groups related items under one heading.</p>

        <label className="field-label">Title <span style={{ color: 'var(--core)' }}>*</span></label>
        <input className="auth-input" placeholder="e.g. DSA · LeetCode" value={title} onChange={e => setTitle(e.target.value)} autoFocus />

        <label className="field-label">Subtitle</label>
        <input className="auth-input" placeholder="e.g. 150 problems" value={sub} onChange={e => setSub(e.target.value)} />

        <label className="field-label">Unit label</label>
        <input className="auth-input" placeholder="items" value={unit} onChange={e => setUnit(e.target.value)} />

        <label className="field-label">Filter group key</label>
        <input className="auth-input" placeholder="auto from title" value={track} onChange={e => setTrack(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
        <p style={{ fontSize: 11, color: 'var(--faint)', fontFamily: 'var(--mono)', marginBottom: 14, marginTop: -8 }}>
          Sections sharing the same key get one filter chip.
        </p>

        <label className="field-label">Color</label>
        <div className="color-swatches">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className={`swatch${color === c ? ' active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>

        <label className="field-label" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={sup} onChange={e => setSup(e.target.checked)} />
          Supplemental style (dashed border)
        </label>

        <div className="modal-row" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={!title.trim()}>Add section</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
