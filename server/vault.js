import matter from 'gray-matter';

export function parseVaultNote(raw, path, { repo, ref, vault }) {
  // gray-matter also ships an executable JavaScript engine; accept YAML only.
  const opening = raw.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0];
  if (opening.startsWith('---') && !/^---\s*(yaml)?\s*$/.test(opening)) {
    throw new Error('Only YAML frontmatter is supported.');
  }
  const { data, content } = matter(raw, { engines: {
    javascript: () => { throw new Error('Executable frontmatter is disabled.'); },
  } });
  const basename = path.split('/').pop().replace(/\.md$/i, '');
  const inferred = /(^|[\s/_-])LLD([\s/_-]|$)/i.test(path) ? 'LLD'
    : /(^|[\s/_-])(HLD|System[ -]Design)([\s/_-]|$)/i.test(path) ? 'HLD' : null;
  const track = ['HLD', 'LLD'].includes(String(data.track).toUpperCase()) ? String(data.track).toUpperCase() : inferred;
  const date = data.lastRevised instanceof Date ? data.lastRevised.toISOString().slice(0, 10) : data.lastRevised;
  const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  return {
    id: `${repo}:${path}`, path,
    title: typeof data.title === 'string' && data.title.trim() ? data.title : basename,
    track, status: ['draft', 'ready', 'revised'].includes(data.status) ? data.status : 'draft',
    confidence: [1, 2, 3].includes(Number(data.confidence)) ? Number(data.confidence) : null,
    lastRevised: validDate ? date : null,
    tags: Array.isArray(data.tags) ? data.tags.filter(t => typeof t === 'string') : [],
    githubUrl: `https://github.com/${repo}/blob/${encodeURIComponent(ref)}/${path.split('/').map(encodeURIComponent).join('/')}`,
    obsidianUrl: `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(path.replace(/\.md$/i, ''))}`,
    content, raw,
  };
}

export class VaultError extends Error {
  constructor(message, status = 502, retryAfter = null) {
    super(message); this.status = status; this.retryAfter = retryAfter;
  }
}

export async function syncVault({ repo, folder = '', vault, token, fetcher = fetch }) {
  async function github(path) {
    const response = await fetcher(`https://api.github.com/repos/${repo}${path}`, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const retry = response.headers.get('retry-after');
      if (response.status === 429 || (response.status === 403 && (retry || response.headers.get('x-ratelimit-remaining') === '0'))) {
        const reset = Number(response.headers.get('x-ratelimit-reset'));
        throw new VaultError('GitHub rate limit reached. Try again after the indicated delay.', 429,
          Number(retry) || Math.max(60, Math.ceil(reset - Date.now() / 1000)) || 60);
      }
      throw new VaultError(response.status === 404 ? 'Vault repository or folder not found. Check repository settings and token access.'
        : response.status === 401 || response.status === 403 ? 'GitHub denied access. Check GITHUB_TOKEN permissions.'
        : `GitHub request failed (${response.status}).`, 502);
    }
    return response.json();
  }
  const repository = await github('');
  const branch = await github(`/commits/${encodeURIComponent(repository.default_branch)}`);
  const ref = branch.sha;
  let treeSha = branch.commit.tree.sha;
  // Resolve the folder first, so an unrelated large vault does not truncate its subtree.
  for (const segment of folder.split('/').filter(Boolean)) {
    const tree = await github(`/git/trees/${treeSha}`);
    if (tree.truncated) throw new VaultError('GitHub truncated the directory listing. Choose a smaller vault folder.');
    const entry = tree.tree.find(e => e.type === 'tree' && e.path === segment);
    if (!entry) throw new VaultError(`Vault folder not found: ${folder}`, 422);
    treeSha = entry.sha;
  }
  const tree = await github(`/git/trees/${treeSha}?recursive=1`);
  if (tree.truncated) throw new VaultError('GitHub truncated the vault tree. Set VAULT_FOLDER to a smaller folder.', 422);
  const files = tree.tree.filter(e => e.type === 'blob' && /\.md$/i.test(e.path));
  if (files.length > 500 || files.some(f => f.size > 500000) || files.reduce((n, f) => n + (f.size || 0), 0) > 2500000) {
    throw new VaultError('Vault exceeds sync limits (500 notes, 500 KB per note, 2.5 MB total). Set VAULT_FOLDER to a smaller folder.', 422);
  }
  const notes = [];
  // Bounded batches keep GitHub secondary limits and server memory under control.
  for (let i = 0; i < files.length; i += 5) {
    const batch = await Promise.all(files.slice(i, i + 5).map(async file => {
      const blob = await github(`/git/blobs/${file.sha}`);
      if (blob.encoding !== 'base64') throw new VaultError('GitHub returned an unsupported note encoding.');
      const path = [folder, file.path].filter(Boolean).join('/');
      try {
        return parseVaultNote(Buffer.from(blob.content, 'base64').toString('utf8'), path, { repo, ref, vault });
      } catch { throw new VaultError(`Invalid YAML frontmatter in ${path}. Fix this note and sync again.`, 422); }
    }));
    notes.push(...batch);
  }
  return notes.sort((a, b) => a.path.localeCompare(b.path));
}
