# Spec Delta: strip-reconciliation

## Purpose
Eliminate redundant DOM teardown and favicon re-fetches in the icon strip by splitting active/edit class updates from keyed DOM reconciliation.

## ADDED Requirements

### Requirement: REQ-STRIP-1 In-Place Active & Edit State Sync
Toggling the active app (`openApp`, `closePanel`) or toggling edit mode (`toggleEditMode`) MUST update `.active` and `.edit-mode` classes on existing `#app-icons` DOM nodes in place without clearing `$icons.innerHTML` or recreating icon elements.

#### Scenario: Switching apps preserves existing icon DOM nodes
- **GIVEN** `#app-icons` has rendered icon elements for `[Claude, Gemini]`
- **WHEN** the user clicks `Gemini` and then `Claude`
- **THEN** the same DOM element instances remain in `#app-icons` with only `.active` toggled

### Requirement: REQ-STRIP-2 Keyed Strip Reconciliation & Dynamic Drag Index
When `apps` is added, edited, removed, reordered, imported, or reset, the strip MUST reconcile `#app-icons` by `app.id` (reordering, updating tooltip/name/img only when changed, and inserting/removing only changed nodes). Drag-and-drop handlers MUST read `Number(el.dataset.idx)` dynamically rather than capturing a loop index in a closure.

#### Scenario: Reordering via drag-and-drop works after prior reorder without full rebuild
- **GIVEN** `#app-icons` was reordered once in place
- **WHEN** the user drags an icon to a new position a second time
- **THEN** `onDragStart` and `onDrop` read the updated `dataset.idx` and reorder `apps` accurately

### Requirement: NFR-STRIP-1 O(1) Active/Edit Sync
Active-state and edit-mode synchronization MUST run in O(1) DOM class operations (or O(n) attribute toggle without node creation/destruction) and trigger zero favicon image reloads.

#### Scenario: Zero image reloads on app switch
- **GIVEN** all strip `<img>` favicons are loaded
- **WHEN** `openApp()` or `closePanel()` runs
- **THEN** no `<img>` elements are recreated or reassigned `src`
