import { useState } from 'react';

const TYPES = [
  { value: 'boolean', label: 'Checkbox', desc: 'Done / not done' },
  { value: 'counter', label: 'Counter', desc: 'Track a target number' },
  { value: 'link', label: 'Link', desc: 'URL resource or reference' },
];

export default function AddItemModal({ sectionTitle, onAdd, onClose }) {
  const [type, setType] = useState('boolean');
  const [text, setText] = useState('');
  const [meta, setMeta] = useState('');
  const [count, setCount] = useState('');
  const [group, setGroup] = useState('');
  const [target, setTarget] = useState('');
  const [url, setUrl] = useState('');

  function handleAdd() {
    if (!text.trim()) return;
    const item = { text: text.trim(), type };
    if (meta.trim()) item.meta = meta.trim();
    if (group.trim()) item.group = group.trim();
    if (type === 'boolean' && count && Number(count) > 1) item.n = Number(count);
    if (type === 'counter') item.target = Math.max(1, Number(target) || 1);
    if (type === 'link' && url.trim()) item.url = url.trim();
    onAdd(item);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) handleAdd();
  }

  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: 4 }}>Add item</h3>
        <p style={{ marginBottom: 16 }}>Adding to <b style={{ color: 'var(--text)' }}>{sectionTitle}</b></p>

        <label className="field-label">Type</label>
        <div className="type-tabs">
          {TYPES.map(t => (
            <button
              key={t.value}
              className={`type-tab${type === t.value ? ' active' : ''}`}
              onClick={() => setType(t.value)}
            >
              <span className="type-tab-label">{t.label}</span>
              <span className="type-tab-desc">{t.desc}</span>
            </button>
          ))}
        </div>

        <label className="field-label">Text <span style={{ color: 'var(--core)' }}>*</span></label>
        <input
          className="auth-input"
          placeholder={type === 'link' ? 'e.g. Grokking System Design' : 'e.g. Arrays & Hashing'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        {type === 'boolean' && (
          <>
            <label className="field-label">Meta label</label>
            <input className="auth-input" placeholder="e.g. 3 lessons" value={meta} onChange={e => setMeta(e.target.value)} onKeyDown={handleKeyDown} />

            <label className="field-label">Problem count (weighted progress)</label>
            <input className="auth-input" type="number" placeholder="leave blank for 1" value={count} onChange={e => setCount(e.target.value)} min="1" />

            <label className="field-label">Group header</label>
            <input className="auth-input" placeholder="e.g. Fundamentals (creates a subheading)" value={group} onChange={e => setGroup(e.target.value)} onKeyDown={handleKeyDown} />
          </>
        )}

        {type === 'counter' && (
          <>
            <label className="field-label">Target <span style={{ color: 'var(--core)' }}>*</span></label>
            <input
              className="auth-input"
              type="number"
              placeholder="e.g. 50"
              value={target}
              onChange={e => setTarget(e.target.value)}
              onKeyDown={handleKeyDown}
              min="1"
            />
            <label className="field-label">Meta label</label>
            <input className="auth-input" placeholder="e.g. problems" value={meta} onChange={e => setMeta(e.target.value)} onKeyDown={handleKeyDown} />
          </>
        )}

        {type === 'link' && (
          <>
            <label className="field-label">URL</label>
            <input className="auth-input" type="url" placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={handleKeyDown} />
            <label className="field-label">Note</label>
            <input className="auth-input" placeholder="e.g. Official docs" value={meta} onChange={e => setMeta(e.target.value)} onKeyDown={handleKeyDown} />
          </>
        )}

        <div className="modal-row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={!text.trim()}>Add item</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
