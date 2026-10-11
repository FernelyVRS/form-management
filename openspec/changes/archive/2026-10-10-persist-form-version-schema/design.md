## Context

`adopt-versioned-english-form-schema` delivered strict v1 validation, DTOs, serializers and 54 shared acceptance fixtures. Those modules are not yet consumed by active endpoints. `CreateForm` persists `{}`; `GetFormVersionById` exposes an EF entity on the singular `/version/` route. Frontend structure services point to unimplemented `/estructura` endpoints.

Repeated read-only audit in `sqlserver22` / `form_structure` confirmed three forms and three Draft versions, all with valid JSON `{}`, no duplicate Drafts and no RowVersion column. This remains a point-in-time observation; execution must re-check before migration. Existing worktree changes include frontend work and edits to `GetFormById`; preserve them.

## Goals / Non-Goals

**Goals:**

- Persist/read the approved v1 envelope through explicit English DTOs.
- Reject invalid, immutable-version and stale-token writes without changing data.
- Preserve existing external variables and derived core identity at the server boundary.
- Deploy SQL changes through an explicit repeatable script, not automatic application startup.
- Demonstrate behavior against SQL Server, especially database-generated RowVersion.

**Non-Goals:**

- Migrating frontend state/forms/DnD or introducing autosave.
- Implementing clone/publication endpoints or changing version-status values.
- Supporting legacy schemas, rewriting non-empty historical schemas or deleting mocks.
- Converting all metadata endpoints to English or reorganizing unrelated backend code.
- Adding a one-Draft filtered index or unrelated query indexes in this persistence slice; those belong with version creation rules.

## Decisions

### New plural English schema routes

Create independent Carter slices:

```text
Features/Forms/GetFormVersionSchema/GetFormVersionSchema.cs
Features/Forms/UpdateFormVersionSchema/UpdateFormVersionSchema.cs
```

Routes:

```text
GET /forms/{formId:guid}/versions/{versionId:guid}/schema
PUT /forms/{formId:guid}/versions/{versionId:guid}/schema
```

Queries use both IDs; a version from another form is not found. Reads use `AsNoTracking`. The old singular endpoint is not repurposed into a compatibility reader. No `/estructura` alias is introduced because the frontend will migrate separately.

Direct responses follow the existing forms-list convention instead of adding a `{ data }` wrapper. Response fields are exactly:

```json
{
  "formId": "guid",
  "versionId": "guid",
  "number": 1,
  "status": "Draft",
  "schema": { "schemaVersion": 1, "sections": [] },
  "rowVersion": "base64",
  "updatedAt": null
}
```

PUT body contains exactly `schema` and `rowVersion`. Schema is received as `JsonElement` and passed through the existing serializer/validator. Response schema is an owned JSON element from canonical serialization (or an equivalent explicitly configured converter), avoiding loss of derived field properties from default ASP.NET serialization. EF entities/navigation properties are never returned by these new endpoints.

### Error contract and precedence

Use ProblemDetails with a stable `code` extension. Schema validation additionally includes `issues` containing contract paths/codes/messages.

| Condition | Status | Code |
|---|---|---|
| Malformed JSON/body or missing/invalid token | 400 | `invalid_request` |
| Form/version pair not found | 404 | `version_not_found` |
| Status is not Draft | 409 | `version_not_editable` |
| Stale token or EF concurrency exception | 409 | `schema_conflict` |
| Invalid submitted document or preserved-field violation | 422 | `invalid_schema` |
| Existing stored schema/source cannot be parsed | 500 | `invalid_stored_schema` |

After request-shape checks, resolve ownership, status and token before document/baseline validation. Invalid stored documents cause a controlled server error, not an empty replacement or legacy conversion. Do not echo the raw stored document. Cancellation is forwarded to EF operations.

### SQL RowVersion for optimistic concurrency

Add `byte[] RowVersion` to FormVersion and map with `IsRowVersion()`. SQL owns the value; no timestamp or integer surrogate is used. Base64 encoding/decoding belongs in the API boundary, and token length must be eight bytes.

The PUT compares the supplied token with the loaded version token, validates, and saves using that token as EF's original concurrency value. SQL checks it again during UPDATE. This closes the race between loading and saving; a preliminary comparison alone is insufficient. Catch `DbUpdateConcurrencyException` and return a conflict. Every accepted save sets version `UpdatedAt` to UTC and returns the generated replacement token.

SchemaVersion stays inside the JSON envelope; no duplicate SchemaVersion database column is required. Business `VersionNumber` remains independent.

### Full-document replacement with identity invariants

The current schema is the baseline for retained field IDs: an existing ID cannot change its external variable. For derived versions, also load the source identified by `DerivedFromVersionId` and require each source field with `core: true` to remain with the same ID, variable and core flag. Group/section moves remain permitted if the result is structurally valid.

Pure comparison helpers traverse group fields using canonical DTOs. They validate submitted documents before comparing them. They do not make all fields mandatory or infer missing source fields. A corrupt baseline/source fails as `invalid_stored_schema`. Existing schema validation still rejects dangling dependencies after removal.

No cloning operation is implemented here; seeded derived versions exercise these invariants in tests so future cloning cannot rely on UI-only protection.

### Guarded database-first migration

Prepare `api/FormManagementApi/Database/Migrations/001_PersistFormSchemaV1.sql` with a matching deployment README. Use the existing database-first approach rather than introducing EF migrations.

Before application, stop old API writers, repeat the audit, validate existing non-placeholder documents with the .NET validator and back up the database. Test the script in an explicitly designated disposable database first.

The script verifies the target database/table shape and SQL Server 2022 capabilities, uses `SET XACT_ABORT ON`, and executes its guarded DDL/DML atomically. A lock/precondition prevents concurrent writes while classifying rows. It normalizes only exact trimmed `{}` placeholders. Existing v1 candidates are not rewritten; unknown/non-empty legacy or invalid envelopes abort the transaction. Add RowVersion and named low-level checks only when absent; if an object of the same name/type has incompatible configuration, fail rather than silently skip.

Low-level checks cover valid JSON object root, non-null v1 marker and array-valued sections. SQL checks do not replace full type/property/reference validation: `JSON_VALUE` alone cannot distinguish every JSON numeric/string representation. Ensure SQL UNKNOWN does not allow missing markers to pass. No deep validator UDF or unrelated indices are added.

Repeat execution against a migrated database must preserve schema content and not update rows unnecessarily. No startup auto-migration runs against user data.

### Canonical initialization and existing metadata compatibility

`CreateForm` serializes `new FormSchemaDocument { SchemaVersion = 1, Sections = [] }`. The resulting new version has Draft status, a database-generated RowVersion and empty v1 schema. Existing metadata request/response names are retained and Location is corrected to the real `/forms/{formId}` route. This avoids requiring a frontend creation rewrite in the backend-only slice.

### Integration tests use actual SQL Server

Extend the existing test project with ASP.NET test-host support and an explicit opt-in test connection. Tests use an isolated disposable database in `sqlserver22`, never delete/reset `form_structure`. Apply the migration to a baseline schema with placeholders, then seed uniquely identified forms/versions for HTTP scenarios.

SQLite and EF InMemory cannot establish SQL Server RowVersion semantics, so they are not used to claim concurrency correctness. Test a stale second client after a successful first save and an EF-level concurrent modification between read and write. Verify rejected saves leave schema, timestamp and token unchanged.

Migration tests cover success, repeat application and rollback on unexpected input; malformed/corrupt persisted-document tests use the isolated database and intentionally bypass constraints only within test setup when needed. Contract fixtures remain the source for accepted/rejected v1 content.

## Risks / Trade-offs

- [Old creation code writes `{}` after constraints deploy] -> Stop writers and deploy migration/API together; do not leave the old binary writing after migration.
- [Migration would otherwise convert unexpected data] -> Abort, report classification and require a separate decision instead of rewriting it.
- [Lost field properties in response serialization] -> Use canonical serializer and test JSON equality through GET/PUT.
- [False confidence from fake concurrency tests] -> Require real SQL Server integration with generated RowVersion.
- [Mutating shared development data during tests] -> Require a dedicated disposable test database and explicit connection.
- [Downgrade after saving v1 data] -> Keep the migration/API release paired; rollback via backup only before new writes, or retain migrated data/API while fixing forward.

## Migration Plan

1. Verify completed contract modules and repeat read-only SQL audit.
2. Implement/review scripts, entity mapping, slices and tests without auto-applying SQL.
3. Run migration and integration tests in an isolated database.
4. Back up `form_structure`, stop old writers, confirm authorized local migration and apply the reviewed script.
5. Deploy the API, GET all existing versions and verify canonical empty documents/tokens.
6. Record counts, schema shape and deployment outcome. Proceed to frontend builder migration separately.

Do not automatically downgrade v1 documents to `{}`. A database restore would remove later edits and is appropriate only with an explicit rollback decision; RowVersion tokens also change after restoration and clients must reload.

## Open Questions

None blocking proposal readiness. The explicit disposable test connection and deployment authorization are execution prerequisites; the current development volume must not be reset.
