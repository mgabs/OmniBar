/* ─────────────────────────────────────────────
   OmniBar — Pure Default Page Core
   Zero DOM / chrome.* dependencies.
───────────────────────────────────────────── */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.OmniBarDefaultPage = api;
})(globalThis, function () {
  /**
   * Resolve the default app object matching `defaultAppId`, or null.
   * @param {Array<{id: string, name: string, url: string}>} apps
   * @param {string | null | undefined} defaultAppId
   * @returns {{id: string, name: string, url: string} | null}
   */
  function resolveDefaultApp(apps, defaultAppId) {
    if (!Array.isArray(apps) || !defaultAppId) return null;
    return apps.find(app => app.id === defaultAppId) || null;
  }

  /**
   * Reconcile `defaultAppId` against `apps`, returning `null` if missing/stale.
   * @param {Array<{id: string, name: string, url: string}>} apps
   * @param {string | null | undefined} defaultAppId
   * @returns {string | null}
   */
  function reconcileDefaultAppId(apps, defaultAppId) {
    const match = resolveDefaultApp(apps, defaultAppId);
    return match ? match.id : null;
  }

  /**
   * Build ordered `<select>` option descriptors (`None` first, then `apps`).
   * @param {Array<{id: string, name: string, url: string}>} apps
   * @param {string | null | undefined} defaultAppId
   * @returns {Array<{value: string, label: string, selected: boolean}>}
   */
  function buildDefaultPageOptions(apps, defaultAppId) {
    const list = Array.isArray(apps) ? apps : [];
    const activeId = reconcileDefaultAppId(list, defaultAppId);
    const options = [{ value: '', label: 'None', selected: activeId === null }];
    for (const app of list) {
      options.push({
        value: app.id,
        label: app.name,
        selected: app.id === activeId
      });
    }
    return options;
  }

  return {
    resolveDefaultApp,
    reconcileDefaultAppId,
    buildDefaultPageOptions
  };
});
