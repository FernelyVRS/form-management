## Why

The validated v1 backend is available, but the active builder still loads a global legacy mock and uses unimplemented estructura endpoints. Migrating editing to one version-scoped canonical draft with explicit Save makes the persisted contract usable without mixed schemas or lost local edits.

## What Changes

- Replace the active builder with v1 Section/Group/Field editing, descriptions, static/dependent options and supported simple constraints.
- Load and save through validated TanStack Query API hooks and keep only the identified local draft in Zustand.
- Normalize orders and protect retained variables, baseline core fields and dependent references through pure operations.
- Explicit Save handles pending, success, validation, network and conflict states without overwriting dirty drafts.
- Move the original mock intact to mocks/legacy and remove all runtime imports/fake hooks.
- Separate /builder and read-only structure /view routes; full answer renderer remains a subsequent change.
- Add lazy DnD and keyboard move controls, normalize all operations, and warn on leaving with unsaved edits.

## Capabilities

### New Capabilities

- `form-schema-builder`: Canonical version-scoped CRUD, ordering, explicit saving, conflict handling and read-only structure inspection.

### Modified Capabilities

None.

## Impact

Frontend forms API/model/builder components, routing, bootstrap, metadata navigation, tests and documentation. Existing SQL and schema endpoints remain unchanged. Legacy files are preserved but are no longer reachable from application routes.
