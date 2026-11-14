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
    const prev = Array.isArray(prevApps) ? prevApps : [];
    const next = Array.isArray(nextApps) ? nextApps : [];

    const prevById = new Map(prev.map(app => [app.id, app]));
    const nextIds = new Set(next.map(app => app.id));

    const orderedIds = [];
    const toCreate = [];
    const toUpdate = [];
    const toRemoveIds = [];

    for (const app of next) {
      orderedIds.push(app.id);
      const old = prevById.get(app.id);
      if (!old) {
        toCreate.push(app);
      } else if (old.name !== app.name || old.url !== app.url) {
        toUpdate.push(app);
      }
    }

    for (const app of prev) {
      if (!nextIds.has(app.id)) {
        toRemoveIds.push(app.id);
      }
    }

    return { orderedIds, toCreate, toUpdate, toRemoveIds };
  }

  return { diffStripApps };
});
