# sw-panel-state Specification

## Purpose
Keep `Alt+Z` and toolbar icon toggle state accurate across MV3 service worker suspension, `closePanel()`, and browser window closures.

## Requirements

### Requirement: REQ-SW-1 Session-Persisted Open Windows & `windowId` Sync
`background.js` MUST track open side-panel `windowId`s in `chrome.storage.session` (with an in-memory mirror warmed on startup/message so `chrome.sidePanel.open({ windowId })` executes synchronously within the user gesture) and prune closed windows on `chrome.windows.onRemoved`. `sidebar.js` MUST include `windowId` on every `panel-closed` message.

#### Scenario: Service worker restarts while side panel is open
- **GIVEN** window `1` has the side panel open (`openWindows` persisted in `chrome.storage.session`)
- **WHEN** the MV3 service worker suspends, wakes on `Alt+Z`, and `togglePanel(1)` runs
- **THEN** `background.js` knows window `1` is open and closes the side panel instead of calling `open()`

#### Scenario: sidePanel.open preserves user gesture
- **GIVEN** window `1` is closed in `openWindows`
- **WHEN** the user clicks the toolbar icon or presses `Alt+Z`
- **THEN** `chrome.sidePanel.open({ windowId: 1 })` is invoked without awaiting storage I/O before the call

### Requirement: REQ-SW-2 Native Side-Panel Lifecycle Boundary
`openWindows` MUST track the browser's native side-panel lifecycle (`panel-opened` on `init()`, `panel-closed` on `pagehide`), NOT `#content-panel` visibility inside `closePanel()`.

#### Scenario: Closing internal content panel keeps side panel open in openWindows
- **GIVEN** the side panel is open in window `1`
- **WHEN** the user clicks the active app icon to call `closePanel()` (hiding `#content-panel` while keeping `#icon-strip` visible)
- **THEN** window `1` remains in `openWindows` until `pagehide` or `Alt+Z` closes the native side panel

### Requirement: NFR-SW-1 Zero Extra Storage Permissions
Session persistence MUST use `chrome.storage.session` under the existing `storage` permission in `manifest.json` with zero new manifest permissions.

#### Scenario: manifest.json permissions unchanged
- **GIVEN** `manifest.json`
- **WHEN** `sw-panel-state` is implemented
- **THEN** `manifest.json` requires no additional permissions beyond `storage`
