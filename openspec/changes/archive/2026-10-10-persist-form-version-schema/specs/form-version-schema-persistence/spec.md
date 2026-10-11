## ADDED Requirements

### Requirement: Canonical version schema retrieval
The API SHALL expose `GET /forms/{formId}/versions/{versionId}/schema` with a direct English response containing `formId`, `versionId`, `number`, `status`, structured `schema`, base64 `rowVersion`, and nullable `updatedAt`. It SHALL validate stored schema against v1 before responding and SHALL resolve the version using both route IDs.

#### Scenario: Existing version is read
- **WHEN** the requested version belongs to the form and contains a valid v1 document
- **THEN** GET returns 200 with the complete schema as a JSON object and an eight-byte base64 concurrency token

#### Scenario: Version is absent or belongs to another form
- **WHEN** no matching form/version pair exists
- **THEN** GET returns 404 with code `version_not_found`

#### Scenario: Stored document is invalid or unsupported
- **WHEN** a requested version contains invalid, legacy or unsupported schema
- **THEN** GET returns a controlled 500 with code `invalid_stored_schema`, without converting or exposing raw stored content

### Requirement: Draft-only full-document saving
The API SHALL expose `PUT /forms/{formId}/versions/{versionId}/schema` accepting exactly `schema` and `rowVersion`. It SHALL validate request shape and the complete canonical schema, and SHALL persist only when the matched version is Draft. A successful save SHALL return 200 with the same response shape as GET and set version UpdatedAt to UTC. Rejected saves SHALL leave persisted schema, UpdatedAt and RowVersion unchanged.

#### Scenario: Valid Draft save
- **WHEN** a valid canonical document and current token are submitted for a Draft
- **THEN** the document is persisted, a subsequent GET returns equivalent content, and the response includes a new token and updated timestamp

#### Scenario: Invalid schema document
- **WHEN** a Draft request with a current token contains structural or semantic schema violations
- **THEN** PUT returns 422 with code `invalid_schema` and path-bearing issues without persisting any changes

#### Scenario: Published or Archived version
- **WHEN** PUT targets a Published or Archived version
- **THEN** it returns 409 with code `version_not_editable` and leaves the record unchanged

#### Scenario: Invalid request or token
- **WHEN** the body is malformed, required request properties are absent, unknown request properties exist, or rowVersion is invalid base64 or not eight bytes
- **THEN** PUT returns 400 with code `invalid_request` and makes no data changes

#### Scenario: Foreign version write
- **WHEN** PUT uses a version ID belonging to a different form
- **THEN** it returns 404 with code `version_not_found` and does not update that version

### Requirement: Database-backed optimistic concurrency
FormVersion SHALL have a SQL Server-generated RowVersion mapped as an EF concurrency token. PUT SHALL check the supplied token both against the loaded record and in the database update predicate. Concurrency failures SHALL return 409 with code `schema_conflict`; last-write-wins replacement SHALL NOT occur.

#### Scenario: Two clients save the same revision
- **WHEN** one client saves successfully and a second client submits the old token
- **THEN** the second save is rejected and the first client's schema remains persisted

#### Scenario: Record changes between load and update
- **WHEN** another operation updates the version after PUT loads it but before its database save
- **THEN** EF's concurrency check prevents replacement and PUT returns `schema_conflict`

### Requirement: Preserve contractual field identities
For fields retained by ID, PUT SHALL reject changes to their external variable relative to the currently stored schema. For derived versions, PUT SHALL also preserve every source core field's ID, variable and true core flag, including fields inside groups. These violations SHALL return 422 with `invalid_schema` and path-bearing issues. Invalid baseline/source schema SHALL produce controlled `invalid_stored_schema` errors rather than bypassing preservation checks.

#### Scenario: External variable renamed
- **WHEN** an existing field ID is submitted with a different variable
- **THEN** the save is rejected without changing persisted content

#### Scenario: Source core field removed or unprotected
- **WHEN** a derived version omits a source core field or changes its ID, variable or core flag
- **THEN** PUT rejects the save

#### Scenario: Core field moved intact
- **WHEN** a source core field is moved between valid containers with its identity, variable and core flag unchanged
- **THEN** preservation checks permit the save if all other schema rules pass

### Requirement: Canonical initial version creation
The existing create-form operation SHALL initialize its first Draft with the serialized empty v1 envelope and database-generated RowVersion. It SHALL preserve its existing metadata request/response contract and SHALL return a Location pointing to the actual form route.

#### Scenario: New form is created
- **WHEN** a valid existing create-form request succeeds
- **THEN** its version persists `{ "schemaVersion": 1, "sections": [] }` and can be retrieved through the new schema GET

### Requirement: Guarded SQL deployment
A versioned SQL migration SHALL normalize only known empty `{}` placeholders, add RowVersion and low-level valid-object/v1-marker/sections-array checks, and preserve IDs, version numbers, statuses and derivation links. It SHALL run transactionally, be repeatable and reject unexpected schemas without partial changes. Its deployment procedure SHALL require a fresh audit and backup and SHALL NOT execute automatically at API startup.

#### Scenario: Known empty schemas are migrated
- **WHEN** the reviewed script runs against the audited baseline containing empty placeholders
- **THEN** records become canonical empty documents with RowVersion and validated low-level JSON checks, preserving metadata

#### Scenario: Unexpected schema found
- **WHEN** preflight finds a non-empty legacy, malformed or unsupported document
- **THEN** the migration aborts without overwriting it or leaving partially applied DDL/DML

#### Scenario: Migration is applied again
- **WHEN** the script runs against an already migrated compatible database
- **THEN** schema documents remain unchanged and columns/constraints are not duplicated

### Requirement: Real SQL verification and isolated test data
Backend integration tests SHALL exercise actual SQL Server migration, HTTP read/write and database RowVersion behavior in a designated disposable database. They SHALL NOT reset or delete the shared development database. The suite SHALL verify rejection leaves persisted state unchanged and round-trip preserves all supported properties from the shared complete fixture.

#### Scenario: SQL persistence suite runs
- **WHEN** an explicit test connection to an isolated SQL Server database is supplied
- **THEN** migration, read/write, ownership, status, validation, identity and concurrency scenarios are verified without changing existing development records
