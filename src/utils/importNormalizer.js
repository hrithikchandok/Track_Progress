import { PRESET_COLORS } from '../data/sections';

export function normalizeImport(parsed) {
  const rawSections = parsed.sections || [];
  // Start from any existing progress map, or build one from item.completed flags
  const progress = { ...(parsed.progress || {}) };

  const sections = rawSections.map((s, idx) => {
    const items = (s.items || []).map(item => {
      const normalized = {
        id: item.id,
        text: item.text ?? item.title ?? item.name ?? '',
      };
      if (item.meta)  normalized.meta  = item.meta;
      if (item.n > 1) normalized.n     = item.n;
      if (item.group) normalized.group = item.group;

      // item.completed: true  →  add to progress map
      if (item.completed === true) progress[item.id] = true;

      return normalized;
    });

    return {
      id:    s.id    || `section-${idx}`,
      title: s.title || s.name || `Section ${idx + 1}`,
      sub:   s.sub   || s.subtitle || '',
      unit:  s.unit  || 'items',
      color: s.color || PRESET_COLORS[idx % PRESET_COLORS.length],
      track: (s.track || s.id || `section-${idx}`).toString(),
      sup:   s.sup   || false,
      items,
    };
  });

  return { sections, progress };
}
