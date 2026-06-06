import { useState } from 'react';

export default function AddItemModal({ sectionTitle, onAdd, onClose }) {
  const [text, setText] = useState('');
  const [meta, setMeta] = useState('');
  const [count, setCount] = useState('');
  const [group, setGroup] = useState('');

  function handleAdd() {
    if (!text.trim()) return;
    const item = { text: text.trim() };
    if (meta.trim()) item.meta = meta.trim();
    if (count && Number(count) > 1) item.n = Number(count);
    if (group.trim()) item.group = group.trim();
    onAdd(item);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) handleAdd();
  }

  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: 400 }}>
        <h3 style={{ marginBottom: 4 }}>Add item</h3>
        <p style={{ marginBottom: 16 }}>Adding to <b style={{ color: 'var(--text)' }}>{sectionTitle}</b></p>

        <label className="field-label">Text <span style={{ color: 'var(--core)' }}>*</span></label>
        <input className="auth-input" placeholder="e.g. Arrays & Hashing" value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} autoFocus />

        <label className="field-label">Meta label</label>
        <input className="auth-input" placeholder="e.g. 3 lessons, optional" value={meta} onChange={e => setMeta(e.target.value)} onKeyDown={handleKeyDown} />

        <label className="field-label">Problem count (for weighted progress)</label>
        <input className="auth-input" type="number" placeholder="leave blank for 1" value={count} onChange={e => setCount(e.target.value)} min="1" />

        <label className="field-label">Group header</label>
        <input className="auth-input" placeholder="e.g. Fundamentals (creates a subheading)" value={group} onChange={e => setGroup(e.target.value)} onKeyDown={handleKeyDown} />

        <div className="modal-row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={!text.trim()}>Add item</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
