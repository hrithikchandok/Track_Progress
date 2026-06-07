import { secProgress } from '../utils/progress';
import TaskItem from './TaskItem';

export default function Section({ section, progress, isOpen, activeFilter, canEdit, isEditMode, onToggle, onSectionToggle, onDeleteSection, onAddItem, onDeleteItem }) {
  const { pct, label } = secProgress(section, progress);
  const isVisible = activeFilter === 'all' || section.track === activeFilter;
  if (!isVisible) return null;

  const rows = [];
  let lastGroup = null;
  for (const item of section.items || []) {
    if (item.group && item.group !== lastGroup) {
      lastGroup = item.group;
      rows.push(<div key={`grp-${item.group}`} className="grp">{item.group}</div>);
    }
    rows.push(
      <TaskItem
        key={item.id}
        item={item}
        value={progress[item.id]}
        track={section.track}
        canEdit={canEdit}
        isEditMode={isEditMode}
        onToggle={onToggle}
        onDelete={isEditMode ? () => onDeleteItem(section.id, item.id) : undefined}
      />
    );
  }

  return (
    <div className={`section${section.sup ? ' sup' : ''}${isOpen ? ' open' : ''}`} data-id={section.id}>
      <div className="sec-head" onClick={() => !isEditMode && onSectionToggle(section.id)}>
        <span className="sec-bullet" style={{ background: section.color }}></span>
        <span className="sec-title">
          {section.title} <span className="tiny">· {section.sub}</span>
        </span>
        <span className="sec-meta">{label}</span>
        {isEditMode ? (
          <div className="edit-actions" onClick={e => e.stopPropagation()}>
            <button className="edit-btn" onClick={() => onAddItem(section.id)} title="Add item">+ item</button>
            <button className="edit-btn danger" onClick={() => onDeleteSection(section.id)} title="Delete section">delete</button>
          </div>
        ) : (
          <span className="sec-chev">▸</span>
        )}
      </div>
      <div className="miniprog">
        <i style={{ width: `${pct}%`, background: section.color }}></i>
      </div>
      <div className="sec-body">
        {rows}
        {isEditMode && (
          <button className="add-item-inline" onClick={() => onAddItem(section.id)}>
            + Add item
          </button>
        )}
      </div>
    </div>
  );
}
