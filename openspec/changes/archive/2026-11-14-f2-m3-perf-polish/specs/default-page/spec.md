# Spec Delta: default-page

## MODIFIED Requirements

### Requirement: REQ-DEFAULT-3 Auto-Open Default Page on Launch
During `init()`, the system MUST read both `apps` and `defaultAppId` from `chrome.storage.local` in a single storage read; if `defaultAppId` matches an app in `apps`, it MUST call `openApp(app)` automatically (loading it in `#default-app-frame`) after rendering the strip and binding listeners, otherwise it MUST leave the content panel closed.

#### Scenario: Side panel launches with valid defaultAppId
- **GIVEN** `defaultAppId` matches `Gemini` in `apps`
- **WHEN** the OmniBar side panel launches and `init()` completes
- **THEN** `Gemini` is opened in `#default-app-frame`, `#content-panel` is visible, and Gemini's icon is marked active

#### Scenario: Side panel launches with None or stale defaultAppId
- **GIVEN** `defaultAppId` is `null` or does not match any app in `apps`
- **WHEN** the OmniBar side panel launches and `init()` completes
- **THEN** the content panel remains closed (`panelOpen === false`)
