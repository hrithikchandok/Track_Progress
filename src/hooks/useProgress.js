import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SECTIONS } from '../data/sections';
import { SYNC, STORAGE_KEY } from '../data/sync';

const allItems = SECTIONS.flatMap(s => s.items);

const SYNC_ON = SYNC.enabled && !SYNC.url.includes('YOUR-');

const store = {
  async load() {
    try {
      if (window.storage) {
        const r = await window.storage.get(STORAGE_KEY);
        return r?.value ? JSON.parse(r.value) : {};
      }
    } catch (_) {}
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v ? JSON.parse(v) : {};
    } catch (_) { return {}; }
  },
  async save(data) {
    const json = JSON.stringify(data);
    try {
      if (window.storage) { await window.storage.set(STORAGE_KEY, json); return true; }
    } catch (_) {}
    try { localStorage.setItem(STORAGE_KEY, json); return true; } catch (_) { return false; }
  },
  async clear() {
    try { if (window.storage) await window.storage.delete(STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  },
};

export function dsaProblems(progress) {
  const s = SECTIONS[0];
  const done = s.items.filter(i => progress[i.id]).reduce((a, i) => a + i.n, 0);
  return { done, total: 150 };
}

export function secProgress(s, progress) {
  const total = s.items.length;
  const done = s.items.filter(i => progress[i.id]).length;
  if (s.id === 'dsa') {
    const p = dsaProblems(progress);
    return {
      done, total,
      pct: Math.round(p.done / p.total * 100),
      label: `${p.done}/150 problems · ${done}/${total} topics`,
    };
  }
  return {
    done, total,
    pct: total ? Math.round(done / total * 100) : 0,
    label: `${done}/${total} ${s.unit}`,
  };
}

export function overallStats(progress) {
  const total = allItems.length;
  const done = allItems.filter(i => progress[i.id]).length;
  return { total, done, pct: Math.round(done / total * 100) };
}

export function countdown() {
  const target = new Date('2026-12-31T00:00:00');
  const now = new Date();
  const days = Math.max(0, Math.ceil((target - now) / 864e5));
  return { weeks: Math.floor(days / 7), days };
}

export function useProgress() {
  const [progress, setProgress] = useState({});
  const [canEdit, setCanEdit] = useState(!SYNC_ON);
  const [saveText, setSaveText] = useState('Loading…');
  const sbRef = useRef(null);
  const saveTimerRef = useRef(null);
  const canEditRef = useRef(!SYNC_ON);

  const getIdleText = useCallback((editing) => {
    if (!SYNC_ON) return 'All changes saved';
    return editing ? 'Synced · edit mode' : 'Live view';
  }, []);

  const remoteSave = useCallback(async (data) => {
    if (!sbRef.current) return false;
    const { error } = await sbRef.current
      .from('tracker_progress')
      .upsert({ id: SYNC.rowId, data, updated_at: new Date().toISOString() });
    return !error;
  }, []);

  const persist = useCallback(async (data, editing) => {
    setSaveText('Saving…');
    const ok = SYNC_ON ? await remoteSave(data) : await store.save(data);
    if (ok) {
      setSaveText('Saved');
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveText(getIdleText(editing)), 1200);
    } else {
      setSaveText('Save failed — retry');
    }
  }, [remoteSave, getIdleText]);

  const toggle = useCallback((id, val) => {
    if (SYNC_ON && !canEdit) return;
    setProgress(prev => {
      const next = { ...prev };
      if (val) next[id] = true; else delete next[id];
      persist(next, canEdit);
      return next;
    });
  }, [canEdit, persist]);

  const resetProgress = useCallback(async () => {
    if (SYNC_ON && !canEdit) return;
    if (!confirm('Reset all progress? This clears every checkbox.')) return;
    const empty = {};
    setProgress(empty);
    if (SYNC_ON) await remoteSave(empty); else await store.clear();
  }, [canEdit, remoteSave]);

  const exportProgress = useCallback(() => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [progress]);

  const importProgress = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result) || {};
        setProgress(data);
        persist(data, canEdit);
      } catch (_) {
        alert('Could not read that file.');
      }
    };
    reader.readAsText(file);
  }, [canEdit, persist]);

  const signIn = useCallback(async (email, password) => {
    if (!sbRef.current) return { error: { message: 'Supabase not initialized' } };
    const { error } = await sbRef.current.auth.signInWithPassword({ email, password });
    if (!error) { canEditRef.current = true; setCanEdit(true); }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (sbRef.current) await sbRef.current.auth.signOut();
    canEditRef.current = false;
    setCanEdit(false);
  }, []);

  useEffect(() => {
    async function init() {
      if (SYNC_ON) {
        sbRef.current = createClient(SYNC.url, SYNC.anonKey);
        try {
          const { data } = await sbRef.current.auth.getSession();
          const editing = !!(data && data.session);
          canEditRef.current = editing;
          setCanEdit(editing);
          const { data: row } = await sbRef.current
            .from('tracker_progress')
            .select('data')
            .eq('id', SYNC.rowId)
            .maybeSingle();
          const loaded = row?.data || {};
          setProgress(loaded);
          setSaveText(getIdleText(editing));

          // realtime for viewers
          sbRef.current.channel('progress-' + SYNC.rowId)
            .on('postgres_changes', {
              event: '*', schema: 'public', table: 'tracker_progress',
              filter: 'id=eq.' + SYNC.rowId,
            }, payload => {
              if (canEditRef.current) return;
              const d = payload.new?.data;
              if (d) setProgress(d);
            })
            .subscribe();
        } catch (e) {
          console.warn(e);
          setCanEdit(false);
          setSaveText('Live view');
        }
      } else {
        const data = await store.load();
        setProgress(data);
        setSaveText('All changes saved');
        setCanEdit(true);
      }
    }
    init();
    return () => { clearTimeout(saveTimerRef.current); };
  }, [getIdleText]);

  return {
    progress,
    canEdit,
    saveText,
    syncOn: SYNC_ON,
    toggle,
    resetProgress,
    exportProgress,
    importProgress,
    signIn,
    signOut,
  };
}
