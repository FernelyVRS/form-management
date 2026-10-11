# Version Status Contract Specification

## Purpose

Define the canonical frontend version-status values, their use in source filtering and presentation, and the build-time validation of status comparisons.

## Requirements

### Requirement: Canonical version status values
The frontend SHALL use `Draft`, `Published`, and `Archived` as the canonical values of the version status contract.

#### Scenario: Published version is recognized
- **WHEN** a version has status `Published`
- **THEN** frontend version-status comparisons recognize it as published without using a localized contract value

#### Scenario: Draft version is recognized
- **WHEN** a version has status `Draft`
- **THEN** frontend version-status mappings resolve the Draft presentation without a type error or fallback caused by a stale contract value

#### Scenario: Archived version is recognized
- **WHEN** a version has status `Archived`
- **THEN** frontend version-status mappings resolve the Archived presentation without a type error or fallback caused by a stale contract value

### Requirement: Derivation source filtering
The version creation modal SHALL include versions with status `Published` or `Archived` in its selectable source list and SHALL exclude versions with status `Draft`.

#### Scenario: Published sources are available
- **WHEN** the modal receives one or more `Published` versions
- **THEN** each Published version is available for selection

#### Scenario: Archived sources are available
- **WHEN** the modal receives one or more `Archived` versions
- **THEN** each Archived version is available for selection

#### Scenario: Draft sources are excluded
- **WHEN** the modal receives versions with status `Draft`
- **THEN** those versions are not available for selection

#### Scenario: No derivation source exists
- **WHEN** the modal receives an empty list or only `Draft` versions
- **THEN** it displays the existing empty-state message and keeps the create action disabled

### Requirement: Localized labels remain presentation-only
The frontend MAY display localized labels for version statuses, but status comparisons and mappings MUST use the canonical contract values.

#### Scenario: Spanish copy describes a Draft
- **WHEN** the UI displays the word `borrador` as explanatory copy
- **THEN** the underlying status value remains `Draft`

### Requirement: Frontend production build succeeds
The frontend production build SHALL complete without a TypeScript status-comparison error.

#### Scenario: TypeScript validates status comparisons
- **WHEN** `pnpm build` runs against the implementation
- **THEN** no `TS2367` error is produced by version-status comparisons
