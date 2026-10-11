## RENAMED Requirements

FROM: `### Requirement: Published source filtering`
TO: `### Requirement: Derivation source filtering`

## MODIFIED Requirements

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
