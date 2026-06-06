export default function TaskItem({ item, done, track, visible, canEdit, onToggle }) {
  function handleChange(e) {
    if (!canEdit) return;
    onToggle(item.id, e.target.checked);
  }

  function handleTextClick() {
    if (!canEdit) return;
    onToggle(item.id, !done);
  }

  return (
    <div
      className={`task${done ? ' done' : ''}${!visible ? ' hide' : ''}`}
      data-track={track}
    >
      <input
        type="checkbox"
        className="cb"
        checked={done}
        onChange={handleChange}
        readOnly={!canEdit}
      />
      <span className="task-text" onClick={handleTextClick}>{item.text}</span>
      {item.meta && <span className="task-meta">{item.meta}</span>}
    </div>
  );
}
