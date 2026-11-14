/* ─────────────────────────────────────────────
   OmniBar — Pure Icon Strip Reconciler
   Zero DOM / chrome.* dependencies.
───────────────────────────────────────────── */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.OmniBarStripReconciler = api;
})(globalThis, function () {
  /**
   * Diff `prevApps` and `nextApps` by `app.id` for keyed DOM reconciliation.
   * @param {Array<{id: string, name: string, url: string}>} prevApps
   * @param {Array<{id: string, name: string, url: string}>} nextApps
   * @returns {{
   *   orderedIds: string[],
   *   toCreate: Array<{id: string, name: string, url: string}>,
   *   toUpdate: Array<{id: string, name: string, url: string}>,
   *   toRemoveIds: string[]
   * }}
   */
  function diffStripApps(prevApps, nextApps) {
    throw new Error('Not implemented');
  }

  return { diffStripApps };
});
