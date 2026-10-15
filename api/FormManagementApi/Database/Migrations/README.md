# Schema v1 persistence deployment

`001_PersistFormSchemaV1.sql` is an explicit SQL Server 2022 database-first migration. The API does not run it on startup.

`002_FormVersionLifecycleGuardrails.sql` adds the lifecycle guarantees: `Forms.SourceFormId`/`Forms.SourceVersionId` provenance columns with foreign keys, unique filtered indexes `UX_FormVersions_Draft` and `UX_FormVersions_Published` (one Draft and one Published per form), and `CK_FormVersions_VersionNumberPositive`.

## Reproducible bootstrap (Compose)

For a fresh environment, the repository provides an opt-in Docker Compose stack (`compose.yml`, SQL Server 2022 Developer pinned by CU tag) and a scripted bootstrap that applies the same files documented below:

1. Copy `.env.example` to `.env` and set `MSSQL_SA_PASSWORD` (and `MSSQL_PORT` if 1433 is already used by another instance, e.g. a pre-existing `sqlserver22` container).
2. `docker compose --env-file .env up -d`
3. `.\scripts\init-local-db.ps1` — waits for readiness, creates `form_structure`, applies `NewFile1.sql` (skipped if tables exist) and then `001` and `002` with `sqlcmd -b`. The script is repeatable and accepts `-Project` to target another compose project (rehearsals).

The script executes the very files referenced in the procedure below; it does not maintain a divergent copy and never runs at API startup.

Note: sqlcmd sessions run with `QUOTED_IDENTIFIER OFF`. Re-running `001` after `002` is applied requires `SET QUOTED_IDENTIFIER ON;` in the session (the bootstrap script prepends it automatically); without it the `UPDATE dbo.FormVersions` in `001` fails with Msg 1934 because of the filtered indexes added by `002`.

## Procedure (manual)

1. Select the intended database explicitly. Inspect Forms/FormVersions, schema content, statuses and existing columns/constraints.
2. Validate every non-placeholder document with `FormSchemaSerializer.Parse`. The SQL preflight checks only envelope markers; it is not a deep v1 validator. Unexpected documents require a separate decision, not automatic conversion.
3. Run SQL integration tests in disposable databases against the Compose SQL Server (see below).
4. Stop old API writers. Back up the selected development database with SQL Server `BACKUP DATABASE ... WITH COPY_ONLY, CHECKSUM`, then `RESTORE VERIFYONLY` the backup.
5. Apply the script with `sqlcmd -b -d form_structure -i 001_PersistFormSchemaV1.sql`, using the approved SQL connection. `-b` is important so SQL failures stop deployment.
6. Deploy the API with RowVersion mapping and canonical initial creation together; the old binary must not resume writing `{}`.
7. GET all existing versions using the new schema endpoint. Verify document shape, eight-byte token, IDs, business numbers, statuses and counts.

The script takes a transaction/table lock, converts only exact trimmed `{}`, and adds RowVersion plus a named trusted check constraint. Unexpected input or incompatible objects cause rollback. Repeat execution preserves documents and tokens, since it updates only remaining placeholders. Metadata, timestamps and derivation links are not changed by normalization.

Low-level checks enforce an object root, v1 marker and sections array. Full property typing, references and cycles remain validated in .NET. SQL JSON_VALUE does not distinguish every numeric/string marker representation; SQL checks are not the canonical validator.

Do not downgrade populated v1 documents to `{}`. Restore a backup only with an explicit rollback decision: it discards later edits and invalidates client tokens. Prefer fixing forward after new writes.

## Lifecycle guardrails deployment (002)

1. Re-audit the target: duplicate Draft/Published rows per form, `VersionNumber <= 0` rows, existing indexes/constraints with the same names.
2. Stop API writers, back up the database, rehearse the script on a disposable database in the Compose SQL Server.
3. Apply with `sqlcmd -b -d form_structure -i 002_FormVersionLifecycleGuardrails.sql` and deploy the matching API build in the same window.

The script aborts and rolls back if duplicate Draft/Published rows or non-positive version numbers exist: conflicting data requires an explicit human decision and is never resolved automatically. Repeat execution is safe: columns, foreign keys, indexes and the check are only added when absent, and same-named incompatible objects fail the run. The table lock prevents lifecycle writers from inserting mid-classification. Nothing existing is rewritten.

## API

```text
GET /forms/{formId}/versions/{versionId}/schema
PUT /forms/{formId}/versions/{versionId}/schema
```

GET and successful PUT return a direct object with `formId`, `versionId`, `number`, `status`, structured `schema`, base64 `rowVersion`, and nullable UTC `updatedAt`. PUT body must contain exactly `schema` and `rowVersion`; decode must produce eight bytes. Published/Archived versions cannot be edited.

Errors use ProblemDetails with `code`: 400 `invalid_request`, 404 `version_not_found`, 409 `version_not_editable` / `schema_conflict`, 422 `invalid_schema` (with path-bearing `issues`), or controlled 500 `invalid_stored_schema`. Schema uses the [v1 contract](../../../../contracts/form-schema/v1/README.md).

## Isolated SQL tests

Set `FORM_SCHEMA_TEST_SQL` to a SQL Server connection with database-creation permission and `Initial Catalog=form_schema_tests`. Use secrets from the local environment, never commit credentials. Each test creates a unique `form_schema_tests_<guid>` database and drops only that database on disposal. The supplied catalog is a test namespace marker and is never reset. Any other catalog is refused. Without the variable, SQL tests are explicitly skipped; pure contract tests still run.

The expected target is the Compose SQL Server instance (host port from `.env` `MSSQL_PORT`, e.g. `14331` locally). Creating and dropping the disposable test databases on that instance is allowed; never point the tests at `form_structure` or reset volumes.

```powershell
$env:FORM_SCHEMA_TEST_SQL = 'Server=localhost,14331;Database=form_schema_tests;User Id=sa;Password=<MSSQL_SA_PASSWORD de .env>;TrustServerCertificate=True;Encrypt=True'
dotnet test api/FormManagementApi.Tests/FormManagementApi.Tests.csproj
```

The suite uses actual SQL Server and ASP.NET TestServer, including a deterministic concurrent database update immediately before an EF save. It never deletes or resets `form_structure`.
