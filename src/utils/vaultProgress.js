export function vaultStats(notes, track, targets = []) {
  const items = notes.filter(n => n.track === track);
  const normalized = s => s.trim().toLowerCase();
  const unique = [...new Set(targets.map(normalized))];
  const created = unique.filter(t => items.some(n => normalized(n.title) === t || normalized(n.path) === t)).length;
  const scored = items.filter(n => [1, 2, 3].includes(n.confidence));
  return { items, created, total: unique.length, pct: unique.length ? Math.round(created / unique.length * 100) : null,
    completed: items.filter(n => ['ready', 'revised'].includes(n.status)).length,
    confidence: scored.length ? (scored.reduce((sum, n) => sum + n.confidence, 0) / scored.length).toFixed(1) : null };
}

export function revisionQueue(notes, now = Date.now()) {
  const days = { 1: 1, 2: 7, 3: 30 };
  return notes.filter(n => n.track && n.status !== 'draft')
    .map(n => ({ ...n, due: n.lastRevised ? Date.parse(n.lastRevised) + days[n.confidence || 1] * 86400000 : 0 }))
    .filter(n => n.due <= now).sort((a, b) => a.due - b.due || (a.confidence || 0) - (b.confidence || 0));
}
