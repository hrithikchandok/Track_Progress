import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';

// Loads one drawing scene through /api/vault-drawing (unchanged endpoint) and
// keeps the last few in memory so switching drawings is instant.
const cache = new Map();
const inflight = new Map();
const MAX = 8;

async function fetchScene(note, userId) {
  const key = `${userId}:${note.id}:${note.sha}`;
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    const { data: { session } } = await sb.auth.getSession();
    const query = new URLSearchParams({ sha: note.sha, ref: note.ref, path: note.path });
    const response = await fetch(`/api/vault-drawing?${query}`, {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const retry = response.headers.get('Retry-After');
      throw new Error(`${payload.error || 'Could not load drawing.'}${retry ? ` Retry in ${retry} seconds.` : ''}`);
    }
    if (cache.size >= MAX) cache.delete(cache.keys().next().value);
    cache.set(key, payload);
    return payload;
  })();
  inflight.set(key, p);
  try { return await p; } finally { inflight.delete(key); }
}

export function useDrawing(note, userId) {
  const [state, setState] = useState({ data: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!note || note.kind !== 'excalidraw') { setState({ data: null, error: '' }); return; }
    let alive = true;
    const key = `${userId}:${note.id}:${note.sha}`;
    setState({ data: cache.get(key) || null, error: '' });
    fetchScene(note, userId)
      .then(data => { if (alive) setState({ data, error: '' }); })
      .catch(e => { if (alive) setState({ data: null, error: e.message || 'Could not load drawing.' }); });
    return () => { alive = false; };
  }, [note?.id, note?.sha, userId, attempt]);
  return { ...state, loading: !state.data && !state.error, retry: () => setAttempt(n => n + 1) };
}

// Seed the cache after a save so the editor doesn't refetch what it just wrote.
export function primeDrawing(note, userId, payload) {
  const key = `${userId}:${note.id}:${note.sha}`;
  if (cache.size >= MAX) cache.delete(cache.keys().next().value);
  cache.set(key, payload);
}

export const isEmptyScene = data => !data?.scene?.elements?.some(e => !e.isDeleted);
