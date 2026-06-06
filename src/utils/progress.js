export function secProgress(section, progress) {
  const items = section.items || [];
  const total = items.length;
  const done = items.filter(i => progress[i.id]).length;
  const hasWeightedCounts = items.some(i => i.n && i.n > 1);
  if (hasWeightedCounts) {
    const totalCount = items.reduce((a, i) => a + (i.n || 1), 0);
    const doneCount = items.filter(i => progress[i.id]).reduce((a, i) => a + (i.n || 1), 0);
    return {
      done, total,
      pct: totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0,
      label: `${doneCount}/${totalCount} ${section.unit || 'items'} · ${done}/${total} topics`,
    };
  }
  return {
    done, total,
    pct: total > 0 ? Math.round(done / total * 100) : 0,
    label: `${done}/${total} ${section.unit || 'items'}`,
  };
}

export function overallStats(sections, progress) {
  const allItems = (sections || []).flatMap(s => s.items || []);
  const total = allItems.length;
  const done = allItems.filter(i => progress[i.id]).length;
  return { total, done, pct: total > 0 ? Math.round(done / total * 100) : 0 };
}

export function countdown(targetDate = '2026-12-31') {
  const target = new Date(targetDate + 'T00:00:00');
  const now = new Date();
  const days = Math.max(0, Math.ceil((target - now) / 864e5));
  return { weeks: Math.floor(days / 7), days };
}
