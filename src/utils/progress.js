function localKey(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function itemDone(item, progress) {
  if (item.type === 'link') return false;
  if (item.type === 'counter') return (progress[item.id] || 0) >= (item.target || 1);
  return !!progress[item.id];
}

export function secProgress(section, progress) {
  const items = (section.items || []).filter(i => i.type !== 'link');
  const total = items.length;
  const done = items.filter(i => itemDone(i, progress)).length;
  const hasWeightedCounts = items.some(i => i.n && i.n > 1);
  if (hasWeightedCounts) {
    const totalCount = items.reduce((a, i) => a + (i.n || 1), 0);
    const doneCount = items.filter(i => itemDone(i, progress)).reduce((a, i) => a + (i.n || 1), 0);
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
  const allItems = (sections || []).flatMap(s => s.items || []).filter(i => i.type !== 'link');
  const total = allItems.length;
  const done = allItems.filter(i => itemDone(i, progress)).length;
  return { total, done, pct: total > 0 ? Math.round(done / total * 100) : 0 };
}

export function countdown(targetDate = '2026-12-31') {
  const target = new Date(targetDate + 'T00:00:00');
  const now = new Date();
  const days = Math.max(0, Math.ceil((target - now) / 864e5));
  return { weeks: Math.floor(days / 7), days };
}

export function getDailyLogs(progress) {
  return progress.__d || {};
}

export function calcStreak(dailyLogs) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (!dailyLogs[localKey(d)]) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (dailyLogs[localKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function calcVelocity(dailyLogs) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  let total = 0;
  for (let i = 0; i < 7; i++) {
    total += dailyLogs[localKey(d)] || 0;
    d.setDate(d.getDate() - 1);
  }
  return total / 7;
}

export function getHeatmapData(dailyLogs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay()); // align to Sunday

  const weeks = [];
  let week = Array(7).fill(null);
  const cur = new Date(start);

  while (cur <= today) {
    const dow = cur.getDay();
    const key = localKey(cur);
    week[dow] = { date: key, count: dailyLogs[key] || 0 };
    if (dow === 6) { weeks.push(week); week = Array(7).fill(null); }
    cur.setDate(cur.getDate() + 1);
  }
  if (week.some(d => d !== null)) weeks.push(week);
  return weeks;
}

export function todayKey() {
  return localKey(new Date());
}
