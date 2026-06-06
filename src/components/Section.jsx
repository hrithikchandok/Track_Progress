import { COLORS } from '../data/sections';
import { secProgress } from '../hooks/useProgress';
import TaskItem from './TaskItem';

export default function Section({ section, progress, isOpen, activeFilter, canEdit, onToggle, onSectionToggle }) {
  const { pct, label } = secProgress(section, progress);

  // Build item list with group headers.
  // Filtering is track-level: all items in a section share the same track,
  // so if the section is visible, all its tasks and group headers are visible.
  const rows = [];
  let lastGroup = null;
  for (const item of section.items) {
    if (item.group && item.group !== lastGroup) {
      lastGroup = item.group;
      rows.push(<div key={`grp-${item.group}`} className="grp">{item.group}</div>);
    }
    rows.push(
      <TaskItem
        key={item.id}
        item={item}
        done={!!progress[item.id]}
        track={section.track}
        visible={true}
        canEdit={canEdit}
        onToggle={onToggle}
      />
    );
  }

  // Hide whole section if no visible tasks
  const hasVisible = activeFilter === 'all' || section.track === activeFilter;
  if (!hasVisible) return null;

  return (
    <div className={`section${section.sup ? ' sup' : ''}${isOpen ? ' open' : ''}`} data-id={section.id}>
      <div className="sec-head" onClick={() => onSectionToggle(section.id)}>
        <span className="sec-bullet" style={{ background: COLORS[section.track] }}></span>
        <span className="sec-title">
          {section.title} <span className="tiny">· {section.sub}</span>
        </span>
        <span className="sec-meta">{label}</span>
        <span className="sec-chev">▸</span>
      </div>
      <div className="miniprog">
        <i style={{ width: `${pct}%`, background: COLORS[section.track] }}></i>
      </div>
      <div className="sec-body">
        {rows}
      </div>
    </div>
  );
}
