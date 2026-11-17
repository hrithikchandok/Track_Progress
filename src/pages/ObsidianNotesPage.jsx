import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TopNav from '../components/TopNav';
import VaultControls from '../components/VaultControls';
import Icon from '../components/Icon';
import DrawingThumb from '../components/DrawingThumb';
import { useVault } from '../hooks/useVault';
import { useDrawing, isEmptyScene } from '../hooks/useDrawing';
import { folderOf, normalizeVaultKind, vaultView } from '../utils/vaultView';

const DrawingCanvas = lazy(() => import('../components/DrawingCanvas'));

// Sections removed from this page by the redesign. They were UI blocks, not
// vault files; this guard also keeps any same-named vault entry off the list.
const HIDDEN_TITLES = /^(track target lists?|hld obsidian|lld obsidian|review queue)$/i;
const DEFAULT_REPO = 'hrithikchandok/obsidian_vault';
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

function obsidianHome(notes) {
  const sample = notes.find(n => n.obsidianUrl)?.obsidianUrl;
  const vault = sample && new URL(sample).searchParams.get('vault');
  return vault ? `obsidian://open?vault=${encodeURIComponent(vault)}` : 'obsidian://open';
}

function StatusPill({ note }) {
  const draft = note.status === 'draft';
  return <span className={`status-pill${draft ? '' : ' pub'}`}>{draft ? 'Draft' : 'Note'}</span>;
}

function NoteEditor({ note, value, onChange, onSave, onDiscard }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const dirty = value !== note.raw;
  useEffect(() => { setError(''); setSavedAt(null); }, [note.id]);
  async function save() {
    if (!dirty || saving) return;
    setSaving(true); setError('');
    try { await onSave(); setSavedAt(Date.now()); } catch (e) { setError(e.message || 'Save failed.'); } finally { setSaving(false); }
  }
  return (
    <div className="note-editor">
      <textarea
        className="note-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } }}
        spellCheck="true"
        aria-label={`Edit ${note.title}`}
      />
      <div className="editor-bar">
        <span className={`editor-status${error ? ' error' : dirty ? ' dirty' : ''}`} role="status">
          {saving ? 'Saving to GitHub…' : error || (dirty ? 'Unsaved changes' : savedAt ? 'Saved to GitHub' : 'Synced with GitHub')}
        </span>
        <div className="editor-actions">
          {dirty && <button className="btn" onClick={onDiscard} disabled={saving}>Discard</button>}
          <button className="btn btn-accent" onClick={save} disabled={!dirty || saving} title="Save to GitHub (⌘S)">
            <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DrawingPreview({ note, userId, onOpen }) {
  const { data, error, loading, retry } = useDrawing(note, userId);
  if (error) {
    return (
      <div className="preview-msg" role="alert">
        <p>Couldn&rsquo;t load this drawing. Open it in Obsidian instead.</p>
        <p className="row-meta">{error}</p>
        <div className="preview-actions">
          <button className="btn" onClick={retry}><Icon name="refresh" size={14} /> Retry</button>
          <a className="btn" href={note.obsidianUrl}><Icon name="external" size={14} /> Open in Obsidian</a>
        </div>
      </div>
    );
  }
  const empty = data && isEmptyScene(data);
  return (
    <button className="drawing-frame dot-grid" onClick={onOpen} aria-label={`Open ${note.title} in full-screen canvas`} disabled={loading}>
      {loading ? <span className="thumb-skel" aria-hidden="true" />
        : empty ? <span className="thumb-msg">This drawing is empty in the repository.</span>
          : <DrawingThumb data={data} cacheKey={`${userId}:${note.sha}`} title={note.title} />}
      {!loading && !empty && <span className="frame-hint glass"><Icon name="maximize" size={13} /> Open canvas</span>}
    </button>
  );
}

export default function ObsidianNotesPage({ userId, onSignOut }) {
  const vault = useVault(userId);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('preview');
  // Unsaved edits per vault entry: Markdown text, or an Excalidraw scene.
  const [drafts, setDrafts] = useState({});
  const setDraft = useCallback((id, value) => setDrafts(d => {
    if (value == null) { if (!(id in d)) return d; const { [id]: _, ...rest } = d; return rest; }
    return { ...d, [id]: value };
  }), []);
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const previewRef = useRef(null);

  const kind = normalizeVaultKind(params.get('kind'));
  const notes = useMemo(() => vault.notes.filter(n => !HIDDEN_TITLES.test(n.title.trim())), [vault.notes]);
  const { visible, selected } = vaultView(notes, kind, search, params.get('note'));
  const drawings = useMemo(() => notes.filter(n => n.kind === 'excalidraw'), [notes]);
  const noteCount = notes.length - drawings.length;
  const repo = notes[0]?.id?.split(':')[0] || DEFAULT_REPO;
  const canvasNote = location.hash === '#canvas' ? drawings.find(d => d.path === params.get('note')) : null;

  const go = useCallback((next, { hash = '', replace = false, state } = {}) => {
    const q = new URLSearchParams();
    q.set('kind', next.kind);
    if (next.note) q.set('note', next.note);
    navigate({ pathname: '/obsidian', search: `?${q}`, hash }, { replace, state });
  }, [navigate]);

  const selectNote = n => go({ kind: normalizeVaultKind(n.kind || 'markdown'), note: n.path }, { replace: true });
  const openCanvas = n => go({ kind: 'excalidraw', note: n.path }, { hash: 'canvas', state: { canvasFrom: n.path } });
  const swapCanvas = n => go({ kind: 'excalidraw', note: n.path }, { hash: 'canvas', replace: true, state: location.state });
  const closeCanvas = () => {
    if (location.state?.canvasFrom === canvasNote?.path) navigate(-1);
    else go({ kind: 'excalidraw', note: canvasNote?.path }, { replace: true });
  };

  // Toolbar search: ⌘K / Ctrl+K, the nav search icon, or arriving from another page.
  useEffect(() => {
    const focus = () => { searchRef.current?.focus(); searchRef.current?.select(); };
    const onKey = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); focus(); } };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pc:focus-search', focus);
    if (location.state?.focusSearch) focus();
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pc:focus-search', focus); };
  }, []);

  // Keep the Preview/Edit/Source choice when it applies to the newly selected entry.
  useEffect(() => {
    const isDrawing = selected?.kind === 'excalidraw';
    setMode(m => ((m === 'source' && !isDrawing) || (m === 'edit' && isDrawing) ? 'preview' : m));
  }, [selected?.id]);

  // Warn before leaving the site with unsaved edits.
  const hasDrafts = Object.keys(drafts).length > 0;
  useEffect(() => {
    if (!hasDrafts) return;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasDrafts]);

  const saveNote = useCallback(async note => {
    const saved = await vault.saveFile(note, drafts[note.id]);
    setDraft(note.id, null);
    return saved;
  }, [vault, drafts, setDraft]);

  function onListKey(e) {
    if (!visible.length) return;
    const i = Math.max(0, visible.findIndex(n => n.id === selected?.id));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = visible[Math.min(visible.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
      selectNote(next);
      requestAnimationFrame(() => listRef.current?.querySelector(`[data-id="${CSS.escape(next.id)}"]`)?.focus());
    } else if (e.key === 'Enter' && selected) {
      e.preventDefault();
      previewRef.current?.focus({ preventScroll: true });
      previewRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function openLink(href) {
    if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return null;
    let decoded;
    try { decoded = decodeURIComponent(href.split('#')[0]); } catch { return null; }
    const base = selected.path.split('/').slice(0, -1);
    for (const part of decoded.split('/')) { if (part === '..') base.pop(); else if (part !== '.') base.push(part); }
    const path = base.join('/').replace(/\.md$/i, '');
    const direct = notes.find(n => n.path.replace(/\.md$/i, '') === path)
      || notes.find(n => n.path.replace(/\.md$/i, '') === decoded.replace(/\.md$/i, ''));
    const byName = notes.filter(n => n.path.split('/').pop().replace(/\.md$/i, '') === decoded.replace(/\.md$/i, ''));
    return direct || (byName.length === 1 ? byName[0] : null);
  }
  // Translate common wiki links for reading; Source view keeps the file verbatim.
  // Preview shows unsaved edits too (frontmatter stripped the same way the server does).
  const draftText = selected ? drafts[selected.id] : undefined;
  const bodyText = typeof draftText === 'string' ? draftText.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') : selected?.content;
  const markdown = bodyText?.replace(/(?<!!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, target, label) => `[${label || target}](${encodeURI(target).replace(/\(/g, '%28').replace(/\)/g, '%29')})`);

  const previewMarkdown = markdown;
  const isDrawings = kind === 'excalidraw';
  const label = isDrawings ? 'drawing' : 'note';
  const loadingList = vault.syncing && !vault.notes.length;
  const folder = selected ? folderOf(selected.path) : '';

  let listBody;
  if (loadingList) {
    listBody = Array.from({ length: 7 }, (_, i) => (
      <div className="note-row skeleton" key={i} aria-hidden="true">
        <span className="row-icon" /><span className="row-text"><span className="sk-line" /><span className="sk-line short" /></span>
      </div>
    ));
  } else if (!visible.length) {
    listBody = (
      <div className="list-empty">
        {search ? <p>No matching {label}s.</p>
          : isDrawings ? <><p>No drawings yet. Create one in Obsidian with the Excalidraw plugin.</p><a className="btn" href={obsidianHome(vault.notes)}>Open Obsidian</a></>
            : <><p>No notes synced yet.</p><a className="btn" href={obsidianHome(vault.notes)}>Open Obsidian</a></>}
      </div>
    );
  } else {
    listBody = visible.map(n => (
      <button
        key={n.id}
        data-id={n.id}
        role="option"
        aria-selected={selected?.id === n.id}
        tabIndex={selected?.id === n.id ? 0 : -1}
        className={`note-row${selected?.id === n.id ? ' selected' : ''}`}
        onClick={() => selectNote(n)}
        onDoubleClick={() => n.kind === 'excalidraw' && openCanvas(n)}
      >
        <span className="row-icon" aria-hidden="true"><Icon name={n.kind === 'excalidraw' ? 'shapes' : 'file'} size={14} /></span>
        <span className="row-text">
          <span className="row-title">{drafts[n.id] != null && <span className="dirty-dot" aria-label="Unsaved changes" />}{n.title}</span>
          <span className="row-meta">{[folderOf(n.path) || 'Vault root', n.lastRevised].filter(Boolean).join(' · ')}</span>
        </span>
      </button>
    ));
  }

  return (
    <div className="wrap">
      <TopNav active="obsidian" onSignOut={onSignOut} />

      <header className="page-head">
        <div>
          <div className="eyebrow">Your knowledge vault</div>
          <h1 className="page-title">Obsidian Notes</h1>
          <p className="sub">
            <span className="tnum">{noteCount}</span> notes · <span className="tnum">{drawings.length}</span> drawings · from <span className="mono">{repo}</span>
          </p>
        </div>
        <VaultControls vault={vault} />
      </header>

      <div className="vault-toolbar">
        <div className="seg" role="tablist" aria-label="Vault view">
          {[['markdown', 'Notes'], ['excalidraw', 'Drawings']].map(([value, text]) => (
            <button key={value} role="tab" aria-selected={kind === value} className={`seg-item${kind === value ? ' active' : ''}`}
              onClick={() => { setSearch(''); go({ kind: value }, { replace: true }); }}>
              {text}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Icon name="search" size={15} />
          <input ref={searchRef} type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title, folder, tags…" aria-label="Search title, folder, tags" />
          <kbd className="kbd-hint">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </label>
      </div>

      <div className="vault-panes">
        <section className="panel list-pane" aria-label={`${label}s`}>
          <div className="list-head">
            {loadingList ? 'Syncing vault…' : `${visible.length} ${label}${visible.length === 1 ? '' : 's'}`}
          </div>
          <div className="list-scroll" role="listbox" aria-label={`${label}s`} ref={listRef} onKeyDown={onListKey}>
            {listBody}
          </div>
        </section>

        <article className="panel preview-pane" ref={previewRef} tabIndex={-1} aria-label="Preview">
          {selected ? (
            <>
              <div className="preview-head">
                <div className="crumb mono">{folder ? `${folder} / ` : ''}{selected.title}</div>
                <div className="preview-title-row">
                  <h2 className="preview-title">{selected.title}</h2>
                  <StatusPill note={selected} />
                </div>
                <div className="preview-meta">
                  {selected.lastRevised && <span className="row-meta">Last edited <span className="mono">{selected.lastRevised}</span></span>}
                  <div className="seg seg-sm" role="tablist" aria-label="View mode">
                    {(selected.kind === 'excalidraw' ? [['preview', 'Preview'], ['source', 'Source']] : [['preview', 'Preview'], ['edit', 'Edit']]).map(([m, text]) => (
                      <button key={m} role="tab" aria-selected={mode === m} className={`seg-item${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
                        {m === 'edit' && drafts[selected.id] != null && <span className="dirty-dot" aria-hidden="true" />}{text}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="preview-actions">
                  <a className="btn" href={selected.obsidianUrl}><Icon name="external" size={14} /> Open in Obsidian</a>
                  <a className="btn" href={selected.githubUrl} target="_blank" rel="noreferrer"><Icon name="github" size={14} /> GitHub</a>
                  {selected.kind === 'excalidraw' && (
                    <button className="btn btn-accent" onClick={() => openCanvas(selected)}><Icon name="maximize" size={14} /> Open canvas</button>
                  )}
                </div>
              </div>

              <div className="preview-body">
                {selected.kind === 'excalidraw' ? (
                  mode === 'source' ? <DrawingSource note={selected} userId={userId} />
                    : <DrawingPreview note={selected} userId={userId} onOpen={() => openCanvas(selected)} />
                ) : mode === 'edit' ? (
                  <NoteEditor
                    note={selected}
                    value={drafts[selected.id] ?? selected.raw}
                    onChange={v => setDraft(selected.id, v === selected.raw ? null : v)}
                    onSave={() => saveNote(selected)}
                    onDiscard={() => setDraft(selected.id, null)}
                  />
                ) : (
                  <div className="md-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      a: ({ href, children }) => {
                        const note = openLink(href);
                        return note
                          ? <button className="vault-inline-link" onClick={() => { setSearch(''); selectNote(note); }}>{children}</button>
                          : <a href={href && /^(https?:|mailto:|#)/i.test(href) ? href : selected.githubUrl} target="_blank" rel="noreferrer">{children}</a>;
                      },
                      img: ({ alt }) => <span className="row-meta">[Attachment: {alt || 'image'} — open in Obsidian or GitHub]</span>,
                    }}>{previewMarkdown}</ReactMarkdown>
                  </div>
                )}
                {selected.tags?.length > 0 && (
                  <div className="tag-row">{selected.tags.map(t => <span key={t} className="tag mono">#{t}</span>)}</div>
                )}
              </div>
            </>
          ) : (
            <div className="preview-empty">
              <Icon name={isDrawings ? 'shapes' : 'file'} size={22} />
              <p>{loadingList ? 'Loading your vault…' : `Select a ${label} to preview it here.`}</p>
            </div>
          )}
        </article>
      </div>

      {canvasNote && (
        <Suspense fallback={<div className="pc-canvas dot-grid"><div className="canvas-loading" role="status">Loading canvas…</div></div>}>
          <DrawingCanvas
            drawings={drawings}
            note={canvasNote}
            userId={userId}
            draft={drafts[canvasNote.id] || null}
            onDraft={setDraft}
            onSave={vault.saveFile}
            onClose={closeCanvas}
            onSelect={swapCanvas}
          />
        </Suspense>
      )}
    </div>
  );
}

function DrawingSource({ note, userId }) {
  const { data, error, loading } = useDrawing(note, userId);
  if (error) return <p className="vault-error" role="alert">{error}</p>;
  if (loading) return <p className="row-meta" role="status">Loading source…</p>;
  return <pre className="vault-source">{data.raw}</pre>;
}
