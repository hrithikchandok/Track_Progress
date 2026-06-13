import { useState, useEffect } from 'react';
import { useUserData } from '../hooks/useUserData';
import { useDayClock, dreadLevel } from '../hooks/useDayClock';
import { itemDone } from '../utils/progress';
import { playF1Rev } from '../utils/sfx';
import { randomQuote } from '../data/quotes';
import { genId } from '../utils/id';
import Header from '../components/Header';
import TopNav from '../components/TopNav';
import TodayPanel from '../components/TodayPanel';
import Dashboard from '../components/Dashboard';
import TrackBars from '../components/TrackBars';
import FilterBar from '../components/FilterBar';
import SectionList from '../components/SectionList';
import Footer from '../components/Footer';
import OnboardingModal from '../components/OnboardingModal';
import AddSectionModal from '../components/AddSectionModal';
import AddItemModal from '../components/AddItemModal';
import ShareModal from '../components/ShareModal';
import LinkImportModal from '../components/LinkImportModal';
import LiveUsers from '../components/LiveUsers';
import ActivityHeatmap from '../components/ActivityHeatmap';
import InterviewsSection from '../components/InterviewsSection';
import { usePresence } from '../hooks/usePresence';

export default function DashboardPage({ userId, onSignOut }) {
  const { sections, progress, username, initialized, saveText, dailyLogs, headerMeta, interviews, applicationsCount, todayIds, toggle, update, setupUser, saveUsername, resetAll, exportProgress, importBackup, updateHeaderMeta, saveInterviews, saveApplicationsCount, toggleTodayItem } = useUserData(userId);
  const liveCount = usePresence(userId);
  const clock = useDayClock();

  const [activeFilter, setActiveFilter] = useState('all');
  const [openSections, setOpenSections] = useState(() => new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showLinkImport, setShowLinkImport] = useState(false);
  const [addItemTo, setAddItemTo] = useState(null);
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('focusMode') === '1');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('sfx') !== '0');
  const [quote, setQuote] = useState(null);

  function handleToggleFocus() {
    setFocusMode(prev => {
      const next = !prev;
      localStorage.setItem('focusMode', next ? '1' : '0');
      return next;
    });
  }

  function handleToggleSound() {
    setSoundOn(prev => {
      const next = !prev;
      localStorage.setItem('sfx', next ? '1' : '0');
      if (next) playF1Rev(); // preview + unlock the audio context on this user gesture
      return next;
    });
  }

  // Wraps the data-layer toggle: when a task crosses into "done", rev the engine
  // and flash a random motivational quote.
  function handleToggle(id, val) {
    const item = sections.flatMap(s => s.items || []).find(i => i.id === id);
    if (item) {
      const prev = progress[id];
      const justDone = (item.type || 'boolean') === 'counter'
        ? val >= (item.target || 1) && (prev || 0) < (item.target || 1)
        : val === true && !prev;
      if (justDone) {
        if (soundOn) playF1Rev();
        setQuote({ text: randomQuote(), id: Date.now() });
      }
    }
    toggle(id, val);
  }

  useEffect(() => {
    if (!quote) return;
    const t = setTimeout(() => setQuote(null), 10000);
    return () => clearTimeout(t);
  }, [quote]);

  // Auto-open first 3 sections whenever sections first load or are replaced by import
  useEffect(() => {
    if (sections.length > 0) {
      setOpenSections(new Set(sections.slice(0, 3).map(s => s.id)));
    }
  }, [sections.length === 0 ? 0 : sections[0]?.id]);

  function handleSectionToggle(id) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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

  function handleLinkImport(section) {
    update([...sections, section], progress);
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

  // Resolve the Today list (ids → item objects), preserving the order they were starred.
  const itemsById = new Map(sections.flatMap(s => s.items || []).map(i => [i.id, i]));
  const todayItems = todayIds.map(id => itemsById.get(id)).filter(Boolean);
  const pendingToday = todayItems.filter(i => !itemDone(i, progress));
  const hasPending = pendingToday.length > 0;

  // Background reddens naturally as the day burns down with unfinished tasks.
  // Focus mode slams it to near-max immediately to crank the pressure.
  const baseDread = dreadLevel(clock.elapsed, hasPending);
  const dread = hasPending && focusMode ? Math.max(baseDread, 0.88) : baseDread;

  return (
    <div className={`wrap${dread > 0.02 ? ' degrade' : ''}`} style={{ '--dread': dread }}>
      {dread > 0.02 && <div className="dread-overlay" style={{ opacity: dread }} />}
      <TopNav
        active="tracker"
        links={[{ key: 'tracker', label: '◷ Tracker', to: '/' }, { key: 'articles', label: '✎ Articles', to: '/articles' }]}
      />
      <Header
        meta={headerMeta}
        onSaveMeta={updateHeaderMeta}
        focusMode={focusMode}
        focusAvailable={hasPending}
        onToggleFocus={handleToggleFocus}
      />
      <LiveUsers count={liveCount} soundOn={soundOn} onToggleSound={handleToggleSound} />
      <Dashboard sections={sections} progress={progress} dailyLogs={dailyLogs} />
      <ActivityHeatmap dailyLogs={dailyLogs} />
      <TrackBars sections={sections} progress={progress} activeFilter={activeFilter} />
      <FilterBar sections={sections} activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      <TodayPanel
        items={todayItems}
        progress={progress}
        clock={clock}
        dread={dread}
        onToggle={handleToggle}
        onToggleToday={toggleTodayItem}
      />
      <InterviewsSection
        interviews={interviews}
        applicationsCount={applicationsCount}
        onSave={saveInterviews}
        onUpdateApps={saveApplicationsCount}
      />
      <SectionList
        sections={sections}
        progress={progress}
        openSections={openSections}
        activeFilter={activeFilter}
        canEdit={true}
        isEditMode={isEditMode}
        todayIds={todayIds}
        onToggle={handleToggle}
        onToggleToday={toggleTodayItem}
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
        onImport={file => importBackup(file)}
        onImportFromLink={() => setShowLinkImport(true)}
        onReset={resetAll}
        onSignOut={onSignOut}
      />

      {quote && (
        <div className="quote-toast" key={quote.id}>
          <span className="quote-flag">🏁</span>
          <span className="quote-text">{quote.text}</span>
        </div>
      )}

      {showShareModal && <ShareModal currentUsername={username} onSave={saveUsername} onClose={() => setShowShareModal(false)} />}
      {showLinkImport && <LinkImportModal onImport={handleLinkImport} onClose={() => setShowLinkImport(false)} />}
      {showAddSection && <AddSectionModal onAdd={handleAddSection} onClose={() => setShowAddSection(false)} />}
      {addItemTo && <AddItemModal sectionTitle={targetSection?.title || ''} onAdd={item => handleAddItem(addItemTo, item)} onClose={() => setAddItemTo(null)} />}
    </div>
  );
}
