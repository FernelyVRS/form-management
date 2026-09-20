## Context

The current frontend contract defines `VersionEstado` as `Draft | Published | Archived`. The backend creates versions with `Draft`, the SQL schema restricts persisted values to the same three statuses, and the current detail/card/badge components use those values. `VersionModal` still filters with the obsolete localized value `publicada`, producing `TS2367` and an empty source list for real `Published` data.

The affected code already follows the Agent OS feature structure: form-specific components remain under `src/features/forms/components/` and reuse shared UI primitives. This change must preserve that structure and avoid introducing abstractions or dependencies for a single contract correction.

## Goals / Non-Goals

**Goals:**

- Make all affected frontend status comparisons consistent with `VersionEstado`.
- Preserve the existing Published-only source filter in `VersionModal`.
- Keep localized explanatory text separate from contract values.
- Restore a successful TypeScript and production frontend build.
- Verify the three canonical statuses across the modal, card, and badge components.

**Non-Goals:**

- Implement version creation, cloning, publishing, or archiving endpoints.
- Decide whether future version creation should clone the latest version or a user-selected Published version.
- Change API DTO property names or response envelopes.
- Change database constraints or form JSON schemas.
- Reconnect the currently inaccessible version modal.
- Refactor routing, read-only behavior, or version navigation.
- Add a new test framework or update the existing Playwright suite.
- Consolidate the duplicate `VersionEstado` and `VersionStatus` type declarations as part of this fix.

## Decisions

### Use the current contract values without translation

Status comparisons will use `Draft`, `Published`, and `Archived` directly. These values are already aligned across the TypeScript contract, backend creation path, SQL constraint, and current presentation components.

Alternative considered: translate API values to localized Spanish values. Rejected because it would expand the change, preserve the split contract, and conflict with the existing backend values.

### Preserve Published-only filtering

The modal will continue to expose only Published versions as selectable sources. TASK-001 corrects the stale value but does not redefine version cloning rules.

Alternative considered: clone the latest version automatically, as described by the manual detail spec. Deferred to the broader version-management change because the backend endpoint is not implemented and the rule is not represented by an active OpenSpec capability.

### Keep UI labels independent from data values

Visible Spanish terms such as `borrador` or `publicadas` may remain as user-facing copy. They are not valid values for comparisons against `VersionEstado`.

Alternative considered: replace all visible copy with English status names. Rejected because localization is unrelated to the build failure.

### Use existing verification tooling

Verification will use the existing TypeScript production build and focused checks of affected status mappings. No dependency or test framework will be added for this small correction.

Alternative considered: introduce component unit testing infrastructure. Rejected as disproportionate to TASK-001 and not established by the repository.

## Risks / Trade-offs

- [Risk] The build succeeds while broader version creation remains non-functional because its backend endpoint is absent. → Mitigation: keep those limitations explicit and verify only TASK-001 acceptance criteria.
- [Risk] Other obsolete localized contract values remain outside the reviewed frontend source. → Mitigation: search version-related frontend source for stale status comparisons before completing the task.
- [Risk] Duplicate status type declarations can diverge later. → Mitigation: verify both declarations contain the same canonical values; defer consolidation to a separately scoped task.
- [Trade-off] Published-only filtering may conflict with the manual rule that a new version clones the latest version. → Mitigation: preserve current behavior now and resolve the business rule in the version-management specification.

## Migration Plan

1. Update the stale status comparison in the existing form feature.
2. Review affected status mappings for the three canonical values.
3. Run the frontend production build.
4. If verification fails, revert the localized comparison change; no data migration or rollback procedure is required.

## Open Questions

None blocking TASK-001. Version cloning semantics remain intentionally deferred.
