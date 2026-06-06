import { SECTIONS } from '../data/sections';
import Section from './Section';

export default function SectionList({ progress, openSections, activeFilter, canEdit, onToggle, onSectionToggle }) {
  return (
    <div id="plan">
      {SECTIONS.map(section => (
        <Section
          key={section.id}
          section={section}
          progress={progress}
          isOpen={openSections.has(section.id)}
          activeFilter={activeFilter}
          canEdit={canEdit}
          onToggle={onToggle}
          onSectionToggle={onSectionToggle}
        />
      ))}
    </div>
  );
}
