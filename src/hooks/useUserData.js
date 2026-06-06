import { useState, useEffect, useCallback, useRef } from 'react';
import { sb } from '../lib/supabase';

export function useUserData(userId) {
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [username, setUsername] = useState('');
  const [targetDate, setTargetDate] = useState('2026-12-31');
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
      .select('sections, progress, username, target_date')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const s = data.sections || [];
          const p = data.progress || {};
          setSections(s);
          setProgress(p);
          setUsername(data.username || '');
          setTargetDate(data.target_date || '2026-12-31');
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

  const setupUser = useCallback(async ({ selectedSections, usernameStr, date }) => {
    const { error } = await sb.from('tracker_progress').insert({
      id: userId,
      sections: selectedSections,
      progress: {},
      username: usernameStr || null,
      target_date: date || '2026-12-31',
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      setSections(selectedSections);
      setProgress({});
      setUsername(usernameStr || '');
      setTargetDate(date || '2026-12-31');
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

  const resetProgress = useCallback(() => {
    if (!confirm('Reset all progress? This clears every checkbox.')) return;
    const empty = {};
    setProgress(empty);
    persist(sectionsRef.current, empty);
  }, [persist]);

  const exportProgress = useCallback(() => {
    const blob = new Blob([JSON.stringify({ sections: sectionsRef.current, progress: progressRef.current }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const importBackup = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { sections: s, progress: p } = JSON.parse(reader.result);
        if (Array.isArray(s)) {
          setSections(s);
          setProgress(p || {});
          persist(s, p || {});
        } else {
          alert('Invalid backup file.');
        }
      } catch (_) {
        alert('Could not read that file.');
      }
    };
    reader.readAsText(file);
  }, [persist]);

  return {
    sections, progress, username, targetDate, initialized, saveText,
    toggle, update, setupUser, saveUsername, resetProgress, exportProgress, importBackup,
  };
}
