# warm-default-frame Specification

## Purpose
Keep only the user's configured default app (`defaultAppId`) warm in a dedicated persistent iframe across app switches and panel closes, while routing all other apps through a single transient iframe.

## Requirements

### Requirement: REQ-FRAME-1 Dedicated Warm Default Frame & Single Transient Frame
`sidebar.html` and `sidebar.js` MUST maintain at most two iframes: `#default-app-frame` (for `defaultAppId` when set) and `#app-frame` (transient slot for any non-default app). Switching between the default app and a non-default app MUST preserve `#default-app-frame`'s loaded `src` and DOM state without reloading it, and `closePanel()` MUST hide `#default-app-frame` while keeping it warm and clearing `#app-frame.src`.

#### Scenario: Switching away from default app and back is instant
- **GIVEN** `defaultAppId` is `'claude'` and `#default-app-frame` has already loaded Claude
- **WHEN** the user opens `'gemini'` (loads in `#app-frame`) and then switches back to `'claude'`
- **THEN** `#default-app-frame` is shown immediately without resetting its `src` or reloading Claude

#### Scenario: closePanel keeps default app warm and clears transient frame
- **GIVEN** `defaultAppId` is `'claude'` and `#app-frame` was used for `'gemini'`
- **WHEN** `closePanel()` runs
- **THEN** `#default-app-frame` retains Claude's `src` (hidden) and `#app-frame.src` is cleared to `''`

### Requirement: REQ-FRAME-2 Per-Slot Load & Blocked State
Each frame slot (`default` and `transient`) MUST maintain independent `loadTimer` and `status` (`'idle' | 'loading' | 'loaded' | 'blocked'`) metadata so switching back to a loaded or blocked frame immediately reflects its current `#load-spinner` and `#blocked-msg` state without re-triggering an 8s timer.

#### Scenario: Returning to already-loaded default app hides spinner immediately
- **GIVEN** `#default-app-frame` has status `'loaded'` and `#app-frame` is currently `'loading'`
- **WHEN** the user switches back to the default app
- **THEN** `#load-spinner` and `#blocked-msg` are hidden immediately and `#default-app-frame` is visible

### Requirement: REQ-FRAME-3 Frame Invalidation & Refresh
The system MUST reset `#default-app-frame` (`src = ''`, status `'idle'`) whenever `defaultAppId` changes in Settings, when `saveModal()` modifies the default app's URL (`urlChanged`), or when `removeApp()`, `resetToDefaults()`, or `importApps()` invalidates or replaces `defaultAppId`. `hdr-refresh` MUST reload only the currently active slot's iframe.

#### Scenario: Changing defaultAppId or editing its URL clears stale warm frame
- **GIVEN** `#default-app-frame` holds `'claude'`
- **WHEN** the user changes `defaultAppId` to `'gemini'` or `'None'`, or edits Claude's URL in `saveModal()`
- **THEN** `#default-app-frame` is cleared so stale content is not shown

### Requirement: NFR-FRAME-1 Bounded Memory Footprint
At most one non-active iframe (`#default-app-frame` when `defaultAppId` is non-null) MAY remain resident in memory; when `defaultAppId` is `null`, zero iframes MAY remain loaded after `closePanel()`.

#### Scenario: No warm frame when defaultAppId is null
- **GIVEN** `defaultAppId` is `null`
- **WHEN** the user opens an app and then calls `closePanel()`
- **THEN** both `#default-app-frame` and `#app-frame` have empty `src`
