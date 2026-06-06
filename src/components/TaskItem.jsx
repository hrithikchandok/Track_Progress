export default function TaskItem({ item, done, canEdit, isEditMode, onToggle, onDelete }) {
  function handleChange(e) {
    if (!canEdit) return;
    onToggle(item.id, e.target.checked);
  }

  function handleTextClick() {
    if (!canEdit || isEditMode) return;
    onToggle(item.id, !done);
  }

  return (
    <div className={`task${done ? ' done' : ''}`}>
      <input type="checkbox" className="cb" checked={done} onChange={handleChange} readOnly={!canEdit} />
      <span className="task-text" onClick={handleTextClick}>{item.text}</span>
      {item.meta && <span className="task-meta">{item.meta}</span>}
      {isEditMode && (
        <button className="delete-item-btn" onClick={onDelete} title="Remove item">×</button>
      )}
    </div>
  );
}
