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

// Single source of truth for the deadline everything is measured against.
export const TARGET_DATE = '2026-12-31';

export function countdown(targetDate = TARGET_DATE) {
  const target = new Date(targetDate + 'T00:00:00');
  const now = new Date();
  const days = Math.max(0, Math.ceil((target - now) / 864e5));
  return { weeks: Math.floor(days / 7), days };
}

// Items per day needed to finish `remaining` items by the target date.
export function requiredPace(remaining, targetDate = TARGET_DATE) {
  if (remaining <= 0) return null;
  const { days } = countdown(targetDate);
  if (days <= 0) return { remaining, days: 0, perDay: remaining, overdue: true };
  return { remaining, days, perDay: remaining / days, overdue: false };
}

export function getDailyLogs(progress) {
  return progress.__d || {};
}

export function getCompletionLogs(progress) {
  return progress.__c || {};
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // How many days has tracking actually been active? Averaging over a fixed 7
  // would understate the rate when there are fewer than 7 days of history
  // (e.g. 2 done today reads as 2/7 ≈ 0.3/day instead of 2/day), pushing the
  // ETA absurdly far out. Divide by the elapsed window instead (1..7 days).
  const dates = Object.keys(dailyLogs).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
  if (!dates.length) return 0;
  const earliest = new Date(dates.sort()[0] + 'T00:00:00');
  const daysSinceFirst = Math.floor((today - earliest) / 864e5) + 1; // inclusive
  const window = Math.min(7, Math.max(1, daysSinceFirst));

  let total = 0;
  const d = new Date(today);
  for (let i = 0; i < window; i++) {
    total += dailyLogs[localKey(d)] || 0;
    d.setDate(d.getDate() - 1);
  }
  return total / window;
}

export function getHeatmapData(dailyLogs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Default to a trailing year, but extend further back if there's older
  // activity so the heatmap shows all history rather than a fixed window.
  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  const dates = Object.keys(dailyLogs).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
  if (dates.length) {
    const earliest = new Date(dates.sort()[0] + 'T00:00:00');
    if (earliest < start) start.setTime(earliest.getTime());
  }

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
