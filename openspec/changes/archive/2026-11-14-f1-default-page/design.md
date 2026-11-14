# Architecture & Technical Design

## 1. Overview & Invariants
- **Overview**: Add a `Default Page` `<select>` section to the Settings modal in [sidebar.html](file:///Users/mmetawea/Workbench/OmniBar/sidebar.html), styled in [sidebar.css](file:///Users/mmetawea/Workbench/OmniBar/sidebar.css), wired through [sidebar.js](file:///Users/mmetawea/Workbench/OmniBar/sidebar.js), and backed by a small pure logic module `default-page.js` loaded as a classic script before `sidebar.js`.
- **Invariants**:
  1. `defaultAppId` is always `string | null` in `chrome.storage.local`.
  2. `defaultAppId` is never left pointing to a non-existent app after `removeApp`, `resetToDefaults`, or `importApps`.
  3. On first launch (when `apps` is not yet in `chrome.storage.local`), selecting a non-null `defaultAppId` also persists `apps` so `DEFAULT_APPS` IDs do not regenerate on next launch.
  4. `omnibar-apps.json` export/import format (`Array<{ id, name, url }>`) remains unchanged.

## 2. Domain Models, State & Interface Contracts

### Storage Schema (`chrome.storage.local`)
- `apps`: `Array<{ id: string, name: string, url: string }>` (existing)
- `defaultAppId`: `string | null` (new; absent or `null` means `None`)

### Pure Core Contract (`default-page.js`)
```js
// Exposed on globalThis.OmniBarDefaultPage and module.exports (for Node tests)
resolveDefaultApp(apps, defaultAppId)     // -> App | null
reconcileDefaultAppId(apps, defaultAppId) // -> string | null (null if defaultAppId not found in apps)
buildDefaultPageOptions(apps, defaultAppId) // -> Array<{ value: string, label: string, selected: boolean }>
```

### In-Memory State (`sidebar.js`)
- `let defaultAppId = null;`
- `const $defaultPageSelect = document.getElementById('settings-default-page');`

## 3. Architecture Diagram & Data Flow

```mermaid
flowchart LR
  UI["Settings Modal (#settings-default-page)"] -->|change event| Shell["sidebar.js (I/O Shell)"]
  Shell -->|pure calls| Core["default-page.js (Pure Core)"]
  Shell -->|get/set apps, defaultAppId| Storage["chrome.storage.local"]
  Launch["init()"] -->|single get(['apps','defaultAppId'])| Storage
  Launch -->|resolveDefaultApp| Core
  Core -->|matched App| Open["openApp(app)"]
```

## 4. Boundary Rules & Budgets
- **Pure Core vs. I/O Shell**:
  - `default-page.js` MUST have zero DOM access, zero `chrome.*` calls, and zero side effects.
  - `sidebar.js` owns all DOM updates (`renderDefaultPageSelect`), event listeners, `openApp(app)`, and `chrome.storage.local` reads/writes.
- **Concurrency, Latency & Resource Budgets**:
  - Single `chrome.storage.local.get(['apps', 'defaultAppId'])` in `init()` (matches `NFR-DEFAULT-1`).
  - `resolveDefaultApp`, `reconcileDefaultAppId`, and `buildDefaultPageOptions` run in `O(n)` over `apps` (`n` typically < 50).

## 5. Testing Strategy
1. **BDD Scenarios**: Map each `REQ-DEFAULT-*` scenario in `specs/default-page/spec.md` to deterministic unit/integration test cases.
2. **Unit Tests (>= 95% line & branch coverage)**: Test `default-page.js` across empty `apps`, null/undefined/stale `defaultAppId`, valid match, removal/reset/import reconciliation, and option ordering/selection.
3. **Mutation Testing (>= 95% kill score)**: Run mutation testing on `default-page.js` and kill or delete any surviving mutants.

## Review Gate
- [x] **Gate 2 Approval**: Architecture & design reviewed and approved by human before task breakdown.
