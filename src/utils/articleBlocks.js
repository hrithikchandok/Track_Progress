import { genId } from './id';

// A block-based document model (Medium/Substack style). The article body is an
// ordered array of typed blocks, stored as JSONB.
export const BLOCK_TYPES = [
  { type: 'paragraph', label: 'Text', glyph: '¶' },
  { type: 'heading', label: 'Heading', glyph: 'H' },
  { type: 'image', label: 'Image', glyph: '🖼' },
  { type: 'code', label: 'Code', glyph: '</>' },
  { type: 'quote', label: 'Quote', glyph: '"' },
  { type: 'divider', label: 'Divider', glyph: '—' },
];

export function newBlock(type) {
  switch (type) {
    case 'heading': return { id: genId(), type, text: '' };
    case 'image': return { id: genId(), type, url: '', caption: '' };
    case 'code': return { id: genId(), type, code: '', lang: '' };
    case 'quote': return { id: genId(), type, text: '' };
    case 'divider': return { id: genId(), type };
    default: return { id: genId(), type: 'paragraph', text: '' };
  }
}

// First non-empty text, used as a list preview/excerpt.
export function excerpt(blocks = [], max = 140) {
  const b = blocks.find(x => (x.type === 'paragraph' || x.type === 'heading' || x.type === 'quote') && x.text?.trim());
  if (!b) return '';
  const t = b.text.trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}
