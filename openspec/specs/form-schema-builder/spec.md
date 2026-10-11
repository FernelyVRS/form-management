# Form Schema Builder Specification

## Purpose

Define the v1 builder runtime: version-scoped canonical loading, node editing and movement with normalized orders and protection rules, explicit save with recoverable failures, navigation guards and read-only structure inspection, and accessible description presentation.

## Requirements

### Requirement: Version-scoped canonical loading
The builder SHALL retrieve validated v1 schema and token using both route IDs, show loading/error/empty states, and isolate drafts per route identity. Runtime SHALL NOT initialize schemas from the legacy mock.

#### Scenario: Switch version or refetch
- **WHEN** the route changes or a query refetch completes
- **THEN** another version cannot overwrite the active draft and dirty work is not silently replaced

### Requirement: Canonical node editing and movement
The builder SHALL allow creation, editing and deletion of sections, one-level groups and text/number/select fields, descriptions, static options, dependencies and permitted validation. All operations SHALL normalize order, preserve canonical keys and validate references/identities. Existing IDs and baseline variables/core fields SHALL be protected. DnD and keyboard/editor movement SHALL use the same pure operations and SHALL NOT save automatically.

#### Scenario: Edit or move a grouped field
- **WHEN** a field is edited in place or moved to a valid section/group
- **THEN** it remains present with normalized orders and no editor-only properties in the document

#### Scenario: Invalid destructive operation
- **WHEN** deletion removes a protected core or breaks a dependent reference, or a group is moved into a group
- **THEN** the operation is rejected and the draft remains intact

### Requirement: Explicit save and recoverable failures
Save SHALL issue a single full-schema PUT with the current token only for Draft versions. Pending saves SHALL disable editing/repeated submission. Success SHALL update baseline/token and dirty state. Errors SHALL retain edits and report validation/conflict/network failures; reload/discard SHALL require confirmation when edits exist.

#### Scenario: Save and reload
- **WHEN** a valid draft is saved successfully
- **THEN** the next read shows equivalent content and further saves use the new token

#### Scenario: Conflict or validation rejection
- **WHEN** the API rejects a save
- **THEN** unsaved content remains visible and no automatic replacement/retry overwrites server data

### Requirement: Navigation and read-only structure
Navigation and browser unloading SHALL warn about unsaved changes. Published/Archived /builder and every /view route SHALL offer read-only structure inspection without CRUD, DnD or Save. Draft entry points SHALL navigate to /builder. The legacy mock SHALL be preserved intact under mocks/legacy.

#### Scenario: Leave dirty draft
- **WHEN** the user navigates away with unsaved changes
- **THEN** the UI allows staying or explicitly discarding before proceeding

#### Scenario: Read-only version
- **WHEN** a Published/Archived version or /view route is loaded
- **THEN** schema is visible but cannot be changed from the UI

### Requirement: Description accessibility
Section/group descriptions SHALL display below headings and field help SHALL be available through hover, keyboard focus and touch/click, with Escape dismissal and labeled triggers.

#### Scenario: Open contextual help
- **WHEN** a field help trigger is focused or activated
- **THEN** its description is available without requiring pointer hover
