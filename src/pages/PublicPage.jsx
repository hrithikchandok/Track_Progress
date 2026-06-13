import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sb } from '../lib/supabase';
import Header from '../components/Header';
import TopNav from '../components/TopNav';
import Dashboard from '../components/Dashboard';
import TrackBars from '../components/TrackBars';
import FilterBar from '../components/FilterBar';
import SectionList from '../components/SectionList';

export default function PublicPage() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [openSections, setOpenSections] = useState(new Set());

  useEffect(() => {
    sb.from('tracker_progress')
      .select('sections, progress, username')
      .eq('username', username)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) {
          setData(row);
          setOpenSections(new Set((row.sections || []).slice(0, 3).map(s => s.id)));
        }
        setLoading(false);
      });
  }, [username]);

  function handleSectionToggle(id) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (loading) return <div className="wrap" style={{ paddingTop: 80 }}><p className="sub">Loading…</p></div>;
  if (!data) return (
    <div className="wrap" style={{ paddingTop: 80 }}>
      <div className="kicker" style={{ marginBottom: 12 }}>404</div>
      <h1 style={{ fontSize: 32 }}>No tracker found <span className="slash">// {username}</span></h1>
      <p className="sub" style={{ marginTop: 8 }}>This username hasn't set up a public tracker yet.</p>
    </div>
  );

  const { sections = [], progress = {} } = data;

  return (
    <div className="wrap view-only">
      <TopNav
        active="tracker"
        links={[
          { key: 'tracker', label: '◷ Tracker', to: `/u/${username}` },
          { key: 'articles', label: '✎ Articles', to: `/u/${username}/articles` },
        ]}
      />
      <div className="banner view" style={{ marginBottom: 22 }}>
        🔵 <b>Live view</b> — {username}&rsquo;s progress (read-only).
      </div>
      <Header />
      <Dashboard sections={sections} progress={progress} />
      <TrackBars sections={sections} progress={progress} />
      <FilterBar sections={sections} activeFilter={activeFilter} onFilterChange={f => {
        setActiveFilter(f);
        if (f !== 'all') setOpenSections(new Set(sections.map(s => s.id)));
      }} />
      <SectionList
        sections={sections}
        progress={progress}
        openSections={openSections}
        activeFilter={activeFilter}
        canEdit={false}
        isEditMode={false}
        onToggle={() => {}}
        onSectionToggle={handleSectionToggle}
      />
    </div>
  );
}
