import { useState, useMemo } from 'react';
import { useUserData } from '../hooks/useUserData';
import { genId } from '../utils/id';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import TrackBars from '../components/TrackBars';
import FilterBar from '../components/FilterBar';
import SectionList from '../components/SectionList';
import Footer from '../components/Footer';
import OnboardingModal from '../components/OnboardingModal';
import AddSectionModal from '../components/AddSectionModal';
import AddItemModal from '../components/AddItemModal';
import ShareModal from '../components/ShareModal';

export default function DashboardPage({ userId, onSignOut }) {
  const { sections, progress, username, initialized, saveText, toggle, update, setupUser, saveUsername, resetProgress, exportProgress, importBackup } = useUserData(userId);

  const [activeFilter, setActiveFilter] = useState('all');
  const [openSections, setOpenSections] = useState(() => new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [addItemTo, setAddItemTo] = useState(null); // section id

  // Open first 3 sections once sections load
  const defaultOpenSet = useMemo(() => new Set(sections.slice(0, 3).map(s => s.id)), [sections.length > 0 && sections[0]?.id]);

  function getOpenSections() {
    return openSections.size === 0 && sections.length > 0 ? defaultOpenSet : openSections;
  }

  function handleSectionToggle(id) {
    const current = getOpenSections();
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    setOpenSections(next);
  }

  function handleFilterChange(filter) {
    setActiveFilter(filter);
    if (filter !== 'all') setOpenSections(new Set(sections.map(s => s.id)));
  }

  function handleAddSection(sectionData) {
    const newSection = { ...sectionData, id: genId() };
    update([...sections, newSection], progress);
    setShowAddSection(false);
  }

  function handleDeleteSection(sectionId) {
    if (!confirm('Delete this section and all its items?')) return;
    const newProgress = { ...progress };
    sections.find(s => s.id === sectionId)?.items.forEach(i => delete newProgress[i.id]);
    update(sections.filter(s => s.id !== sectionId), newProgress);
  }

  function handleAddItem(sectionId, itemData) {
    const newItem = { ...itemData, id: genId() };
    const newSections = sections.map(s =>
      s.id === sectionId ? { ...s, items: [...(s.items || []), newItem] } : s
    );
    update(newSections, progress);
    setAddItemTo(null);
  }

  function handleDeleteItem(sectionId, itemId) {
    if (!confirm('Remove this item?')) return;
    const newSections = sections.map(s =>
      s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
    );
    const newProgress = { ...progress };
    delete newProgress[itemId];
    update(newSections, newProgress);
  }

  if (initialized === null) {
    return <div className="wrap" style={{ paddingTop: 80 }}><p className="sub">Loading…</p></div>;
  }

  if (initialized === false) {
    return <OnboardingModal onSetup={setupUser} />;
  }

  const targetSection = sections.find(s => s.id === addItemTo);

  return (
    <div className="wrap">
      <Header />
      <Dashboard sections={sections} progress={progress} />
      <TrackBars sections={sections} progress={progress} />
      <FilterBar sections={sections} activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      <SectionList
        sections={sections}
        progress={progress}
        openSections={getOpenSections()}
        activeFilter={activeFilter}
        canEdit={true}
        isEditMode={isEditMode}
        onToggle={toggle}
        onSectionToggle={handleSectionToggle}
        onDeleteSection={handleDeleteSection}
        onAddItem={id => setAddItemTo(id)}
        onDeleteItem={handleDeleteItem}
      />
      {isEditMode && (
        <button className="btn add-section-btn" onClick={() => setShowAddSection(true)}>+ Add section</button>
      )}
      <Footer
        saveText={saveText}
        isEditMode={isEditMode}
        onToggleEdit={() => setIsEditMode(v => !v)}
        onShare={() => setShowShareModal(true)}
        onExport={exportProgress}
        onImport={importBackup}
        onReset={resetProgress}
        onSignOut={onSignOut}
      />

      {showShareModal && <ShareModal currentUsername={username} onSave={saveUsername} onClose={() => setShowShareModal(false)} />}
      {showAddSection && <AddSectionModal onAdd={handleAddSection} onClose={() => setShowAddSection(false)} />}
      {addItemTo && <AddItemModal sectionTitle={targetSection?.title || ''} onAdd={item => handleAddItem(addItemTo, item)} onClose={() => setAddItemTo(null)} />}
    </div>
  );
}
