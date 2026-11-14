# Research & Technical Tradeoffs

## 1. Intent & Ground Truth
- **Goal**: Modernize OmniBar's visual design with Material Design 3 (M3) tokens while improving runtime responsiveness (warm default app, zero strip rebuilds, reliable `Alt+Z` toggle across MV3 service worker sleep).
- **Confirmed Constraints** (from `concepts_brief.md`):
  - Only `defaultAppId` stays warm in memory; all other apps share one transient iframe.
  - Zero build step / zero npm runtime dependencies (`Load unpacked` Chrome MV3 extension).
- **Verified Codebase Facts**:
  - [sidebar.css](file:///Users/mmetawea/Workbench/OmniBar/sidebar.css#L10-L21) defines 10 flat `:root` variables (`--bg`, `--strip-bg`, etc.) alongside hardcoded hexes (`#2b2b2b`, `#333`, `#444`, `#1a1a1a`) and ad-hoc `rgba(255,255,255,.08)` hover states; [sidebar.js](file:///Users/mmetawea/Workbench/OmniBar/sidebar.js#L340-L346) sets `toast.style.background` inline.
  - [sidebar.js](file:///Users/mmetawea/Workbench/OmniBar/sidebar.js#L153-L203) (`openApp()`) resets `$frame.src = ''` then sets `$frame.src = app.url` on every switch, destroying the active app's DOM/scroll/session state, and uses a single global `loadTimer`.
  - [sidebar.js](file:///Users/mmetawea/Workbench/OmniBar/sidebar.js#L88-L145) (`renderStrip()`) clears `$icons.innerHTML = ''` on every `openApp()`, `closePanel()`, `toggleEditMode()`, and `onDrop()`, and captures loop index `i` in drag/drop closures (`onDragStart(e, i)`, `onDrop(e, i)`).
  - [background.js](file:///Users/mmetawea/Workbench/OmniBar/background.js#L5) tracks `openWindows` in an in-memory `Set` that resets on MV3 service worker suspension; [sidebar.js](file:///Users/mmetawea/Workbench/OmniBar/sidebar.js#L210) sends `{ type: 'panel-closed' }` without `windowId`, which [background.js](file:///Users/mmetawea/Workbench/OmniBar/background.js#L46) silently ignores.
  - Existing living spec: [openspec/specs/default-page/spec.md](file:///Users/mmetawea/Workbench/OmniBar/openspec/specs/default-page/spec.md) (`REQ-DEFAULT-1..4`, `NFR-DEFAULT-1`).

## 2. Options Explored

### Option A: Pure CSS M3 Tokens + Default-App Warm/Transient Iframe + In-Place Strip Patching + `chrome.storage.session`
Define M3 surface, state-layer, typography, shape, and motion tokens in `sidebar.css` (with `prefers-color-scheme` and `prefers-reduced-motion` support) and class-based toasts. Keep at most two iframes (`#default-app-frame` for `defaultAppId` kept warm across switches/`closePanel()`, `#app-frame` transient for all other apps) with per-slot `loading | loaded | blocked` state. Split `renderStrip()` into O(1) active/edit class sync and keyed DOM reconciliation using dynamic `dataset.idx` for drag-and-drop. Persist `openWindows` in `chrome.storage.session` (verifying MV3 user-gesture preservation for `sidePanel.open`) and pass `windowId` on `panel-closed`.
- **Pros**: Zero build step/dependencies; caps extra warm memory at 1 app; eliminates strip flicker and `Alt+Z` desync; testable pure core modules (`node --test`).
- **Cons**: Non-default apps still cold-load on switch.

### Option B: Option A + 3-Slot LRU Iframe Cache
Same as Option A, but caches up to 3 arbitrary recently-used apps in an LRU `Map`.
- **Pros**: Instant switching among 3 arbitrary apps.
- **Cons**: Holds up to 3 heavy cross-origin renderer heaps in RAM simultaneously (~150–400 MB+); adds LRU eviction complexity; rejected by user.

### Option C: `@material/web` Component Library + Bundler
Adopt Google's `@material/web` Web Components with Vite/Rollup bundling.
- **Pros**: Pre-built M3 ripples and form controls.
- **Cons**: Introduces build pipeline, npm runtime dependencies, and breaks zero-build `Load unpacked` workflow.

## 3. Tradeoff Matrix

| Criteria | Option A (Pure M3 + Warm Default) | Option B (3-Slot LRU) | Option C (`@material/web`) |
| :--- | :--- | :--- | :--- |
| **Complexity** | Low-Medium (max 2 frames, pure CSS) | Medium-High (LRU map + eviction) | High (bundler + build step) |
| **New Dependencies** | None | None | `@material/web` + bundler |
| **Performance & Latency** | Instant default app + zero strip rebuilds | Instant for 3 apps, 3x idle RAM | Bundle load overhead |
| **Maintenance Burden** | Low (pure UMD helpers + CSS tokens) | Medium (multi-frame lifecycle) | High (tooling + upgrades) |
| **Blast Radius** | `sidebar.*`, `background.js`, new pure helper | Same + LRU cache module | Entire repo build & HTML |

## 4. Recommendation
Adopt **Option A (Pure CSS M3 Tokens + Default-App Warm/Transient Iframe + In-Place Strip Patching + `chrome.storage.session`)**. It delivers M3 visual polish and instant default-app switching with zero build dependencies and a strict 1-app memory cap.

## 5. Breaking Changes & Deprecations
- `REQ-DEFAULT-3` in [openspec/specs/default-page/spec.md](file:///Users/mmetawea/Workbench/OmniBar/openspec/specs/default-page/spec.md#L34-L40) currently references `#app-frame` by ID; will be updated via `MODIFIED` in Gate 2 to allow `#default-app-frame` for the warm default app.

## Review Gate
- [x] **Gate 0 Decision**: Option A
