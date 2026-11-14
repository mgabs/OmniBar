# Spec Delta: default-page

## Purpose
Allow OmniBar users to configure a default app in Settings so the extension automatically opens that app whenever the side panel launches.

## ADDED Requirements

### Requirement: REQ-DEFAULT-1 Default Page Setting UI
The Settings modal MUST provide a Default Page selector containing a `None` option (empty value) followed by one option for each configured app in `apps` in strip order, displaying the app's current name and pre-selecting the currently persisted `defaultAppId` (or `None` when unset or invalid).

#### Scenario: Settings modal populates Default Page options
- **GIVEN** the user has configured apps `[Claude, Gemini]` and `defaultAppId` is set to Gemini's `id`
- **WHEN** the user opens the Settings modal
- **THEN** the Default Page selector lists `None`, `Claude`, `Gemini` in order with `Gemini` selected

#### Scenario: Newly added or renamed app appears in Default Page selector
- **GIVEN** the user renames an app or adds a new app
- **WHEN** the user opens the Settings modal
- **THEN** the Default Page selector reflects the updated app list and names

### Requirement: REQ-DEFAULT-2 Persist Default Page Selection
When the user changes the Default Page selector in Settings, the system MUST immediately persist `defaultAppId` (`string | null`) to `chrome.storage.local` and MUST also persist `apps` if `apps` was not yet stored so default app IDs remain stable across launches.

#### Scenario: User selects a default app on a fresh install
- **GIVEN** `apps` has not yet been written to `chrome.storage.local` (`DEFAULT_APPS` in memory)
- **WHEN** the user selects `Claude` in the Default Page selector
- **THEN** both `defaultAppId` and `apps` are saved to `chrome.storage.local`

#### Scenario: User clears the default page to None
- **GIVEN** `defaultAppId` is currently set to an app ID
- **WHEN** the user selects `None` in the Default Page selector
- **THEN** `defaultAppId` is persisted as `null` in `chrome.storage.local`

### Requirement: REQ-DEFAULT-3 Auto-Open Default Page on Launch
During `init()`, the system MUST read both `apps` and `defaultAppId` from `chrome.storage.local` in a single storage read; if `defaultAppId` matches an app in `apps`, it MUST call `openApp(app)` automatically after rendering the strip and binding listeners, otherwise it MUST leave the content panel closed.

#### Scenario: Side panel launches with valid defaultAppId
- **GIVEN** `defaultAppId` matches `Gemini` in `apps`
- **WHEN** the OmniBar side panel launches and `init()` completes
- **THEN** `Gemini` is opened in `#app-frame`, `#content-panel` is visible, and Gemini's icon is marked active

#### Scenario: Side panel launches with None or stale defaultAppId
- **GIVEN** `defaultAppId` is `null` or does not match any app in `apps`
- **WHEN** the OmniBar side panel launches and `init()` completes
- **THEN** the content panel remains closed (`panelOpen === false`)

### Requirement: REQ-DEFAULT-4 Lifecycle Consistency on Remove, Reset, and Import
The system MUST reconcile `defaultAppId` to `null` in `chrome.storage.local` whenever the referenced app is removed via `removeApp`, whenever `resetToDefaults` resets `apps`, or whenever `importApps` replaces `apps` with a list that does not contain `defaultAppId`.

#### Scenario: Default app is removed
- **GIVEN** `defaultAppId` is set to `Claude`'s `id`
- **WHEN** the user removes `Claude`
- **THEN** `defaultAppId` is cleared to `null` in `chrome.storage.local`

#### Scenario: Apps are reset to defaults
- **GIVEN** `defaultAppId` is set to any app
- **WHEN** the user confirms `Reset to Defaults`
- **THEN** `defaultAppId` is cleared to `null` in `chrome.storage.local`

#### Scenario: Imported apps do not contain current defaultAppId
- **GIVEN** `defaultAppId` is set to `id-1`
- **WHEN** the user imports an `omnibar-apps.json` file whose apps do not include `id-1`
- **THEN** `defaultAppId` is cleared to `null` in `chrome.storage.local`

#### Scenario: Imported apps preserve current defaultAppId
- **GIVEN** `defaultAppId` is set to `id-1`
- **WHEN** the user imports an `omnibar-apps.json` file containing an app with `id: "id-1"`
- **THEN** `defaultAppId` remains `"id-1"`

### Requirement: NFR-DEFAULT-1 Launch & Storage Budget
Reading `apps` and `defaultAppId` on launch MUST use a single `chrome.storage.local.get(['apps', 'defaultAppId'])` call (no extra storage round-trips) and pure default-app resolution MUST execute in O(n) time with zero network or DOM side effects.

#### Scenario: Single storage read on init
- **GIVEN** the side panel initializes
- **WHEN** `init()` fetches persisted state
- **THEN** `chrome.storage.local.get` is called once with `['apps', 'defaultAppId']`
