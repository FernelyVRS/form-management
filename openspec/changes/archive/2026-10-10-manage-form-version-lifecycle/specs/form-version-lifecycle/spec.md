## ADDED Requirements

### Requirement: Lifecycle state machine

The system SHALL implement the version lifecycle `Draft -> Published -> Archived` with the following transitions only: publishing a Draft, archiving a Draft manually, and archiving the current Published implicitly when a replacement is published. `Archived` SHALL be terminal: no direct transition out of Archived, and recovery SHALL happen only by deriving a new Draft from a Published or Archived version.

#### Scenario: Publishing promotes a Draft

- **WHEN** a valid Draft with at least one question is published
- **THEN** its status becomes `Published`, it receives a refreshed UTC timestamp and RowVersion token, and the command response reports the new state

#### Scenario: Archived is terminal

- **WHEN** a command requests a transition from `Archived` to any other status
- **THEN** the command is rejected with `invalid_version_state` and no data changes

#### Scenario: Recovery derives a new Draft

- **WHEN** a user needs to edit a form whose latest state is Archived
- **THEN** a new Draft is created by derivation from the Archived version and the Archived version remains unchanged

### Requirement: Single Draft and Published per form

The system SHALL guarantee at most one `Draft` and at most one `Published` version per form, enforced by unique filtered indexes in SQL and re-checked inside each command transaction. The presence of a Draft or a Published version SHALL NOT be mandatory.

#### Scenario: Second Draft is rejected

- **WHEN** a create-version command runs while the form already has a Draft
- **THEN** the command is rejected with `invalid_version_state` and the existing Draft is untouched

#### Scenario: Publishing replaces the previous Published

- **WHEN** a Draft is published while a Published version exists for the same form
- **THEN** the previous Published becomes `Archived` and the Draft becomes `Published` in a single transaction

#### Scenario: Concurrent commands do not duplicate states

- **WHEN** two lifecycle commands for the same form execute concurrently
- **THEN** they serialize on the form row and never produce two Drafts or two Published versions

### Requirement: Derivation sources

New versions and cloned forms SHALL be derivable only from versions with status `Published` or `Archived`. A `Draft` source SHALL be rejected. The source version SHALL belong to the referenced form for version derivation, and the source snapshot SHALL never be modified.

#### Scenario: Published and Archived sources are accepted

- **WHEN** a create-version or clone-form command references a Published or Archived version of the source form
- **THEN** the command succeeds and the source remains byte-identical and untouched

#### Scenario: Draft source is rejected

- **WHEN** a create-version command references a version with status `Draft`
- **THEN** the command is rejected with `invalid_version_state`

#### Scenario: Foreign or missing source is not found

- **WHEN** a command references a version that does not exist or belongs to another form
- **THEN** the command returns 404 `version_not_found` (or `form_not_found` for a missing source form in clone)

### Requirement: Schema snapshot copy fidelity

Derivation SHALL copy the complete validated v1 schema document, preserving section/group/field `id`, `variable`, `core`, labels, descriptions, order, validations, options, dependencies and maps. The copy SHALL be validated with the v1 validator before persistence, SHALL be physically independent of the source document, and SHALL register `DerivedFromVersionId` (version derivation) plus form-level provenance `SourceFormId`/`SourceVersionId` (form clone). Core protection derived from the source SHALL be inherited by the copy.

#### Scenario: Full snapshot equality

- **WHEN** a version or form is derived from a source with groups, dependent selects, maps, descriptions and validations
- **THEN** the persisted copy is structurally equal to the source document after canonical serialization

#### Scenario: Corrupt source schema aborts derivation

- **WHEN** the stored schema of the source version cannot be parsed or fails v1 validation
- **THEN** the command fails with `invalid_stored_schema` or `not_publishable` and creates nothing

### Requirement: Version numbering

New version numbers SHALL be assigned as `MAX(VersionNumber) + 1` across all versions of the form, including Archived versions, computed only while holding the form-level lock. Version numbers SHALL be greater than zero, unique per form and never reused.

#### Scenario: Numbering skips archived versions

- **WHEN** a form has versions 1 (Archived), 2 (Published) and a new Draft is derived
- **THEN** the new Draft receives number 3

#### Scenario: Concurrent derivations do not collide

- **WHEN** two derivation commands for the same form run concurrently
- **THEN** each receives a distinct sequential number and at most one Draft results

### Requirement: Atomic publish with preconditions

Publishing SHALL require a stored schema that parses and validates as v1 and contains at least one question, counting fields at any depth including fields inside groups; per-section content SHALL NOT be required. Publishing SHALL re-validate derived core identity, SHALL archive any previous Published and promote the Draft within one transaction, and SHALL reject stale RowVersion tokens. A failure after archiving the previous Published SHALL roll back the entire command.

#### Scenario: Empty schema is not publishable

- **WHEN** a Draft whose schema contains no fields (even with sections present) is published
- **THEN** the command is rejected with `not_publishable` and no status changes

#### Scenario: Grouped questions satisfy the minimum

- **WHEN** a Draft's only questions are fields inside a group
- **THEN** the publish minimum is satisfied

#### Scenario: Stale token is rejected

- **WHEN** a publish or archive command supplies a RowVersion token that no longer matches
- **THEN** the command returns 409 `version_conflict` and the UI can refresh and retry

#### Scenario: Rollback restores the previous Published

- **WHEN** promotion fails after the previous Published was archived inside the transaction
- **THEN** both versions retain their pre-command status and tokens

### Requirement: Draft-only manual archive

Manual archive SHALL accept only versions with status `Draft`. It SHALL change the status to `Archived` preserving number, schema and provenance, refreshing UTC timestamp and RowVersion. Requesting archive for a `Published` version SHALL be rejected.

#### Scenario: Draft is archived preserving history

- **WHEN** an archive command targets a Draft with a valid token
- **THEN** the row remains with status `Archived`, the same `VersionNumber`, unchanged `SchemaJson` and a new token/timestamp

#### Scenario: Published archive is rejected

- **WHEN** an archive command targets a version with status `Published`
- **THEN** the command returns 409 `invalid_version_state`

### Requirement: Command error contract

Lifecycle commands SHALL return ProblemDetails with stable `code` values: `invalid_request` (400), `version_not_found`/`form_not_found` (404), `invalid_version_state`/`version_conflict` (409), `not_publishable`/`schema_identity_violation` (422) and `invalid_stored_schema` (500). Rejected commands SHALL leave no partial writes, SHALL NOT return EF entities or navigation properties, and SHALL return real 404s for missing entities.

#### Scenario: Rejections mutate nothing

- **WHEN** any lifecycle command is rejected
- **THEN** statuses, schemas, timestamps and tokens of all involved versions are unchanged

#### Scenario: Missing entities return 404

- **WHEN** a command references an unknown form or version ID
- **THEN** the response is 404 with the corresponding not-found code, not an empty success

### Requirement: Ordered version metadata reads

Form detail reads SHALL return versions ordered explicitly by `VersionNumber`, SHALL distinguish the latest version (highest number) from the current publication, and SHALL expose publication, available Draft and history data so the UI never relies on a hardcoded summary.

#### Scenario: Latest differs from published

- **WHEN** a form has an Archived version 1, Published version 2 and Draft version 3
- **THEN** the detail response reports version 3 as latest, version 2 as the current publication and version 3 as the available Draft

#### Scenario: Form without publication

- **WHEN** a form has only Draft versions
- **THEN** the detail response reports no current publication and the UI shows "Sin publicación"

### Requirement: Management UI state actions

The form detail page SHALL drive real lifecycle data and expose per-state actions: Draft → Editar, Publicar, Archivar borrador; Published/Archived → Ver estructura, Nueva versión, Clonar formulario. When a Draft already exists, Nueva versión SHALL offer Continuar borrador instead of a second derivation. Publish and archive SHALL require confirmation and SHALL NOT send a request when cancelled. While a command is pending, repeated activations SHALL not send additional requests. Lifecycle refreshes SHALL NOT overwrite unsaved local builder state, and explicit Save remains the only schema write path.

#### Scenario: Publication summary uses real data

- **WHEN** the form detail page loads
- **THEN** the publication summary renders from the API response, replacing the former hardcoded `v1.0.0 / Publicada` values

#### Scenario: Cancelled confirmation sends no request

- **WHEN** the user cancels the publish confirmation dialog
- **THEN** no HTTP command is issued and the state is unchanged

#### Scenario: Concurrent draft switches the action

- **WHEN** the form already has a Draft while viewing a Published or Archived version
- **THEN** the UI offers Continuar borrador navigating to the existing Draft instead of creating a new version

#### Scenario: Conflict refreshes authoritative state

- **WHEN** a command fails with `version_conflict`
- **THEN** the UI shows an actionable message and refreshes the form state from the server

#### Scenario: Single request while pending

- **WHEN** the user activates publish repeatedly while the request is in flight
- **THEN** only one HTTP request is sent

### Requirement: Clone navigation with validated identifiers

Cloning SHALL prompt for name and description, preserve the user's input when the command fails, navigate to the new form only with identifiers parsed and validated from the command response, and invalidate affected list, detail and schema caches.

#### Scenario: Clone error keeps input

- **WHEN** the clone command fails validation
- **THEN** the modal keeps the entered name and description and shows the error

#### Scenario: Clone success navigates to the new form

- **WHEN** the clone command succeeds
- **THEN** the application navigates to the new form's detail or builder using the response identifiers and the source form is unchanged
