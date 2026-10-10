import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVaultNote, syncVault } from '../server/vault.js';
import { vaultStats, revisionQueue } from '../src/utils/vaultProgress.js';
import handler from '../api/sync-vault.js';

const config = { repo: 'owner/repo', ref: 'abc123', vault: 'My Vault' };
test('rejects executable frontmatter engines', () => {
  assert.throws(() => parseVaultNote('---javascript\n({title: "unsafe"})\n---\nBody', 'Note.md', config), /Only YAML/);
});
test('normalizes frontmatter while preserving the source and encoding deep links', () => {
  const raw = '---\ntitle: Rate Limiter\ntrack: HLD\nstatus: revised\nconfidence: 3\nlastRevised: 2026-10-11\ntags: [redis]\n---\n# Original\n';
  const note = parseVaultNote(raw, 'System-Design/Rate & Limit.md', config);
  assert.equal(note.raw, raw);
  assert.equal(note.content, '# Original\n');
  assert.equal(note.lastRevised, '2026-10-11');
  assert.equal(note.confidence, 3);
  assert.equal(note.obsidianUrl, 'obsidian://open?vault=My%20Vault&file=System-Design%2FRate%20%26%20Limit');
  assert.equal(note.githubUrl, 'https://github.com/owner/repo/blob/abc123/System-Design/Rate%20%26%20Limit.md');
});
test('plain Markdown is retained and invalid metadata never marks a note complete', () => {
  const plain = parseVaultNote('# Hello', 'LLD/Parking.md', config);
  assert.equal(plain.track, 'LLD'); assert.equal(plain.status, 'draft'); assert.equal(plain.confidence, null);
  const invalid = parseVaultNote('---\nconfidence: 9\nstatus: complete\nlastRevised: "2026-02-30"\n---\nText', 'Other.md', config);
  assert.equal(invalid.track, null); assert.equal(invalid.lastRevised, null); assert.equal(invalid.status, 'draft');
});
test('progress matches unique targets and revisions use confidence intervals', () => {
  const notes = [{ title: 'Rate Limiter', path: 'HLD/Rate.md', track: 'HLD', status: 'ready', confidence: 2, lastRevised: '2026-10-01' },
    { title: 'Draft', path: 'HLD/Draft.md', track: 'HLD', status: 'draft', confidence: null, lastRevised: null }];
  const stats = vaultStats(notes, 'HLD', ['rate limiter', 'Rate Limiter', 'Missing']);
  assert.equal(stats.pct, 50); assert.equal(stats.confidence, '2.0'); assert.equal(stats.completed, 1);
  assert.equal(vaultStats(notes, 'HLD').pct, null);
  assert.equal(revisionQueue(notes, Date.parse('2026-10-07')).length, 0);
  assert.equal(revisionQueue(notes, Date.parse('2026-10-08')).length, 1);
});
test('GitHub sync recurses into configured folder and fetches Markdown blobs only', async () => {
  const replies = [ { default_branch: 'main' }, { sha: 'commit', commit: { tree: { sha: 'root' } } },
    { tree: [{ type: 'tree', path: 'System-Design', sha: 'folder' }] },
    { tree: [{ type: 'blob', path: 'sub/Note.md', sha: 'note', size: 10 }, { type: 'blob', path: 'x.png', sha: 'image' }] },
    { encoding: 'base64', content: Buffer.from('# Note').toString('base64') } ];
  const urls = [];
  const notes = await syncVault({ repo: 'owner/repo', folder: 'System-Design', vault: 'Vault', fetcher: async url => {
    urls.push(url); return Response.json(replies.shift());
  } });
  assert.equal(notes.length, 1); assert.equal(notes[0].path, 'System-Design/sub/Note.md');
  assert.match(notes[0].githubUrl, /\/blob\/commit\//);
  assert.ok(urls.includes('https://api.github.com/repos/owner/repo/git/trees/folder?recursive=1'));
});
test('rate limits include a retry delay and incomplete trees fail', async () => {
  await assert.rejects(syncVault({ ...config, fetcher: async () => new Response('', { status: 403, headers: { 'x-ratelimit-remaining': '0', 'retry-after': '120' } }) }), e => e.status === 429 && e.retryAfter === 120);
  const replies = [{ default_branch: 'main' }, { sha: 'x', commit: { tree: { sha: 'y' } } }, { truncated: true, tree: [] }];
  await assert.rejects(syncVault({ ...config, fetcher: async () => Response.json(replies.shift()) }), /truncated/);
});
test('API rejects anonymous users and other accounts before contacting GitHub', async () => {
  const previousOwner = process.env.VAULT_OWNER_USER_ID;
  const previousFetch = globalThis.fetch;
  process.env.VAULT_OWNER_USER_ID = 'owner';
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.value = value; return this; } };
  try {
    await handler({ method: 'GET', headers: {} }, res);
    assert.equal(res.code, 401);
    globalThis.fetch = async url => { assert.match(url, /\/auth\/v1\/user$/); return Response.json({ id: 'someone-else' }); };
    await handler({ method: 'GET', headers: { authorization: 'Bearer test' } }, res);
    assert.equal(res.code, 403);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOwner === undefined) delete process.env.VAULT_OWNER_USER_ID; else process.env.VAULT_OWNER_USER_ID = previousOwner;
  }
});
