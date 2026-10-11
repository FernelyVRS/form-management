## ADDED Requirements

### Requirement: Versioned English document
The v1 validators SHALL accept a root object containing exactly `schemaVersion: 1` and `sections`, an array of section nodes. They SHALL reject legacy array roots, unsupported versions and unknown properties at every defined object level. Contract keys and discriminators SHALL be English; presentation text and external identifiers SHALL be preserved without translation.

#### Scenario: Empty canonical document
- **WHEN** a document is `{ "schemaVersion": 1, "sections": [] }`
- **THEN** both runtime validators accept it

#### Scenario: Legacy or unsupported format
- **WHEN** a document uses an array root, version other than 1, or legacy properties such as `titulo` or `preguntas`
- **THEN** both validators reject it with a path-bearing error

#### Scenario: Localized content
- **WHEN** a canonical document includes Spanish display strings and valid external variables
- **THEN** parsing and serialization preserve those values unchanged

### Requirement: Section and group structure
A section SHALL require `id`, `type: "section"`, non-empty `title`, non-empty `entity`, positive integer `order`, and `items`. Its items SHALL be fields or groups. A group SHALL require `id`, `type: "group"`, non-empty `label`, positive integer `order`, and `items` containing only fields. Empty containers SHALL be valid. Groups SHALL inherit section entity context and SHALL NOT carry their own `entity`.

#### Scenario: Fields inside a group
- **WHEN** a section contains a group with supported fields
- **THEN** the document is structurally accepted and its group fields are included in semantic validation

#### Scenario: Recursive group or nested section
- **WHEN** a group contains a group or section, or a section contains another section
- **THEN** the document is rejected

### Requirement: Field identity and components
A field SHALL require `id`, `type: "field"`, `component: "text" | "number" | "select"`, non-empty `label`, `variable`, positive integer `order`, and boolean `core`. All node IDs SHALL match `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$` and be globally unique. Variables SHALL match `^[A-Z][A-Za-z0-9]*$` and be globally unique. Fields SHALL NOT contain `items` or editor placement properties. Each sibling list SHALL use consecutive orders starting at 1 with no duplicates, independently of physical array ordering.

#### Scenario: Supported field variants
- **WHEN** text, number and select fields have all required properties and valid identity/order values
- **THEN** the validators accept their appropriate variants

#### Scenario: Invalid identity or sibling order
- **WHEN** IDs or variables are duplicated, syntax is invalid, or sibling orders have duplicates or gaps
- **THEN** the validators reject the document and identify the affected path

#### Scenario: Unsupported field shape
- **WHEN** a field omits variable/core, uses `numeric` or `composed`, or contains `sectionId`, `parentId` or `items`
- **THEN** the validators reject the field

### Requirement: Optional descriptions
Sections, groups and fields SHALL accept an optional plain-text `description` string and SHALL preserve it through serialization. Description SHALL NOT add renderer-specific properties to the contract. Its intended presentation SHALL be inline beneath section/group headings and contextual help beside field labels.

#### Scenario: Description supplied or omitted
- **WHEN** nodes contain a string description or omit it
- **THEN** both variants validate and provided strings survive a round trip

#### Scenario: Non-string description
- **WHEN** description is an object, array or null
- **THEN** the validators reject it

### Requirement: Existing simple answer constraints
Text fields SHALL accept optional `validation` containing only `maxLength`, a positive integer. Number fields SHALL accept optional `validation` containing only finite numeric `min` and `max`; supplied min SHALL NOT exceed supplied max. Empty validation objects SHALL be accepted. Selects SHALL NOT accept validation. `required`, `range`, numeric `maxLength` and cross-field answer rules SHALL be rejected. These constraints SHALL NOT imply mandatory answers.

#### Scenario: Valid simple constraints
- **WHEN** a text field has positive maxLength or a number field has valid min/max bounds
- **THEN** validators accept and preserve the constraints

#### Scenario: Invalid or unsupported constraints
- **WHEN** min exceeds max, maxLength is not a positive integer, or a field includes a disallowed validation property
- **THEN** validators reject it with the constraint path

### Requirement: Static and dependent select options
A select SHALL have exactly one mode: static `options`, or `dependency` plus sibling `map`. Each option SHALL contain exactly non-empty string `label` and non-empty string `value`; values SHALL be unique within each option list. Lists and maps SHALL be allowed to be empty. `dependency` SHALL contain exactly `field`, resolving to another select's external variable across the document. Self-dependencies, missing targets and cycles SHALL be rejected. Forward references SHALL be supported. Map keys SHALL belong to the source select's possible values, including the union of its mapped values when the source is dependent. An absent map entry SHALL denote an empty option list.

#### Scenario: Static select
- **WHEN** a select contains a valid options list without dependency/map
- **THEN** validators accept it

#### Scenario: Valid dependency across groups or forward references
- **WHEN** a dependent select references an existing select variable and its map uses valid source values without a cycle
- **THEN** validators accept it regardless of source position or group membership

#### Scenario: No options for a source value
- **WHEN** a valid source option value has no map entry
- **THEN** the document remains valid and the contract denotes no dependent options for that value

#### Scenario: Invalid dependency or option mode
- **WHEN** a select mixes both modes, lacks either mode, references a missing/non-select/self target, has a cycle, or has unknown map keys
- **THEN** validators reject it

#### Scenario: Invalid option values
- **WHEN** option values are numeric, empty or duplicated within one list
- **THEN** validators reject the options

### Requirement: Cross-runtime contract parity
The repository SHALL publish a Draft 2020-12 JSON Schema for structural validation and a shared indexed fixture corpus. Frontend Zod and backend .NET validators SHALL enforce structure plus semantic rules and agree on fixture acceptance. Errors SHALL include a document path and stable code. Exact localized error-message equality SHALL NOT be required. Serialization of accepted documents SHALL preserve all supported properties and SHALL NOT emit legacy keys.

#### Scenario: Shared fixture suite
- **WHEN** frontend and backend tests run against all indexed fixtures
- **THEN** both accept every valid fixture and reject every invalid fixture according to the same expectations

#### Scenario: Supported properties round trip
- **WHEN** the complete valid example is parsed, serialized and parsed again
- **THEN** its supported properties, Unicode content and option values are preserved

### Requirement: Contract-only introduction and legacy preservation
This change SHALL introduce independent contract modules without altering existing database records, endpoints, builder state or runtime routes. The existing `web/src/mocks/formStructure.json` file SHALL be preserved. Documentation SHALL identify the current legacy runtime and the v1 target separately, with runtime cutover deferred to subsequent changes and no planned legacy reader.

#### Scenario: Contract stage completed
- **WHEN** this change is implemented
- **THEN** existing runtime integration remains intact, the old mock still exists, and contract fixtures/modules are available for subsequent persistence and builder changes
