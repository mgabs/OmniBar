const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  createFrameState,
  routeAppOpen,
  reconcileFramesOnChange
} = require('../frame-manager.js');

const CLAUDE = { id: 'claude', name: 'Claude', url: 'https://claude.ai/new' };
const GEMINI = { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' };

describe('frame-manager', () => {
  it('createFrameState returns idle default and transient slots', () => {
    assert.deepEqual(createFrameState(), {
      default: { appId: null, url: '', status: 'idle' },
      transient: { appId: null, url: '', status: 'idle' }
    });
  });

  it('routeAppOpen loads default app once and reuses warm slot without reload', () => {
    const s0 = createFrameState();
    const r1 = routeAppOpen(s0, CLAUDE, 'claude');
    assert.equal(r1.slot, 'default');
    assert.equal(r1.shouldLoad, true);
    assert.deepEqual(r1.nextState.default, { appId: 'claude', url: CLAUDE.url, status: 'loading' });

    // Switch to transient app; default stays warm
    const sLoaded = { ...r1.nextState, default: { ...r1.nextState.default, status: 'loaded' } };
    const r2 = routeAppOpen(sLoaded, GEMINI, 'claude');
    assert.equal(r2.slot, 'transient');
    assert.equal(r2.shouldLoad, true);
    assert.equal(r2.nextState.default.status, 'loaded');
    assert.equal(r2.nextState.transient.appId, 'gemini');

    // Switch back to default app; shouldLoad is false
    const r3 = routeAppOpen(r2.nextState, CLAUDE, 'claude');
    assert.equal(r3.slot, 'default');
    assert.equal(r3.shouldLoad, false);
    assert.equal(r3.nextState.default.status, 'loaded');
  });

  it('reconcileFramesOnChange clears stale or url-changed slots', () => {
    const state = {
      default: { appId: 'claude', url: 'https://claude.ai/new', status: 'loaded' },
      transient: { appId: 'gemini', url: 'https://gemini.google.com', status: 'loaded' }
    };

    // Unchanged
    const same = reconcileFramesOnChange(state, [CLAUDE, GEMINI], 'claude');
    assert.equal(same.clearDefault, false);
    assert.equal(same.clearTransient, false);

    // Default changed to gemini, transient removed
    const changed = reconcileFramesOnChange(state, [CLAUDE], 'gemini');
    assert.equal(changed.clearDefault, true);
    assert.equal(changed.clearTransient, true);
    assert.deepEqual(changed.nextState, createFrameState());

    // Default URL edited
    const edited = reconcileFramesOnChange(
      state,
      [{ ...CLAUDE, url: 'https://claude.ai/chats' }, GEMINI],
      'claude'
    );
    assert.equal(edited.clearDefault, true);
    assert.equal(edited.clearTransient, false);
  });
});
