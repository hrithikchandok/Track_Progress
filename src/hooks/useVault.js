import { useCallback, useEffect, useRef, useState } from 'react';
import { sb } from '../lib/supabase';

const empty = () => ({ notes: [], syncedAt: null, targets: { HLD: [], LLD: [] } });
function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value && Array.isArray(value.notes) && value.targets) return value;
  } catch { /* A corrupt cache must not prevent opening the app. */ }
  return empty();
}

export function useVault(userId) {
  const key = `prep-vault-v1:${userId}`;
  const [data, setData] = useState(() => read(key));
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const persist = useCallback(next => {
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { throw new Error('Browser storage is full or unavailable. Previous saved vault is unchanged.'); }
    setData(next);
  }, [key]);
  const sync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setSyncing(true); setError('');
    try {
      const { data: { session } } = await sb.auth.getSession();
      const response = await fetch('/api/sync-vault', {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}, signal: AbortSignal.timeout(120000),
      });
      const payload = await response.json().catch(() => { throw new Error('Sync API unavailable. Restart npm run dev or redeploy to Vercel.'); });
      if (!response.ok) {
        const delay = response.headers.get('Retry-After');
        throw new Error(`${payload.error || 'Sync failed.'}${delay ? ` Retry in ${delay} seconds.` : ''}`);
      }
      if (!Array.isArray(payload)) throw new Error('Unexpected vault response.');
      if (mounted.current) persist({ ...read(key), schemaVersion: 2, notes: payload, syncedAt: response.headers.get('X-Vault-Synced-At') || new Date().toISOString() });
    } catch (e) { if (mounted.current) setError(e.message); }
    finally { busy.current = false; if (mounted.current) setSyncing(false); }
  }, [key, persist]);
  useEffect(() => {
    // Refresh on visit if stale, then every 15 minutes while this view is open.
    if (data.schemaVersion !== 2 || !data.syncedAt || Date.now() - Date.parse(data.syncedAt) > 15 * 60000) sync();
    const interval = setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 15 * 60000);
    return () => clearInterval(interval);
  }, [sync]);
  function saveTargets(track, text) {
    try {
      const targets = [...new Set(text.split('\n').map(s => s.trim()).filter(Boolean))];
      persist({ ...data, targets: { ...data.targets, [track]: targets } });
      setError('');
    } catch (e) { setError(e.message); }
  }
  return { ...data, syncing, error, sync, saveTargets };
}
