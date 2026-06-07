import { useState } from 'react';

function EditableText({ value, onSave, className, inputClassName, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() { setDraft(value); setEditing(true); }

  function save() {
    const v = draft.trim();
    if (v) onSave(v);
    setEditing(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        className={inputClassName || 'header-edit-input'}
        value={draft}
        placeholder={placeholder}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKey}
      />
    );
  }

  return (
    <span className={`${className} editable-hdr`} onClick={startEdit} title="Click to edit">
      {value}<span className="edit-pencil">✎</span>
    </span>
  );
}

function EditableBlock({ value, onSave, className, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() { setDraft(value); setEditing(true); }

  function save() {
    const v = draft.trim();
    if (v) onSave(v);
    setEditing(false);
  }

  function handleKey(e) {
    if (e.key === 'Escape') setEditing(false);
    // Shift+Enter = newline, plain Enter = save
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        className="header-edit-textarea"
        value={draft}
        placeholder={placeholder}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKey}
        rows={Math.max(2, draft.split('\n').length + 1)}
      />
    );
  }

  return (
    <p className={`${className} editable-hdr`} onClick={startEdit} title="Click to edit" style={{ whiteSpace: 'pre-wrap' }}>
      {value}<span className="edit-pencil" style={{ fontSize: 10 }}>✎</span>
    </p>
  );
}

export default function Header({ meta = {}, onSaveMeta }) {
  const role = meta.role || 'Java · Backend';
  const kicker = meta.kicker || 'Backend Switch · 2026';
  const company = meta.company || '';
  const summary = meta.summary || 'The three courses, complete and exact, plus the interview-shape work the courses don\'t cover. Tick things off — progress saves and persists between sessions.';
  const pace = meta.pace || '~2 DSA topics + ~3 HLD sections + 1 HF chapter per week → first pass by late Aug, then revise & interview.';

  function save(patch) {
    onSaveMeta?.({ role, kicker, company, summary, pace, ...patch });
  }

  return (
    <header>
      <EditableText
        value={kicker}
        onSave={v => save({ kicker: v })}
        className="kicker"
        inputClassName="header-edit-input header-edit-kicker"
        placeholder="e.g. Backend Switch · 2026"
      />
      <h1>
        Prep Console{' '}
        <span className="slash">
          //{' '}
          <EditableText
            value={role}
            onSave={v => save({ role: v })}
            className=""
            inputClassName="header-edit-input header-edit-role"
            placeholder="e.g. Java · Backend"
          />
        </span>
      </h1>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {company ? (
          <EditableText
            value={company}
            onSave={v => save({ company: v })}
            className="sub company-tag"
            inputClassName="header-edit-input header-edit-company"
            placeholder="e.g. Google, Amazon"
          />
        ) : (
          <button
            className="add-company-btn"
            onClick={() => onSaveMeta?.({ role, kicker, company: 'Target company', summary, pace })}
          >
            + Add target company
          </button>
        )}
      </div>

      <EditableBlock
        value={summary}
        onSave={v => save({ summary: v })}
        className="sub"
        placeholder="What are you tracking and why?"
      />

      <div className="pace-block">
        <span className="pace-label">Suggested pace · </span>
        <EditableText
          value={pace}
          onSave={v => save({ pace: v })}
          className="pace-inline"
          inputClassName="header-edit-input header-edit-pace"
          placeholder="e.g. 2 topics/week → done by Aug"
        />
      </div>
    </header>
  );
}
