# Spec Delta: m3-theme

## Purpose
Modernize OmniBar's visual styling with pure CSS Material Design 3 (M3) tokens for surfaces, state layers, typography, shape, motion, and adaptive light/dark color schemes without a build step.

## ADDED Requirements

### Requirement: REQ-M3-1 Surface & Semantic Color Tokens
The stylesheet MUST define Material Design 3 surface hierarchy tokens (`--md-sys-color-surface`, `--md-sys-color-surface-container-low`, `--md-sys-color-surface-container`, `--md-sys-color-surface-container-high`, `--md-sys-color-surface-container-highest`) and semantic color tokens (`--md-sys-color-primary`, `--md-sys-color-on-primary`, `--md-sys-color-primary-container`, `--md-sys-color-on-primary-container`, `--md-sys-color-on-surface`, `--md-sys-color-on-surface-variant`, `--md-sys-color-outline`, `--md-sys-color-outline-variant`, `--md-sys-color-error`) for both dark and light schemes via `@media (prefers-color-scheme: light)`.

#### Scenario: Dark and light schemes resolve surface roles
- **GIVEN** `sidebar.css` is loaded in Chrome
- **WHEN** `prefers-color-scheme` switches between `dark` and `light`
- **THEN** `#icon-strip`, `#panel-header`, modals, context menu, and inputs resolve distinct M3 surface container colors without hardcoded hex overrides

### Requirement: REQ-M3-2 State Layers, Shape & Typography Tokens
Interactive surfaces (`.app-icon`, `.strip-btn`, `.hdr-btn`, `.settings-btn`, `.ctx-item`, `#modal-save`, `#modal-cancel`) MUST use M3 shape tokens (`--md-sys-shape-corner-small`, `--md-sys-shape-corner-medium`, `--md-sys-shape-corner-large`, `--md-sys-shape-corner-full`), typography scale tokens, and standardized state-layer hover/focus opacities (`8%` hover, `12%` focus-visible/pressed).

#### Scenario: Interactive button hover and focus use state layers
- **GIVEN** an interactive control in the strip, header, or Settings modal
- **WHEN** the user hovers or focuses it via keyboard
- **THEN** it displays an M3 state-layer highlight and accessible focus ring using M3 tokens

### Requirement: REQ-M3-3 Motion Tokens, Reduced Motion & Class-Based Toasts
Motion transitions and animations (including `.edit-mode .app-icon`) MUST use M3 easing/duration tokens and MUST be disabled or minimized under `@media (prefers-reduced-motion: reduce)`. `showToast()` MUST toggle `.toast--info`, `.toast--success`, or `.toast--error` CSS classes instead of setting inline `toast.style.background`.

#### Scenario: Reduced motion disables wiggle and transitions
- **GIVEN** the OS/browser has `prefers-reduced-motion: reduce` enabled
- **WHEN** the user enters edit mode or opens a modal
- **THEN** the edit-mode wiggle animation and modal transitions do not animate

#### Scenario: Toast uses semantic CSS classes
- **GIVEN** `showToast(message, type)` is called with `'success'`, `'error'`, or `'info'`
- **WHEN** the toast element is updated
- **THEN** it receives `toast--success`, `toast--error`, or `toast--info` and zero inline `style.background`

### Requirement: NFR-M3-1 Zero Build & Zero Runtime Dependency Budget
The M3 theme MUST be implemented in pure CSS custom properties without adding any npm runtime dependency, CSS preprocessor, or bundler step.

#### Scenario: Extension loads unpacked without build
- **GIVEN** the repository root
- **WHEN** `manifest.json` and `sidebar.html` are loaded unpacked in Chrome
- **THEN** all M3 styles apply directly from `sidebar.css` with zero build artifacts
