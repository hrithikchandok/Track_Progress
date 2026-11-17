export function normalizeVaultKind(kind) {
  return kind === 'markdown' || kind === 'notes' ? 'markdown' : 'excalidraw';
}

export function vaultView(notes, kind, search = '', path) {
  const filter = normalizeVaultKind(kind);
  const visible = notes.filter(n => (n.kind || 'markdown') === filter
    && `${n.title} ${n.path} ${n.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return { visible, selected: visible.find(n => n.path === path) || visible[0] };
}

// Folder part of a vault path ('' for files at the vault root).
export function folderOf(path = '') {
  return path.split('/').slice(0, -1).join('/');
}
