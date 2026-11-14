# Proposal

## Intent
Add a **Default Page** setting in the OmniBar Settings modal so users can select a configured app (or `None`) to open automatically every time the side panel launches.

## Problem Statement
Currently, OmniBar always launches with the content panel closed (`panelOpen = false`), requiring an extra click on an app icon every time the user opens the extension. Users who primarily use one AI tool or web app cannot configure it as their default landing page.

## Capabilities

### New Capabilities
- `default-page`: Configure a default app in Settings (`None` or any configured app), persist `defaultAppId` in `chrome.storage.local`, auto-open it on side panel launch (`init()`), and keep the setting consistent across app removal, reset, and import.

### Modified Capabilities
- None (no existing specs in `openspec/specs/`).

## Scope

### In-Scope
- Add a **Default Page** `<select>` control in the Settings modal (`sidebar.html` / `sidebar.css`), populated dynamically from the current `apps` list plus a `None` option.
- Persist `defaultAppId: string | null` in `chrome.storage.local` (Option A), and persist `apps` alongside it if `DEFAULT_APPS` has not yet been written to storage so IDs stay stable across launches.
- In `init()` (`sidebar.js`), read `defaultAppId` alongside `apps` and call `openApp(app)` when `defaultAppId` matches an existing app.
- Clear `defaultAppId` to `null` when the referenced app is removed (`removeApp`), when apps are reset (`resetToDefaults`), or when `importApps` replaces `apps` without that ID.

### Out-of-Scope (YAGNI)
- "Resume last opened app" mode or tracking `lastAppId` on panel toggle.
- Custom arbitrary URLs for the default page outside the configured `apps` list.
- Changes to the `omnibar-apps.json` export/import schema or `chrome.storage.sync` cross-device sync.
- Multi-window independent default page preferences.

## Assumptions
- **ASM-GEN-1**: `chrome.storage.local` is available and shared across side panel launches within the browser profile, matching existing `apps` persistence.
- **ASM-GEN-2**: Selecting a default page takes effect immediately on change (no separate "Save" button in Settings, consistent with existing Settings controls).

## Success Metrics
- When a default app is selected in Settings, reopening the OmniBar side panel automatically opens that app in `#app-frame` and highlights its icon in the strip.
- When `None` is selected (or the default app is removed/reset), launching OmniBar opens with the content panel closed as before.
- Existing `omnibar-apps.json` export and import workflows continue to work unchanged.

## Review Gate
- [x] **Gate 1 Approval**: Proposal reviewed and approved by human before drafting specs.
