import { useState, useEffect, useCallback, useRef } from 'react';
import { sb } from '../lib/supabase';
import { normalizeImport } from '../utils/importNormalizer';
import { genId } from '../utils/id';
import { getDailyLogs, todayKey } from '../utils/progress';

export function useUserData(userId) {
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [username, setUsername] = useState('');
  const [initialized, setInitialized] = useState(null); // null=loading, false=needs onboarding, true=ready
  const [saveText, setSaveText] = useState('Loading…');

  const sectionsRef = useRef([]);
  const progressRef = useRef({});
  const saveTimerRef = useRef(null);

  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => {
    if (!userId) return;
    sb.from('tracker_progress')
      .select('sections, progress, username')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSections(data.sections || []);
          setProgress(data.progress || {});
          setUsername(data.username || '');
          setInitialized(true);
          setSaveText('All changes saved');
        } else {
          setInitialized(false);
        }
      });
  }, [userId]);

  const persist = useCallback(async (newSections, newProgress) => {
    setSaveText('Saving…');
    const { error } = await sb.from('tracker_progress').upsert({
      id: userId,
      sections: newSections,
      progress: newProgress,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      setSaveText('Saved');
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveText('All changes saved'), 1200);
    } else {
      setSaveText('Save failed — retry');
    }
  }, [userId]);

  const toggle = useCallback((id, val) => {
    setProgress(prev => {
      const next = { ...prev };
      const prevVal = prev[id];

      if (typeof val === 'number') {
        if (val <= 0) delete next[id]; else next[id] = val;
      } else {
        if (val) next[id] = true; else delete next[id];
      }

      // Record daily activity for forward progress only
      const isProgress = typeof val === 'number'
        ? val > (prevVal || 0)
        : (val && !prevVal);

      if (isProgress) {
        const key = todayKey();
        const logs = next.__d || {};
        next.__d = { ...logs, [key]: (logs[key] || 0) + 1 };
      }

      persist(sectionsRef.current, next);
      return next;
    });
  }, [persist]);

  const update = useCallback((newSections, newProgress) => {
    setSections(newSections);
    setProgress(newProgress);
    persist(newSections, newProgress);
  }, [persist]);

  const setupUser = useCallback(async ({ selectedSections, usernameStr }) => {
    const { error } = await sb.from('tracker_progress').insert({
      id: userId,
      sections: selectedSections,
      progress: {},
      username: usernameStr || null,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      setSections(selectedSections);
      setProgress({});
      setUsername(usernameStr || '');
      setInitialized(true);
      setSaveText('All changes saved');
    }
    return { error };
  }, [userId]);

  const saveUsername = useCallback(async (newUsername) => {
    const { error } = await sb.from('tracker_progress')
      .update({ username: newUsername || null, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (!error) setUsername(newUsername);
    return { error };
  }, [userId]);

  const resetAll = useCallback(async () => {
    if (!confirm('Delete all sections and progress? You will go back to the setup screen.')) return;
    await sb.from('tracker_progress').delete().eq('id', userId);
    setSections([]);
    setProgress({});
    setUsername('');
    setInitialized(false);
    setSaveText('');
  }, [userId]);

  const exportProgress = useCallback(() => {
    const blob = new Blob([JSON.stringify({ sections: sectionsRef.current, progress: progressRef.current }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const importBackup = useCallback((file, onSuccess) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.sections)) { alert('Invalid backup file — expected a "sections" array.'); return; }
        const { sections: importedSections, progress: importedProgress } = normalizeImport(parsed);
        const existingIds = new Set(sectionsRef.current.map(s => s.id));
        const deduped = importedSections.map(s => existingIds.has(s.id) ? { ...s, id: genId() } : s);
        const merged = [...sectionsRef.current, ...deduped];
        const mergedProgress = { ...progressRef.current, ...importedProgress };
        setSections(merged);
        setProgress(mergedProgress);
        persist(merged, mergedProgress);
        onSuccess?.();
      } catch (_) {
        alert('Could not read that file.');
      }
    };
    reader.readAsText(file);
  }, [persist]);

  const dailyLogs = getDailyLogs(progress);

  const interviews       = progress.__iv       || [];
  const applicationsCount = progress.__appCount || 0;

  const saveInterviews = useCallback((newInterviews) => {
    setProgress(prev => {
      const next = { ...prev, __iv: newInterviews };
      persist(sectionsRef.current, next);
      return next;
    });
  }, [persist]);

  const saveApplicationsCount = useCallback((count) => {
    setProgress(prev => {
      const next = { ...prev, __appCount: count };
      persist(sectionsRef.current, next);
      return next;
    });
  }, [persist]);

  // ── Today list ────────────────────────────────
  // Stored as { date: 'YYYY-MM-DD', ids: [...] }. Resets automatically each day.
  const todayRaw = progress.__today || {};
  const todayIds = todayRaw.date === todayKey() ? (todayRaw.ids || []) : [];

  const toggleTodayItem = useCallback((id) => {
    setProgress(prev => {
      const raw = prev.__today || {};
      const today = todayKey();
      const ids = raw.date === today ? (raw.ids || []) : [];
      const nextIds = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
      const next = { ...prev, __today: { date: today, ids: nextIds } };
      persist(sectionsRef.current, next);
      return next;
    });
  }, [persist]);

  const headerMeta = {
    role: progress.__role || '',
    kicker: progress.__kicker || '',
    company: progress.__company || '',
    summary: progress.__summary || '',
    pace: progress.__pace || '',
  };

  const updateHeaderMeta = useCallback((meta) => {
    setProgress(prev => {
      const next = { ...prev };
      if (meta.role !== undefined) next.__role = meta.role;
      if (meta.kicker !== undefined) next.__kicker = meta.kicker;
      if (meta.company !== undefined) next.__company = meta.company;
      if (meta.summary !== undefined) next.__summary = meta.summary;
      if (meta.pace !== undefined) next.__pace = meta.pace;
      persist(sectionsRef.current, next);
      return next;
    });
  }, [persist]);

  return {
    sections, progress, username, initialized, saveText, dailyLogs, headerMeta,
    interviews, applicationsCount, todayIds,
    toggle, update, setupUser, saveUsername, resetAll, exportProgress, importBackup, updateHeaderMeta,
    saveInterviews, saveApplicationsCount, toggleTodayItem,
  };
}
