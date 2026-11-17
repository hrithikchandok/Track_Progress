import { Component, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Excalidraw, getSceneVersion, serializeAsJSON } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import Icon from './Icon';
import { useResolvedTheme } from './ThemeToggle';
import { useDrawing, isEmptyScene, primeDrawing } from '../hooks/useDrawing';
import { folderOf } from '../utils/vaultView';

class CanvasBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function CanvasMessage({ note, title, children }) {
  return (
    <div className="canvas-msg" role="alert">
      <h2>{note.title}</h2>
      <p>{title}</p>
      <div className="canvas-msg-actions">
        {children}
        <a className="btn" href={note.obsidianUrl}><Icon name="external" size={14} /> Open in Obsidian</a>
      </div>
    </div>
  );
}

const ZMIN = 0.1, ZMAX = 30;

// Builds the .excalidraw file to commit: the editor's scene, with the
// original file's background and settings kept (the editor itself runs on a
// transparent background so the dot grid shows through).
function buildScene(base, latest) {
  const json = JSON.parse(serializeAsJSON(latest.elements, latest.appState, latest.files, 'local'));
  return {
    ...base,
    ...json,
    appState: { ...json.appState, ...(base.appState || {}), viewBackgroundColor: base.appState?.viewBackgroundColor || '#ffffff' },
  };
}

// Full-viewport drawing editor with floating glass chrome. Edits stay as an
// in-memory draft per drawing until saved; Save commits the file to GitHub.
export default function DrawingCanvas({ drawings, note, userId, draft, onDraft, onSave, onClose, onSelect }) {
  const theme = useResolvedTheme();
  const { data, error, loading, retry } = useDrawing(note, userId);
  const [api, setApi] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [dirtyState, setDirty] = useState(Boolean(draft));
  const dirty = dirtyState || Boolean(draft);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  // Change tracking. Excalidraw re-measures text after fonts load, which bumps
  // element versions; the baseline follows those until the user interacts.
  const latest = useRef(null);
  const baseline = useRef(null);
  const touched = useRef(false);
  const dirtyRef = useRef(Boolean(draft));
  const sceneRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  sceneRef.current = data?.scene || null;

  const index = drawings.findIndex(d => d.id === note.id);
  const total = drawings.length;
  const go = useCallback(step => {
    if (!total) return;
    onSelect(drawings[(index + step + total) % total]);
  }, [drawings, index, total, onSelect]);

  useEffect(() => {
    document.documentElement.classList.add('canvas-open');
    rootRef.current?.focus();
    return () => document.documentElement.classList.remove('canvas-open');
  }, []);

  // Per drawing: reset tracking, and on leave keep unsaved work as a draft.
  useEffect(() => {
    setApi(null); setZoom(1); setSaveError('');
    latest.current = null; baseline.current = null; touched.current = false;
    dirtyRef.current = Boolean(draft); setDirty(Boolean(draft));
    return () => {
      if ((dirtyRef.current || draftRef.current) && latest.current && sceneRef.current) onDraft(note.id, buildScene(sceneRef.current, latest.current));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  const handleChange = useCallback((elements, appState, files) => {
    latest.current = { elements, appState, files };
    const z = appState.zoom.value;
    setZoom(prev => (Math.abs(prev - z) > 0.001 ? z : prev));
    const version = getSceneVersion(elements);
    if (!touched.current || baseline.current === null) { baseline.current = version; return; }
    const next = Boolean(draft) || version !== baseline.current;
    if (next !== dirtyRef.current) { dirtyRef.current = next; setDirty(next); }
  }, [draft]);

  const save = useCallback(async () => {
    if (!latest.current || !data || saving) return;
    setSaving(true); setSaveError('');
    try {
      const scene = buildScene(data.scene, latest.current);
      const content = JSON.stringify(scene, null, 2);
      const saved = await onSave(note, content);
      primeDrawing(saved, userId, { scene, raw: content });
      baseline.current = getSceneVersion(latest.current.elements);
      dirtyRef.current = false; setDirty(false);
      onDraft(note.id, null);
      setToast('Saved to GitHub');
    } catch (e) {
      setSaveError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [data, note, onSave, onDraft, saving, userId]);

  // Throw away unsaved edits and show the version from GitHub again.
  const discard = useCallback(() => {
    if (!api || !data) return;
    api.updateScene({ elements: data.scene.elements, appState: { selectedElementIds: {} } });
    api.history?.clear?.();
    onDraft(note.id, null);
    touched.current = false; baseline.current = null;
    dirtyRef.current = false; setDirty(false); setSaveError('');
    setMenuOpen(false);
    setToast('Changes discarded');
  }, [api, data, note.id, onDraft]);

  const zoomTo = useCallback(next => {
    if (!api) return;
    const st = api.getAppState();
    const z0 = st.zoom.value;
    const z1 = Math.min(ZMAX, Math.max(ZMIN, next));
    const cx = st.width / 2, cy = st.height / 2;
    api.updateScene({ appState: {
      zoom: { value: z1 },
      scrollX: cx / z1 - (cx / z0 - st.scrollX),
      scrollY: cy / z1 - (cy / z0 - st.scrollY),
    } });
  }, [api]);
  const zoomBy = useCallback(f => api && zoomTo(api.getAppState().zoom.value * f), [api, zoomTo]);
  // Fit the whole drawing in view, never above 100% so small drawings stay readable size.
  const resetZoom = useCallback(() => api?.scrollToContent(undefined, {
    fitToViewport: true, viewportZoomFactor: 0.9, maxZoom: 1, animate: false,
    canvasOffsets: { top: window.innerWidth <= 760 ? 210 : 170, bottom: 64, left: 16, right: 16 },
  }), [api]);
  useEffect(() => {
    if (!api) return;
    const id = requestAnimationFrame(() => resetZoom());
    return () => cancelAnimationFrame(id);
  }, [api, resetZoom]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); e.stopPropagation(); save(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable="true"]')) return;
      // Leave keys to the editor while something is selected or a tool is active.
      const st = api?.getAppState();
      const idle = !st || (!Object.keys(st.selectedElementIds || {}).length && !st.editingTextElement
        && !st.newElement && ['selection', 'hand'].includes(st.activeTool?.type));
      let handled = true;
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        else if (drawerOpen) setDrawerOpen(false);
        else if (idle) onClose();
        else if (st?.editingTextElement) handled = false; // let the text editor finish
        else {
          // Focus may sit on our chrome, so clear the selection / tool here.
          api.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {} } });
          api.setActiveTool({ type: 'selection' });
        }
      } else if (idle && e.key === 'ArrowLeft') go(-1);
      else if (idle && e.key === 'ArrowRight') go(1);
      else if (idle && (e.key === '+' || e.key === '=')) zoomBy(1.2);
      else if (idle && (e.key === '-' || e.key === '_')) zoomBy(1 / 1.2);
      else handled = false;
      if (handled) { e.preventDefault(); e.stopPropagation(); }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [api, go, zoomBy, onClose, menuOpen, drawerOpen, save]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = e => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  async function share() {
    const url = note.githubUrl;
    try {
      if (navigator.share) { await navigator.share({ title: note.title, url }); return; }
      await navigator.clipboard.writeText(url);
      setToast('GitHub link copied');
    } catch (e) {
      if (e?.name !== 'AbortError') setToast('Could not share this drawing');
    }
  }

  const folder = folderOf(note.path);
  const empty = data && isEmptyScene(data) && !draft;
  const status = saving ? 'Saving…' : saveError ? saveError : dirty ? 'Unsaved changes' : 'Synced with GitHub';

  let stage;
  if (error) {
    stage = <CanvasMessage note={note} title="Couldn't load this drawing. Open it in Obsidian instead.">
      <button className="btn" onClick={retry}><Icon name="refresh" size={14} /> Retry</button>
    </CanvasMessage>;
  } else if (loading) {
    stage = <div className="canvas-loading" role="status">Loading drawing…</div>;
  } else {
    const scene = draft || data.scene;
    stage = (
      <CanvasBoundary key={note.id} fallback={<CanvasMessage note={note} title="Couldn't load this drawing. Open it in Obsidian instead." />}>
        <div className="canvas-excalidraw" onPointerDownCapture={() => { touched.current = true; }} onKeyDownCapture={() => { touched.current = true; }}>
          <Excalidraw
            key={note.id}
            excalidrawAPI={setApi}
            initialData={{
              elements: scene.elements,
              files: scene.files || {},
              appState: { viewBackgroundColor: 'transparent' },
              scrollToContent: true,
            }}
            gridModeEnabled={false}
            theme={theme}
            handleKeyboardGlobally
            detectScroll={false}
            onChange={handleChange}
            UIOptions={{
              canvasActions: { changeViewBackgroundColor: false, clearCanvas: false, export: false, loadScene: false,
                saveAsImage: false, saveToActiveFile: false, toggleTheme: false },
            }}
          />
        </div>
        {empty && <div className="canvas-empty-hint glass">This drawing is empty. Start drawing, then Save.</div>}
      </CanvasBoundary>
    );
  }

  return createPortal(
    <div className="pc-canvas dot-grid" role="dialog" aria-modal="true" aria-label={`Drawing: ${note.title}`} tabIndex={-1} ref={rootRef}>
      <div className="canvas-stage">{stage}</div>

      <div className="canvas-top">
        <div className="glass canvas-pill">
          <button className="icon-btn" onClick={onClose} aria-label="Close canvas" title="Close (Esc)"><Icon name="x" size={17} /></button>
          <button className="icon-btn pill-prev" onClick={() => go(-1)} aria-label="Previous drawing" title="Previous (←)" disabled={total < 2}><Icon name="chevronLeft" size={17} /></button>
          <div className="canvas-title">
            <strong>{dirty && <span className="dirty-dot" aria-label="Unsaved changes" />}{note.title}</strong>
            {folder && <span className="mono">{folder}</span>}
          </div>
          <button className="icon-btn pill-next" onClick={() => go(1)} aria-label="Next drawing" title="Next (→)" disabled={total < 2}><Icon name="chevronRight" size={17} /></button>
          <span className="pill-sep" aria-hidden="true" />
          <button className={`pill-btn${drawerOpen ? ' on' : ''}`} onClick={() => setDrawerOpen(v => !v)} aria-pressed={drawerOpen} aria-label="All drawings">
            <Icon name="list" size={16} /><span className="pill-btn-label">All drawings</span>
          </button>
          <button className="icon-btn" onClick={share} aria-label="Share drawing" title="Share"><Icon name="share" size={16} /></button>
          <div className="menu-anchor" ref={menuRef}>
            <button className="icon-btn" onClick={() => setMenuOpen(v => !v)} aria-label="More" aria-haspopup="menu" aria-expanded={menuOpen}><Icon name="more" size={17} /></button>
            {menuOpen && (
              <div className="menu-pop" role="menu">
                <div className="menu-label">Go to</div>
                <Link role="menuitem" className="menu-item" to="/">Tracker</Link>
                <Link role="menuitem" className="menu-item" to="/articles">Articles</Link>
                <Link role="menuitem" className="menu-item" to="/obsidian">Obsidian Notes</Link>
                <div className="menu-sep" />
                {dirty && <button role="menuitem" className="menu-item danger" onClick={discard}><Icon name="x" size={14} /> Discard changes</button>}
                <a role="menuitem" className="menu-item" href={note.obsidianUrl}><Icon name="external" size={14} /> Open in Obsidian</a>
                <a role="menuitem" className="menu-item" href={note.githubUrl} target="_blank" rel="noreferrer"><Icon name="github" size={14} /> View on GitHub</a>
              </div>
            )}
          </div>
          <button className="pill-btn pill-save" onClick={save} disabled={!dirty || saving || !api} title="Save to GitHub (⌘S)">
            <Icon name="check" size={15} /><span>{saving ? 'Saving…' : 'Save'}</span>
          </button>
        </div>
        <div className={`glass canvas-chip${saveError ? ' error' : ''}`} role="status">
          <span className={`chip-status${dirty ? ' dirty' : ''}`}>{status}</span>
          <a className="chip-link" href={note.obsidianUrl}><Icon name="external" size={13} /> Open in Obsidian</a>
        </div>
      </div>

      <div className="glass canvas-corner canvas-bl">
        <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous drawing" disabled={total < 2}><Icon name="chevronLeft" size={16} /></button>
        <span className="mono tnum">{index + 1} / {total}</span>
        <button className="icon-btn" onClick={() => go(1)} aria-label="Next drawing" disabled={total < 2}><Icon name="chevronRight" size={16} /></button>
      </div>

      <div className="glass canvas-corner canvas-br">
        <button className="icon-btn" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out" title="Zoom out (−)" disabled={!api}><Icon name="minus" size={16} /></button>
        <span className="mono tnum zoom-val">{Math.round(zoom * 100)}%</span>
        <button className="icon-btn" onClick={() => zoomBy(1.2)} aria-label="Zoom in" title="Zoom in (+)" disabled={!api}><Icon name="plus" size={16} /></button>
        <button className="icon-btn" onClick={resetZoom} aria-label="Fit drawing to screen" title="Fit to screen" disabled={!api}><Icon name="maximize" size={15} /></button>
      </div>

      <aside className={`glass canvas-drawer${drawerOpen ? ' open' : ''}`} aria-label="All drawings" aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <span className="list-head">All drawings · {total}</span>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Close list" tabIndex={drawerOpen ? 0 : -1}><Icon name="x" size={15} /></button>
        </div>
        <div className="drawer-list">
          {drawings.map(d => (
            <button
              key={d.id}
              className={`note-row${d.id === note.id ? ' selected' : ''}`}
              onClick={() => onSelect(d)}
              tabIndex={drawerOpen ? 0 : -1}
            >
              <span className="row-icon" aria-hidden="true"><Icon name="shapes" size={14} /></span>
              <span className="row-text">
                <span className="row-title">{d.title}</span>
                <span className="row-meta">{folderOf(d.path) || 'Vault root'}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {toast && <div className="glass canvas-toast" role="status">{toast}</div>}
    </div>,
    document.body,
  );
}
