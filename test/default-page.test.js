const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveDefaultApp,
  reconcileDefaultAppId,
  buildDefaultPageOptions
} = require('../default-page.js');

const APPS = [
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' }
];

describe('resolveDefaultApp', () => {
  it('returns matching app when defaultAppId exists in apps', () => {
    assert.deepEqual(resolveDefaultApp(APPS, 'gemini'), APPS[1]);
  });

  it('returns null for null, undefined, or empty defaultAppId', () => {
    assert.equal(resolveDefaultApp(APPS, null), null);
    assert.equal(resolveDefaultApp(APPS, undefined), null);
    assert.equal(resolveDefaultApp(APPS, ''), null);
  });

  it('returns null when defaultAppId is stale (not in apps)', () => {
    assert.equal(resolveDefaultApp(APPS, 'missing-id'), null);
  });

  it('returns null when apps is empty or not an array', () => {
    assert.equal(resolveDefaultApp([], 'claude'), null);
    assert.equal(resolveDefaultApp(null, 'claude'), null);
  });
});

describe('reconcileDefaultAppId', () => {
  it('preserves defaultAppId when app exists in apps', () => {
    assert.equal(reconcileDefaultAppId(APPS, 'claude'), 'claude');
  });

  it('returns null when defaultAppId is removed or missing after import', () => {
    assert.equal(reconcileDefaultAppId(APPS, 'deleted-id'), null);
  });

  it('returns null for null, undefined, empty string, or non-array apps', () => {
    assert.equal(reconcileDefaultAppId(APPS, null), null);
    assert.equal(reconcileDefaultAppId(APPS, undefined), null);
    assert.equal(reconcileDefaultAppId(APPS, ''), null);
    assert.equal(reconcileDefaultAppId([], 'claude'), null);
    assert.equal(reconcileDefaultAppId(undefined, 'claude'), null);
  });
});

describe('buildDefaultPageOptions', () => {
  it('places None first and marks it selected when defaultAppId is unset', () => {
    assert.deepEqual(buildDefaultPageOptions(APPS, null), [
      { value: '', label: 'None', selected: true },
      { value: 'claude', label: 'Claude', selected: false },
      { value: 'gemini', label: 'Gemini', selected: false }
    ]);
  });

  it('marks matching app selected and None unselected when defaultAppId is valid', () => {
    assert.deepEqual(buildDefaultPageOptions(APPS, 'gemini'), [
      { value: '', label: 'None', selected: false },
      { value: 'claude', label: 'Claude', selected: false },
      { value: 'gemini', label: 'Gemini', selected: true }
    ]);
  });

  it('falls back to None selected when defaultAppId is stale', () => {
    assert.deepEqual(buildDefaultPageOptions(APPS, 'stale'), [
      { value: '', label: 'None', selected: true },
      { value: 'claude', label: 'Claude', selected: false },
      { value: 'gemini', label: 'Gemini', selected: false }
    ]);
  });

  it('returns only None when apps is empty or non-array', () => {
    assert.deepEqual(buildDefaultPageOptions([], 'claude'), [
      { value: '', label: 'None', selected: true }
    ]);
    assert.deepEqual(buildDefaultPageOptions(null, 'claude'), [
      { value: '', label: 'None', selected: true }
    ]);
  });
});
