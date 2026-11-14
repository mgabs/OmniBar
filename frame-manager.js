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
  function createFrameState() {
    throw new Error('Not implemented');
  }

  function routeAppOpen(state, app, defaultAppId) {
    throw new Error('Not implemented');
  }

  function reconcileFramesOnChange(state, apps, nextDefaultAppId) {
    throw new Error('Not implemented');
  }

  return {
    createFrameState,
    routeAppOpen,
    reconcileFramesOnChange
  };
});
