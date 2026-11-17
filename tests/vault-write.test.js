import test from 'node:test';
import assert from 'node:assert/strict';
import { saveVaultFile, validateSaveRequest } from '../server/vaultWrite.js';
import saveHandler from '../api/vault-save.js';

const SHA = 'a'.repeat(40);
const base = { repo: 'owner/repo', vault: 'V', token: 't', sha: SHA };

function fakeGitHub(putStatus = 200, putBody = { content: { sha: 'b'.repeat(40), size: 9 }, commit: { sha: 'c'.repeat(40) } }) {
  const calls = [];
  const fetcher = async (url, opts = {}) => {
    calls.push({ url, opts });
    if (!opts.method) return { ok: true, status: 200, json: async () => ({ default_branch: 'main' }) };
    return { ok: putStatus === 200, status: putStatus, json: async () => putBody };
  };
  return { calls, fetcher };
}

test('save endpoint only accepts POST', async () => {
  const headers = {};
  const res = { setHeader(k, v) { headers[k] = v; }, status(c) { this.code = c; return this; }, json(v) { this.value = v; return this; } };
  await saveHandler({ method: 'GET', headers: {} }, res);
  assert.equal(res.code, 405);
  assert.equal(headers.Allow, 'POST');
});

test('rejects traversal, foreign extensions, and missing versions before calling GitHub', () => {
  for (const path of ['../x.md', 'a//b.md', 'notes/x.txt', './a.md']) {
    assert.throws(() => validateSaveRequest({ path, sha: SHA, content: '' }), /Invalid file path/);
  }
  assert.throws(() => validateSaveRequest({ path: 'a.md', sha: 'nope', content: '' }), /file version/);
  assert.throws(() => validateSaveRequest({ path: 'b.md', sha: SHA, content: 'x' }, 'Notes'), /Invalid file path/);
});

test('refuses to save without a write token', async () => {
  await assert.rejects(saveVaultFile({ ...base, token: undefined, path: 'a.md', content: '# A' }), /not configured/);
});

test('invalid drawings and frontmatter never reach GitHub', async () => {
  const { calls, fetcher } = fakeGitHub();
  await assert.rejects(saveVaultFile({ ...base, path: 'd.excalidraw', content: '{"type":"other"}', fetcher }), /not an Excalidraw/);
  await assert.rejects(saveVaultFile({ ...base, path: 'n.md', content: '---javascript\n1\n---\n', fetcher }), /frontmatter/);
  assert.equal(calls.length, 0);
});

test('commits Markdown with the starting sha and returns the refreshed note', async () => {
  const { calls, fetcher } = fakeGitHub();
  const note = await saveVaultFile({ ...base, path: 'Folder/My Note.md', content: '# Hi\n', fetcher });
  const put = calls.find(c => c.opts.method === 'PUT');
  assert.match(put.url, /contents\/Folder\/My%20Note\.md$/);
  const body = JSON.parse(put.opts.body);
  assert.equal(body.sha, SHA);
  assert.equal(body.branch, 'main');
  assert.equal(Buffer.from(body.content, 'base64').toString(), '# Hi\n');
  assert.equal(note.sha, 'b'.repeat(40));
  assert.equal(note.raw, '# Hi\n');
  assert.match(note.githubUrl, /blob\/c{40}\//);
});

test('a version conflict surfaces as 409 instead of overwriting', async () => {
  const { fetcher } = fakeGitHub(409, { message: 'conflict' });
  await assert.rejects(saveVaultFile({ ...base, path: 'a.md', content: 'x', fetcher }), e => e.status === 409);
});

test('drawings save as Excalidraw JSON with the new commit as ref', async () => {
  const { fetcher } = fakeGitHub();
  const note = await saveVaultFile({ ...base, path: 'Ex/D.excalidraw', content: JSON.stringify({ type: 'excalidraw', elements: [] }), fetcher });
  assert.equal(note.kind, 'excalidraw');
  assert.equal(note.ref, 'c'.repeat(40));
  assert.equal(note.title, 'D');
});
