import { useState, useEffect, useCallback, useRef } from 'react';
import { sb } from '../lib/supabase';
import { normalizeImport } from '../utils/importNormalizer';

export function useUserData(userId) {
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [username, setUsername] = useState('');
  const [initialized, setInitialized] = useState(null); // null=loading, false=needs onboarding, true=ready
  const [saveText, setSaveText] = useState('Loading…');

  const sectionsRef = useRef([]);
  const progressRef = useRef({});
  const saveTimerRef = useRef(null);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!userId) return;
    sb.from('tracker_progress')
      .select('sections, progress, username')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const s = data.sections || [];
          const p = data.progress || {};
          setSections(s);
          setProgress(p);
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
      if (val) next[id] = true; else delete next[id];
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
        const { sections: s, progress: p } = normalizeImport(parsed);
        setSections(s);
        setProgress(p);
        persist(s, p);
        onSuccess?.();
      } catch (_) {
        alert('Could not read that file.');
      }
    };
    reader.readAsText(file);
  }, [persist]);

  return {
    sections, progress, username, initialized, saveText,
    toggle, update, setupUser, saveUsername, resetAll, exportProgress, importBackup,
  };
}
