import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVaultKind, vaultView } from '../src/utils/vaultView.js';

const notes = [
  { path: 'HLD/Cache.md', title: 'Cache', tags: ['redis'], kind: 'markdown' },
  { path: 'Legacy.md', title: 'Legacy', tags: [] },
  { path: 'Design.excalidraw.md', title: 'Design', tags: ['architecture'], kind: 'excalidraw' },
];

test('fresh and legacy filters default to drawings; valid filters remain selectable', () => {
  for (const value of [undefined, null, '', 'all', 'unknown']) {
    assert.equal(normalizeVaultKind(value), 'excalidraw');
    assert.deepEqual(vaultView(notes, value).visible, [notes[2]]);
  }
  assert.equal(normalizeVaultKind('notes'), 'markdown');
  assert.deepEqual(vaultView(notes, 'markdown').visible, notes.slice(0, 2));
  assert.deepEqual(vaultView(notes, 'excalidraw').visible, [notes[2]]);
});

test('switching filters and searching never preview a hidden item', () => {
  assert.equal(vaultView(notes, 'excalidraw', '', notes[0].path).selected, notes[2]);
  assert.equal(vaultView(notes, 'markdown', '', notes[2].path).selected, notes[0]);
  assert.equal(vaultView(notes, 'markdown', 'REDIS', notes[1].path).selected, notes[0]);
  assert.equal(vaultView(notes, 'excalidraw', 'architecture').selected, notes[2]);
  for (const kind of ['markdown', 'excalidraw']) {
    assert.deepEqual(vaultView(notes, kind, 'missing', notes[0].path), { visible: [], selected: undefined });
  }
});

test('reloads preserve visible selections and fall back when an item is removed', () => {
  assert.equal(vaultView([...notes], 'markdown', '', notes[1].path).selected, notes[1]);
  assert.equal(vaultView(notes.filter(n => n !== notes[1]), 'markdown', '', notes[1].path).selected, notes[0]);
  assert.deepEqual(vaultView([], 'excalidraw'), { visible: [], selected: undefined });
});
