import Section from './Section';

export default function SectionList({ sections, progress, openSections, activeFilter, canEdit, isEditMode, todayIds, onToggle, onToggleToday, onReviseSection, onSaveNote, onSectionToggle, onDeleteSection, onAddItem, onDeleteItem }) {
  return (
    <div id="plan">
      {(sections || []).map(section => (
        <Section
          key={section.id}
          section={section}
          progress={progress}
          isOpen={openSections.has(section.id)}
          activeFilter={activeFilter}
          canEdit={canEdit}
          isEditMode={isEditMode}
          todayIds={todayIds}
          onToggle={onToggle}
          onToggleToday={onToggleToday}
          onReviseSection={onReviseSection}
          onSaveNote={onSaveNote}
          onSectionToggle={onSectionToggle}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </div>
  );
}
