# Research & Technical Tradeoffs

## 1. Intent & Ground Truth
- **Goal**: Allow the user to configure a default page in Settings so that every time the OmniBar side panel launches, it automatically opens that page instead of starting closed.
- **Confirmed User Choice** (from exploration): Options in Settings should be `None` (no auto-open) plus the user's configured apps (no "resume last opened" mode).
- **Verified Codebase Facts**:
  - Extension stack: vanilla HTML/CSS/JS Chrome MV3 extension (`manifest.json`, `background.js`, `sidebar.html`, `sidebar.css`, `sidebar.js`). No external runtime dependencies or build step.
  - `init()` in `sidebar.js` (lines 43–66) loads `apps` via `chrome.storage.local.get('apps')`, falls back to `DEFAULT_APPS` (whose `id`s are generated via `uid()` at module load if not yet persisted), calls `renderStrip()` and `bindListeners()`, and leaves `panelOpen = false` / `activeId = null` (`#content-panel` hidden).
  - `openApp(app)` in `sidebar.js` (lines 147–197) activates an app, updates title/header, loads `app.url` into `#app-frame`, and calls `renderStrip()`.
  - Settings modal in `sidebar.html` (lines 104–170) has `App Data`, `Keyboard Shortcut`, and `How to Use` sections. `openSettings()` in `sidebar.js` (line 296) simply removes `.hidden` from `#settings-overlay`.
  - `removeApp(id)`, `resetToDefaults()`, and `importApps(file)` in `sidebar.js` mutate `apps` and call `save()`, which only writes `{ apps }` to `chrome.storage.local`.
  - `openspec/specs/` currently contains no existing specs.

## 2. Options Explored

### Option A: Separate `defaultAppId` key in `chrome.storage.local` + `<select>` in Settings
Store `defaultAppId: string | null` separately from `apps` in `chrome.storage.local`. Populate a `<select>` in the Settings modal from `apps` on `openSettings()`. On change, save `defaultAppId` (and persist `apps` if not yet stored so `DEFAULT_APPS` IDs remain stable across launches). In `init()`, if `defaultAppId` matches an app in `apps`, call `openApp(app)`. Clear `defaultAppId` to `null` when that app is removed, reset, or missing after import.
- **Pros**: Zero changes to `apps` item schema or `omnibar-apps.json` export/import format; trivial rollback; no `O(n)` scan to enforce single-default invariant.
- **Cons**: Must keep `defaultAppId` in sync on `removeApp`, `resetToDefaults`, and `importApps` (3 small call sites).

### Option B: `isDefault: boolean` flag on each app object in `apps`
Add an optional `isDefault` property to app objects in `apps` and clear it across all other apps when setting a new default.
- **Pros**: Automatically deleted when `removeApp` / `resetToDefaults` / `importApps` replaces `apps`.
- **Cons**: Pollutes the `apps` data model and `omnibar-apps.json` export/import schema; requires enforcing single-true invariant across the array.

### Option C: `defaultAppId` + "Last Opened" sentinel mode
Same as Option A, plus a `'__last__'` sentinel that persists `lastAppId` on every `openApp()` / `closePanel()`.
- **Pros**: Covers "resume last session" use case.
- **Cons**: Explicitly out of scope per user preference (Option 1 chosen); adds extra storage writes on every panel toggle.

## 3. Tradeoff Matrix

| Criteria | Option A (`defaultAppId` key) | Option B (`isDefault` on app) | Option C (`defaultAppId` + Last) |
| :--- | :--- | :--- | :--- |
| **Complexity** | Low (1 storage key, 1 `<select>`) | Medium (array invariant + schema) | Medium (extra sentinel + toggle writes) |
| **New Dependencies** | None | None | None |
| **Performance & Latency** | Negligible (single `storage.local.get(['apps', 'defaultAppId'])`) | Negligible | Slightly more `storage.local.set` calls |
| **Maintenance Burden** | Low (3 explicit cleanup guards) | Medium (export/import compatibility) | Medium |
| **Blast Radius** | `sidebar.html`, `sidebar.css`, `sidebar.js` only | Also changes `omnibar-apps.json` schema | Same as A + `openApp`/`closePanel` |

## 4. Recommendation
Adopt **Option A (`defaultAppId` in `chrome.storage.local` + `<select>` in Settings)**. It is YAGNI-minimal, preserves the existing `omnibar-apps.json` export/import schema, and cleanly handles `DEFAULT_APPS` persistence and app removal/reset edge cases.

## 5. Breaking Changes & Deprecations
None. `openspec/specs/` has no existing requirements, and the `apps` / `omnibar-apps.json` format remains unchanged.

## Review Gate
- [x] **Gate 0 Decision**: A
