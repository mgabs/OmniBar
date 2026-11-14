/* ─────────────────────────────────────────────
   OmniBar — Pure Frame Slot Manager
   Zero DOM / chrome.* dependencies.
───────────────────────────────────────────── */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.OmniBarFrameManager = api;
})(globalThis, function () {
  function idleSlot() {
    return { appId: null, url: '', status: 'idle' };
  }

  function createFrameState() {
    return {
      default: idleSlot(),
      transient: idleSlot()
    };
  }

  function cloneState(state) {
    return {
      default: { ...state.default },
      transient: { ...state.transient }
    };
  }

  function routeAppOpen(state, app, defaultAppId) {
    const nextState = cloneState(state);
    const slot = defaultAppId && app.id === defaultAppId ? 'default' : 'transient';
    const current = nextState[slot];

    if (slot === 'default' && current.appId === app.id && current.url === app.url && current.status !== 'idle') {
      return { slot, shouldLoad: false, nextState };
    }

    nextState[slot] = { appId: app.id, url: app.url, status: 'loading' };
    return { slot, shouldLoad: true, nextState };
  }

  function reconcileFramesOnChange(state, apps, nextDefaultAppId) {
    const nextState = cloneState(state);
    const byId = new Map((Array.isArray(apps) ? apps : []).map(a => [a.id, a]));

    let clearDefault = false;
    const def = nextState.default;
    if (def.appId !== null) {
      const match = def.appId === nextDefaultAppId ? byId.get(def.appId) : null;
      if (!match || match.url !== def.url) {
        clearDefault = true;
        nextState.default = idleSlot();
      }
    }

    let clearTransient = false;
    const tr = nextState.transient;
    if (tr.appId !== null) {
      const match = byId.get(tr.appId);
      if (!match || match.url !== tr.url) {
        clearTransient = true;
        nextState.transient = idleSlot();
      }
    }

    return { clearDefault, clearTransient, nextState };
  }

  return {
    createFrameState,
    routeAppOpen,
    reconcileFramesOnChange
  };
});
