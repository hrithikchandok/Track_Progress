import { useState } from 'react';

export default function TaskItem({ item, value, canEdit, isEditMode, isToday, note = '', onToggle, onToggleToday, onSaveNote, onDelete }) {
  const type = item.type || 'boolean';
  const current = typeof value === 'number' ? value : 0;
  const target = item.target || 1;
  const done = type === 'counter' ? current >= target : type === 'boolean' ? !!value : false;

  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState(note);

  function toggleNote() {
    setNoteOpen(o => {
      if (!o) setDraft(note); // refresh draft from latest saved note when opening
      return !o;
    });
  }
  function saveNote() { onSaveNote?.(item.id, draft); setNoteOpen(false); }

  // Star + revision badge + note icon — shared by boolean & counter rows.
  const extras = (type === 'link') ? null : (
    <>
      {canEdit && onToggleToday && (
        <button
          className={`star-btn${isToday ? ' on' : ''}`}
          onClick={() => onToggleToday(item.id)}
          title={isToday ? 'Remove from Today' : 'Add to Today'}
        >{isToday ? '★' : '☆'}</button>
      )}
      {canEdit && onSaveNote && (
        <button
          className={`note-btn${note ? ' has-note' : ''}${noteOpen ? ' open' : ''}`}
          onClick={toggleNote}
          title={note ? 'Edit note' : 'Add note'}
        >✎</button>
      )}
    </>
  );

  const notePanel = noteOpen && canEdit && (
    <div className="task-note" onClick={e => e.stopPropagation()}>
      <textarea
        className="task-note-input"
        autoFocus
        value={draft}
        placeholder="Notes for this topic — gotchas, patterns, links…"
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') setNoteOpen(false); }}
      />
      <div className="task-note-actions">
        <button className="tn-btn save" onClick={saveNote}>Save</button>
        <button className="tn-btn" onClick={() => setNoteOpen(false)}>Cancel</button>
      </div>
    </div>
  );

  if (type === 'counter') {
    return (
      <div className={`task${done ? ' done' : ''}${isToday ? ' is-today' : ''}`}>
        <span className="task-text">{item.text}</span>
        {item.meta && <span className="task-meta">{item.meta}</span>}
        <div className="counter-ctrl">
          <button className="cnt-btn" onClick={() => canEdit && onToggle(item.id, Math.max(0, current - 1))} disabled={!canEdit || current === 0}>−</button>
          <span className="cnt-val">{current}<span className="cnt-tot">/{target}</span></span>
          <button className="cnt-btn" onClick={() => canEdit && onToggle(item.id, Math.min(target, current + 1))} disabled={!canEdit || current >= target}>+</button>
        </div>
        {extras}
        {isEditMode && <button className="delete-item-btn" onClick={onDelete} title="Remove item">×</button>}
        {notePanel}
      </div>
    );
  }

  if (type === 'link') {
    return (
      <div className="task task-link">
        <span className="link-icon">↗</span>
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="task-text task-url">{item.text}</a>
        ) : (
          <span className="task-text">{item.text}</span>
        )}
        {item.meta && <span className="task-meta">{item.meta}</span>}
        {isEditMode && <button className="delete-item-btn" onClick={onDelete} title="Remove item">×</button>}
      </div>
    );
  }

  // boolean (default)
  return (
    <div className={`task${done ? ' done' : ''}${isToday ? ' is-today' : ''}`}>
      <input
        type="checkbox"
        className="cb"
        checked={done}
        onChange={e => canEdit && onToggle(item.id, e.target.checked)}
        readOnly={!canEdit}
      />
      <span className="task-text" onClick={() => !isEditMode && canEdit && onToggle(item.id, !done)}>
        {item.text}
      </span>
      {item.meta && <span className="task-meta">{item.meta}</span>}
      {extras}
      {isEditMode && <button className="delete-item-btn" onClick={onDelete} title="Remove item">×</button>}
      {notePanel}
    </div>
  );
}
