export function normalizeVaultKind(kind) {
  return kind === 'markdown' || kind === 'notes' ? 'markdown' : 'excalidraw';
}

export function vaultView(notes, kind, search = '', path) {
  const filter = normalizeVaultKind(kind);
  const visible = notes.filter(n => (n.kind || 'markdown') === filter
    && `${n.title} ${n.path} ${n.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return { visible, selected: visible.find(n => n.path === path) || visible[0] };
}
