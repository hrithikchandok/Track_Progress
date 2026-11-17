import { parseVaultNote, VaultError } from './vault.js';

const MAX_BYTES = 2500000;
const SHA = /^[a-f0-9]{40}$/;

export function validateSaveRequest({ path, sha, content }, folder = '') {
  if (typeof path !== 'string' || !/\.(md|excalidraw)$/i.test(path)
    || path.split('/').some(p => !p || p === '.' || p === '..')
    || (folder && !path.startsWith(`${folder}/`))) throw new VaultError('Invalid file path.', 400);
  if (typeof sha !== 'string' || !SHA.test(sha)) throw new VaultError('Missing file version. Sync the vault and try again.', 400);
  if (typeof content !== 'string') throw new VaultError('Missing file content.', 400);
  if (Buffer.byteLength(content) > MAX_BYTES) throw new VaultError('File exceeds the 2.5 MB save limit.', 413);
}

// Commits one edited vault file through the GitHub Contents API. `sha` is the
// blob the editor started from, so GitHub refuses the write (409) if the file
// changed in the meantime instead of silently overwriting it.
export async function saveVaultFile({ repo, folder = '', vault, token, path, sha, content, fetcher = fetch }) {
  if (!token) throw new VaultError('Editing is not configured. Set GITHUB_TOKEN (Contents: Read and write) and VAULT_OWNER_USER_ID on the server.', 503);
  validateSaveRequest({ path, sha, content }, folder);
  const isDrawing = /\.excalidraw$/i.test(path);

  // Validate before writing so a bad edit never reaches the repository.
  if (isDrawing) {
    let scene;
    try { scene = JSON.parse(content); } catch { throw new VaultError('Drawing is not valid JSON.', 422); }
    if (scene?.type !== 'excalidraw' || !Array.isArray(scene.elements)) throw new VaultError('Drawing is not an Excalidraw scene.', 422);
  } else {
    try { parseVaultNote(content, path, { repo, ref: 'HEAD', vault }); }
    catch { throw new VaultError('Invalid YAML frontmatter. Fix it and save again.', 422); }
  }

  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: `Bearer ${token}` };
  const repoRes = await fetcher(`https://api.github.com/repos/${repo}`, { headers, signal: AbortSignal.timeout(15000) });
  if (!repoRes.ok) throw new VaultError(repoRes.status === 404 ? 'Vault repository not found.' : `GitHub request failed (${repoRes.status}).`, 502);
  const { default_branch: branch } = await repoRes.json();

  const encoded = path.split('/').map(encodeURIComponent).join('/');
  const res = await fetcher(`https://api.github.com/repos/${repo}/contents/${encoded}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Edit ${path} via Prep Console`, content: Buffer.from(content, 'utf8').toString('base64'), sha, branch }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    if (res.status === 409 || (res.status === 422 && /sha/i.test(detail.message || ''))) {
      throw new VaultError('This file changed on GitHub since you opened it. Sync the vault, then re-apply your edit.', 409);
    }
    if (res.status === 401 || res.status === 403) throw new VaultError('GitHub refused the write. The token needs Contents: Read and write on this repository.', 502);
    if (res.status === 404) throw new VaultError('File not found on GitHub. Sync the vault and try again.', 404);
    throw new VaultError(`GitHub save failed (${res.status}).`, 502);
  }
  const { content: file, commit } = await res.json();
  const ref = commit.sha;
  if (isDrawing) {
    const note = parseVaultNote('', path, { repo, ref, vault });
    return { ...note, kind: 'excalidraw', title: path.split('/').pop().replace(/\.excalidraw$/i, ''), sha: file.sha, ref, size: file.size };
  }
  return { ...parseVaultNote(content, path, { repo, ref, vault }), sha: file.sha };
}
