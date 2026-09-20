## Why

The frontend version-status migration is incomplete: `VersionModal` still compares against the obsolete `publicada` value while the current contract uses `Draft`, `Published`, and `Archived`. This mismatch blocks the production frontend build and prevents published versions from being available in the modal.

## What Changes

- Align `VersionModal` with the canonical `VersionEstado` values already used by the frontend and persisted by the backend.
- Preserve the modal's current behavior of listing only `Published` versions as selectable sources.
- Verify that `VersionModal`, `VersionCard`, and `StatusBadge` handle the three canonical states consistently.
- Restore a successful frontend typecheck and production build.
- Keep localized UI labels independent from the status values used by the data contract.

## Capabilities

### New Capabilities
- `version-status-contract`: Defines the canonical version status values and their expected filtering and presentation behavior in the frontend.

### Modified Capabilities

None. No existing OpenSpec capability is present.

## Impact

- Affected frontend modules: `web/src/types/form.ts`, `VersionModal.tsx`, `VersionCard.tsx`, and `StatusBadge.tsx`.
- No API route, database schema, JSON form schema, dependency, or package version changes.
- No change to version creation, cloning, publishing, or navigation rules.
