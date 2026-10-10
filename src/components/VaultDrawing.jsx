import { Component, useEffect, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { sb } from '../lib/supabase';

const cache = new Map();
class DrawingBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">Unable to display this drawing. Open it in Obsidian using the link above.</p> : this.props.children; }
}

export default function VaultDrawing({ note, userId, source }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const key = `${userId}:${note.id}:${note.sha}`;
    setData(null); setError('');
    async function load() {
      try {
        if (cache.has(key)) { setData(cache.get(key)); return; }
        const { data: { session } } = await sb.auth.getSession();
        const query = new URLSearchParams({ sha: note.sha, ref: note.ref, path: note.path });
        const response = await fetch(`/api/vault-drawing?${query}`, {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}, signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          const retry = response.headers.get('Retry-After');
          throw new Error(`${payload.error || 'Could not load drawing.'}${retry ? ` Retry in ${retry} seconds.` : ''}`);
        }
        if (controller.signal.aborted) return;
        if (cache.size >= 6) cache.delete(cache.keys().next().value);
        cache.set(key, payload); setData(payload);
      } catch (e) { if (!controller.signal.aborted) setError(e.message); }
    }
    load();
    return () => controller.abort();
  }, [note.id, note.sha, userId, attempt]);
  if (error) return <div role="alert"><p className="vault-error">{error}</p><button className="btn" onClick={() => setAttempt(n => n + 1)}>Retry drawing</button></div>;
  if (!data) return <p role="status" className="sub">Loading drawing…</p>;
  if (source) return <pre className="vault-source">{data.raw}</pre>;
  if (!data.scene.elements.some(e => !e.isDeleted)) return <p className="sub">This drawing is empty in the repository.</p>;
  return <DrawingBoundary key={note.sha}>
    <p className="sub">Read-only drawing · drag to pan, use the zoom controls to explore. Edit the original in Obsidian.</p>
    <div className="vault-drawing"><Excalidraw key={note.sha}
      initialData={{ elements: data.scene.elements, files: data.scene.files || {},
        appState: { viewBackgroundColor: data.scene.appState?.viewBackgroundColor || '#ffffff' }, scrollToContent: true }}
      viewModeEnabled theme="light" handleKeyboardGlobally={false}
      UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false, clearCanvas: false, saveAsImage: false } }}
    /></div>
  </DrawingBoundary>;
}
