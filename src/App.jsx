import { useState } from 'react';
import { SECTIONS } from './data/sections';
import { useProgress } from './hooks/useProgress';
import Header from './components/Header';
import SyncBanner from './components/SyncBanner';
import Dashboard from './components/Dashboard';
import TrackBars from './components/TrackBars';
import FilterBar from './components/FilterBar';
import SectionList from './components/SectionList';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

const DEFAULT_OPEN = new Set(SECTIONS.slice(0, 3).map(s => s.id));

export default function App() {
  const { progress, canEdit, saveText, syncOn, toggle, resetProgress, exportProgress, importProgress, signIn, signOut } = useProgress();
  const [activeFilter, setActiveFilter] = useState('all');
  const [openSections, setOpenSections] = useState(DEFAULT_OPEN);
  const [showAuthModal, setShowAuthModal] = useState(false);

  function handleFilterChange(filter) {
    setActiveFilter(filter);
    if (filter !== 'all') {
      // open all sections so filtered tasks are visible
      setOpenSections(new Set(SECTIONS.map(s => s.id)));
    }
  }

  function handleSectionToggle(id) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleAuthClick() {
    if (canEdit) { signOut(); } else { setShowAuthModal(true); }
  }

  async function handleSignIn(email, password) {
    const result = await signIn(email, password);
    return result;
  }

  return (
    <div className={`wrap${syncOn && !canEdit ? ' view-only' : ''}`}>
      <Header />
      <SyncBanner syncOn={syncOn} canEdit={canEdit} />
      <Dashboard progress={progress} />
      <TrackBars progress={progress} />
      <FilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      <SectionList
        progress={progress}
        openSections={openSections}
        activeFilter={activeFilter}
        canEdit={canEdit}
        onToggle={toggle}
        onSectionToggle={handleSectionToggle}
      />
      <Footer
        saveText={saveText}
        syncOn={syncOn}
        canEdit={canEdit}
        onExport={exportProgress}
        onImport={importProgress}
        onReset={resetProgress}
        onAuthClick={handleAuthClick}
      />
      {showAuthModal && (
        <AuthModal
          onSignIn={handleSignIn}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
