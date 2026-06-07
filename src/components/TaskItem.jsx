export default function TaskItem({ item, value, canEdit, isEditMode, onToggle, onDelete }) {
  const type = item.type || 'boolean';

  if (type === 'counter') {
    const current = typeof value === 'number' ? value : 0;
    const target = item.target || 1;
    const isDone = current >= target;
    return (
      <div className={`task${isDone ? ' done' : ''}`}>
        <span className="task-text">{item.text}</span>
        {item.meta && <span className="task-meta">{item.meta}</span>}
        <div className="counter-ctrl">
          <button
            className="cnt-btn"
            onClick={() => canEdit && onToggle(item.id, Math.max(0, current - 1))}
            disabled={!canEdit || current === 0}
          >−</button>
          <span className="cnt-val">{current}<span className="cnt-tot">/{target}</span></span>
          <button
            className="cnt-btn"
            onClick={() => canEdit && onToggle(item.id, Math.min(target, current + 1))}
            disabled={!canEdit || current >= target}
          >+</button>
        </div>
        {isEditMode && <button className="delete-item-btn" onClick={onDelete} title="Remove item">×</button>}
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
  const done = !!value;
  return (
    <div className={`task${done ? ' done' : ''}`}>
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
      {isEditMode && <button className="delete-item-btn" onClick={onDelete} title="Remove item">×</button>}
    </div>
  );
}
