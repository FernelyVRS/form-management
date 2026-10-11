## 1. Contract And Deployment Preparation

- [x] 1.1 Confirm the completed v1 validator/serializer and baseline backend tests, and re-read files with existing worktree edits before changing them.
- [x] 1.2 Repeat the read-only `sqlserver22` audit of schemas, statuses, RowVersion and table shape; record counts and flag unexpected data.
- [x] 1.3 Document English GET/PUT DTOs, ProblemDetails codes and request/token validation without changing existing metadata naming.

## 2. Database Migration And EF Mapping

- [x] 2.1 Add the versioned transactional SQL script with guarded placeholder normalization, RowVersion and low-level object/v1-marker/sections-array checks.
- [x] 2.2 Make the script repeatable and detect incompatible existing columns/constraints or unexpected documents before leaving any changes.
- [x] 2.3 Document explicit target selection, preflight canonical validation, backup, writer downtime, deployment order and rollback limitations in the migration README.
- [x] 2.4 Add FormVersion RowVersion and EF `IsRowVersion()` mapping plus explicit required nvarchar(max) SchemaJson configuration.

## 3. Canonical Reads And Initialization

- [x] 3.1 Add shared response/ProblemDetails helpers that return owned structured schema JSON, English metadata and base64 tokens without exposing EF entities.
- [x] 3.2 Implement GET schema in its own Carter slice using both IDs, cancellation, no tracking, v1 parsing, 404 and controlled corrupt-document handling.
- [x] 3.3 Change initial form creation to canonical empty-schema serialization and correct Location while preserving existing metadata request/response names.

## 4. Validated Draft Writes

- [x] 4.1 Add pure retained-variable and derived-source-core comparison helpers with tests including grouped/moved fields and corrupt baseline behavior.
- [x] 4.2 Implement strict PUT body parsing and eight-byte base64 token validation with consistent 400 ProblemDetails.
- [x] 4.3 Implement matched-version loading, Draft-only checks, current-token checks and full structural/semantic v1 validation with path-bearing 422 issues.
- [x] 4.4 Integrate baseline/source preservation checks, UTC UpdatedAt and full-document serialization before saving.
- [x] 4.5 Use supplied original RowVersion in the EF update predicate, handle database concurrency failures as 409 and return refreshed generated tokens.
- [x] 4.6 Document endpoint success/error responses in OpenAPI with the exact direct JSON contract.

## 5. Isolated SQL Server Integration Tests

- [x] 5.1 Add explicit opt-in SQL test connection and ASP.NET test-host setup using a designated disposable database without resetting form_structure.
- [x] 5.2 Test migration placeholder conversion, metadata preservation, generated RowVersion and repeat execution against the baseline table schema.
- [x] 5.3 Test transactional migration refusal on unexpected input and low-level checks rejecting malformed/object-marker/sections failures.
- [x] 5.4 Test create-form initialization, GET completeness, missing/foreign ownership and controlled invalid stored-schema errors.
- [x] 5.5 Test PUT/save/read-back with the shared complete fixture, including descriptions, validations, group fields and dependent map content.
- [x] 5.6 Test malformed body/token, unknown body keys, invalid schema/dependencies/maps and Published/Archived rejection, checking persisted content/token/timestamp remain unchanged.
- [x] 5.7 Test retained variable changes, derived core removal/flag changes and valid intact field moves at the HTTP boundary.
- [x] 5.8 Test stale second-client saves and EF-level race between load/update using real SQL RowVersion, verifying the winning data is retained.

## 6. Authorized Local Deployment And Verification

- [x] 6.1 Run backend build, existing shared-fixture tests and the SQL integration suite; resolve regressions introduced by this change.
- [x] 6.2 Repeat preflight on form_structure, confirm explicit local database-change authorization, take backup and pause old writers before applying the reviewed migration.
- [x] 6.3 Apply the tested migration to the authorized local target, deploy the API and GET the existing versions to verify preserved counts and canonical documents/tokens.
- [x] 6.4 Update status, backlog and development docs with migration results, endpoint commands and the next builder integration boundary.
- [x] 6.5 Review scoped diff to preserve mocks/frontend/user edits, validate OpenSpec and record test/deployment results before marking the change complete.
