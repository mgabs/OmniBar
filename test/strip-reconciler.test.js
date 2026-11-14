const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { diffStripApps } = require('../strip-reconciler.js');

const A = { id: 'a', name: 'Claude', url: 'https://claude.ai/new' };
const B = { id: 'b', name: 'Gemini', url: 'https://gemini.google.com' };
const C = { id: 'c', name: 'ChatGPT', url: 'https://chatgpt.com' };

describe('diffStripApps', () => {
  it('marks all apps as toCreate when prevApps is empty', () => {
    assert.deepEqual(diffStripApps([], [A, B]), {
      orderedIds: ['a', 'b'],
      toCreate: [A, B],
      toUpdate: [],
      toRemoveIds: []
    });
  });

  it('returns no creates/updates/removes when apps are unchanged or only reordered', () => {
    assert.deepEqual(diffStripApps([A, B], [A, B]), {
      orderedIds: ['a', 'b'],
      toCreate: [],
      toUpdate: [],
      toRemoveIds: []
    });

    assert.deepEqual(diffStripApps([A, B], [B, A]), {
      orderedIds: ['b', 'a'],
      toCreate: [],
      toUpdate: [],
      toRemoveIds: []
    });
  });

  it('detects edited name/url, added apps, and removed apps', () => {
    const B_edited = { id: 'b', name: 'Gemini Pro', url: 'https://gemini.google.com' };
    const A_url = { id: 'a', name: 'Claude', url: 'https://claude.ai' };
    assert.deepEqual(diffStripApps([A, B], [B_edited, C]), {
      orderedIds: ['b', 'c'],
      toCreate: [C],
      toUpdate: [B_edited],
      toRemoveIds: ['a']
    });
    assert.deepEqual(diffStripApps([A], [A_url]), {
      orderedIds: ['a'],
      toCreate: [],
      toUpdate: [A_url],
      toRemoveIds: []
    });
  });

  it('handles non-array inputs gracefully', () => {
    assert.deepEqual(diffStripApps(null, null), {
      orderedIds: [],
      toCreate: [],
      toUpdate: [],
      toRemoveIds: []
    });
  });
});
