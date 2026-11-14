# Proposal

## Intent
Modernize OmniBar's visual design with Material Design 3 (M3) tokens in pure CSS (zero build step) while improving runtime responsiveness and MV3 state reliability through a warm default-app iframe, in-place icon strip patching, and `chrome.storage.session` panel state tracking.

## Problem Statement
OmniBar currently uses flat hardcoded hex colors and ad-hoc hover opacities that look dated, tears down and cold-reloads the active app iframe on every switch, wipes and rebuilds the entire icon strip DOM (`innerHTML = ''`) on every click or edit, and loses `openWindows` toggle state whenever Chrome suspends the MV3 service worker (compounded by `panel-closed` missing `windowId`).

## Capabilities

### New Capabilities
- `m3-theme`: Pure CSS Material Design 3 token system (surface hierarchy, state layers, typography, shape, motion, `prefers-color-scheme: light | dark`, `prefers-reduced-motion`, and token-backed toast classes).
- `warm-default-frame`: Dedicated persistent `#default-app-frame` for `defaultAppId` (kept warm across switches and `closePanel()`) paired with a single transient `#app-frame` for all other apps, with per-slot `loading | loaded | blocked` state and invalidation hooks.
- `strip-reconciliation`: O(1) in-place `.active` / `.edit-mode` class sync and keyed DOM reconciliation for the icon strip with dynamic `dataset.idx` drag-and-drop handling.
- `sw-panel-state`: Persist `openWindows` in `chrome.storage.session`, include `windowId` on `panel-closed` messages, and clean up on `chrome.windows.onRemoved`.

### Modified Capabilities
- `default-page`: Update auto-open target in `openspec/specs/default-page/spec.md` (`REQ-DEFAULT-3`) so the default app loads in `#default-app-frame` while keeping `#app-frame` for non-default apps.

## Scope

### In-Scope
- Migrate `sidebar.css` to M3 color/surface/state-layer/typography/shape/motion tokens (`light` and `dark` via `prefers-color-scheme`) and `prefers-reduced-motion`; replace inline `toast.style.background` in `sidebar.js` with CSS modifier classes.
- Add `#default-app-frame` alongside `#app-frame` in `sidebar.html`; route `defaultAppId` to `#default-app-frame` (kept warm on switch/`closePanel()`) and all other apps to `#app-frame` (cleared on switch/`closePanel()`), with per-slot `loadTimer` + `loading | loaded | blocked` state and invalidation on `defaultAppId` change, `urlChanged`, `removeApp`, `importApps`, and `resetToDefaults`.
- Refactor `renderStrip()` in `sidebar.js` into O(1) active/edit state sync and keyed DOM reconciliation, reading `Number(el.dataset.idx)` dynamically in drag/drop handlers.
- Persist `openWindows` in `chrome.storage.session` in `background.js` (preserving `chrome.sidePanel.open()` user-gesture handling), pass `windowId` on `panel-closed` in `sidebar.js`, and prune closed windows via `chrome.windows.onRemoved`.
- Extract pure zero-DOM UMD helpers for frame-slot routing/invalidation and strip reconciliation so core logic is unit-tested in Node.

### Out-of-Scope (YAGNI)
- Introducing a bundler (Vite/Webpack), CSS-in-JS, or `@material/web` Web Components.
- Multi-app LRU or unbounded iframe caching (only `defaultAppId` stays warm).
- New user-facing theme picker UI (uses `prefers-color-scheme` system preference).
- Changes to `manifest.json` permissions or `omnibar-apps.json` export/import schema.

## Assumptions
- **ASM-GEN-1**: `chrome.storage.session` is available in Chrome MV3 service workers without adding new `manifest.json` permissions (it is part of the existing `storage` permission).
- **ASM-GEN-2**: `chrome.sidePanel.open({ windowId })` in `background.js` must not lose its user-gesture token across async `chrome.storage.session.get`; if Chromium drops the gesture token across `await`, an in-memory cache warmed at SW startup / non-blocking sync will be used.
- **ASM-GEN-3**: `defaultAppId` is the only app kept warm; when `defaultAppId` is `null`, at most one iframe (`#app-frame`) is ever active.

## Success Metrics
- Switching back to the configured default app is instant (no iframe reload or lost scroll/prompt state) while idle memory stays capped at at most 1 warm app.
- Clicking strip icons, toggling edit mode, or closing the panel no longer destroys/rebuilds existing icon DOM nodes or re-requests favicons.
- `Alt+Z` and toolbar icon clicks accurately open/close the side panel even after the MV3 service worker suspends or `closePanel()` is called.
- All pure core modules achieve >= 95% line/branch coverage and >= 95% mutation kill score via `node --test`.

## Review Gate
- [x] **Gate 1 Approval**: Proposal reviewed and approved by human before drafting specs.
