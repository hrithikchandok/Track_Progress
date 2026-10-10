import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TopNav from '../components/TopNav';
import VaultControls from '../components/VaultControls';
import VaultRoadmap from '../components/VaultRoadmap';
import { useVault } from '../hooks/useVault';
const VaultDrawing = lazy(() => import('../components/VaultDrawing'));

export default function ObsidianNotesPage({ userId, onSignOut }) {
  const vault = useVault(userId);
  const [search, setSearch] = useState('');
  const [raw, setRaw] = useState(false);
  const [kind, setKind] = useState('all');
  const [params, setParams] = useSearchParams();
  const visible = vault.notes.filter(n => (kind === 'all' || (n.kind || 'markdown') === kind)
    && `${n.title} ${n.path} ${n.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const selected = vault.notes.find(n => n.path === params.get('note')) || visible[0];
  function openLink(href) {
    if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return null;
    let decoded;
    try { decoded = decodeURIComponent(href.split('#')[0]); } catch { return null; }
    const base = selected.path.split('/').slice(0, -1);
    for (const part of decoded.split('/')) { if (part === '..') base.pop(); else if (part !== '.') base.push(part); }
    const path = base.join('/').replace(/\.md$/i, '');
    const direct = vault.notes.find(n => n.path.replace(/\.md$/i, '') === path)
      || vault.notes.find(n => n.path.replace(/\.md$/i, '') === decoded.replace(/\.md$/i, ''));
    const byName = vault.notes.filter(n => n.path.split('/').pop().replace(/\.md$/i, '') === decoded.replace(/\.md$/i, ''));
    return direct || (byName.length === 1 ? byName[0] : null);
  }
  // Preserve the source verbatim in Source view; translate common wiki links for reading.
  const markdown = selected?.content.replace(/(?<!!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, target, label) => `[${label || target}](${encodeURI(target).replace(/\(/g, '%28').replace(/\)/g, '%29')})`);
  return <div className="wrap">
    <TopNav active="obsidian" links={[{ key: 'tracker', label: '◷ Tracker', to: '/' }, { key: 'articles', label: '✎ Articles', to: '/articles' }]} right={<button className="topnav-signout" onClick={onSignOut}>Sign out</button>} />
    <div className="articles-head"><div><div className="kicker">Your knowledge vault</div><h1>Obsidian Notes</h1><p className="sub">Markdown & drawings from hrithikchandok/obsidian_vault</p><p className="sub">{vault.notes.filter(n => n.kind !== 'excalidraw').length} notes · {vault.notes.filter(n => n.kind === 'excalidraw').length} drawings</p></div><VaultControls vault={vault} /></div>
    <div className="vault-layout">
      <aside className="vault-card"><label htmlFor="vault-search">Find a note</label><input id="vault-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, folder, tags…" />
        <div className="vault-controls">{[['all', 'All'], ['markdown', 'Notes'], ['excalidraw', 'Excalidraw']].map(([value, label]) => <button key={value} className={`chip${kind === value ? ' active' : ''}`} onClick={() => { setKind(value); setParams({}); }}>{label}</button>)}</div>
        {visible.map(n => <button className={`vault-file${selected?.id === n.id ? ' selected' : ''}`} key={n.id} onClick={() => setParams({ note: n.path })}><strong>{n.kind === 'excalidraw' ? '◇ ' : ''}{n.title}</strong><small>{n.path}</small></button>)}
        {!visible.length && <p className="sub">{vault.notes.length ? 'No matching notes.' : 'No notes synced yet. Connect the repository using the server settings, then sync.'}</p>}
      </aside>
      <article className="vault-card vault-reader">{selected ? <>
        <div className="vault-note-row"><h2>{selected.title}</h2><span className="chip">{selected.track || 'Note'} · {selected.status} · {selected.confidence || '—'}/3</span></div>
        <div className="vault-note-row"><a href={selected.obsidianUrl}>Open in Obsidian ↗</a><a href={selected.githubUrl} target="_blank" rel="noreferrer">View on GitHub ↗</a><button className="btn" onClick={() => setRaw(v => !v)}>{raw ? 'Rendered' : selected.kind === 'excalidraw' ? 'Drawing source' : 'Markdown source'}</button></div>
        {selected.kind === 'excalidraw' ? <Suspense fallback={<p className="sub">Loading drawing viewer…</p>}><VaultDrawing key={selected.sha} note={selected} userId={userId} source={raw} /></Suspense> : raw ? <pre className="vault-source">{selected.raw}</pre> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          a: ({ href, children }) => { const note = openLink(href); return note ? <button className="vault-inline-link" onClick={() => setParams({ note: note.path })}>{children}</button> : <a href={href && /^(https?:|mailto:|#)/i.test(href) ? href : selected.githubUrl} target="_blank" rel="noreferrer">{children}</a>; },
          img: ({ alt }) => <span className="sub">[Attachment: {alt || 'image'} — open in Obsidian or GitHub]</span>,
        }}>{markdown}</ReactMarkdown>}
      </> : <p className="sub">Your notes will appear here exactly as stored in the vault. Use Markdown source to see the unmodified file, including frontmatter.</p>}</article>
    </div>
    <details className="vault-card"><summary>Track target lists</summary><p className="sub">One exact note title or repository file path per line. Progress measures targets with a note created; ready/revised counts are shown separately.</p>
      {['HLD', 'LLD'].map(track => <label className="vault-target" key={track}>{track} targets<textarea key={`${track}:${vault.targets[track].join('|')}`} defaultValue={vault.targets[track].join('\n')} onBlur={e => vault.saveTargets(track, e.target.value)} placeholder="Distributed Rate Limiter" /></label>)}
    </details>
    <VaultRoadmap vault={vault} />
  </div>;
}
