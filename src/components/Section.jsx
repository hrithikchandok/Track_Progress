import { secProgress } from '../utils/progress';
import TaskItem from './TaskItem';

export default function Section({ section, progress, isOpen, activeFilter, canEdit, isEditMode, todayIds, onToggle, onToggleToday, onReviseSection, onSaveNote, onSectionToggle, onDeleteSection, onAddItem, onDeleteItem }) {
  const { pct, done, total, label } = secProgress(section, progress);
  const isVisible = activeFilter === 'all' || section.track === activeFilter;
  if (!isVisible) return null;

  const complete = total > 0 && done === total;
  const stage = progress.__secrev?.[section.id] || 0; // how many revision passes done (0..3)

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
        isToday={todayIds?.includes(item.id)}
        note={progress.__note?.[item.id] || ''}
        onToggle={onToggle}
        onToggleToday={onToggleToday}
        onSaveNote={onSaveNote}
        onDelete={isEditMode ? () => onDeleteItem(section.id, item.id) : undefined}
      />
    );
  }

  // R1/R2/R3 — each Ri unlocks once the section has been fully completed i times.
  const revButtons = canEdit && !isEditMode && onReviseSection && (
    <div className="sec-revs" onClick={e => e.stopPropagation()}>
      {[1, 2, 3].map(i => {
        const isDone = stage >= i;
        const isAvail = stage === i - 1 && complete;
        return (
          <button
            key={i}
            className={`sec-rev${isDone ? ' done' : ''}${isAvail ? ' avail' : ''}`}
            disabled={!isAvail}
            onClick={() => isAvail && onReviseSection(section.id)}
            title={
              isDone ? `Revision ${i} logged`
                : isAvail ? `Log revision ${i} — this re-opens the section so you can redo it`
                : `Locked — complete the section ${i} time${i > 1 ? 's' : ''} to unlock`
            }
          >R{i}</button>
        );
      })}
    </div>
  );

  return (
    <div className={`section${section.sup ? ' sup' : ''}${isOpen ? ' open' : ''}`} data-id={section.id}>
      <div className="sec-head" onClick={() => !isEditMode && onSectionToggle(section.id)}>
        <span className="sec-bullet" style={{ background: section.color }}></span>
        <span className="sec-title">
          {section.title} <span className="tiny">· {section.sub}</span>
        </span>
        {revButtons}
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
