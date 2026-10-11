# Persistence v1 implementation results

## Delivered

- Guarded SQL Server 2022 migration with transactional placeholder normalization, generated RowVersion, trusted low-level schema check, and repeat-execution validation.
- Explicit EF concurrency mapping and required nvarchar(max) SchemaJson.
- Canonical initial creation and corrected form Location, retaining metadata naming.
- New Carter GET/PUT schema routes with English direct responses and structured schema JSON.
- Controlled 400/404/409/422/500 problems, Draft-only writes, full v1 validation, retained variable checks and derived source core preservation.
- Original RowVersion enforced in SQL UPDATE; EF concurrency exceptions return schema_conflict.
- Opt-in isolated SQL Server/HTTP tests using actual generated rowversion and deterministic EF-save races.

## Verification

- Baseline contract tests: 57 passed before implementation.
- Final backend suite with FORM_SCHEMA_TEST_SQL enabled: 68 passed, 0 skipped, including 11 SQL integration tests.
- `dotnet build api/FormManagementApi.sln --no-restore`: success, 0 errors; existing NuGet OpenApi advisory remains.
- Integration tests cover migration conversion/repeat, refusal, rollback after DDL failure, low-level constraint rejection, canonical creation/read-back, foreign IDs, bad requests/schemas, immutable statuses, invalid stored/source documents, core/variable preservation, intact group-field moves and both concurrency races.
- Shared complete fixture retains descriptions, groups, validation and dependency maps through PUT/GET.
- `git diff --check` and strict OpenSpec change validation pass; scoped diff confirms the old mock/frontend and pre-existing GetFormById edits are preserved.

## Authorized local deployment

The user's implementation request authorized the migration described by this change. Preflight confirmed exactly 3 forms and 3 Draft version-1 records with `{}`, no RowVersion, no derivation links. No active API writer process existed during deployment.

COPY_ONLY/CHECKSUM backup and RESTORE VERIFYONLY succeeded:

`sqlserver22:/var/opt/mssql/data/form_structure_before_schema_v1_2026-10-01_16-32-00.bak`

Migration reported VersionCount=3 and ConvertedPlaceholders=3. IDs, statuses, business numbers, CreatedAt, UpdatedAt and derivation links were retained. RowVersion tokens are eight bytes. CK_FormVersions_SchemaV1 is enabled and trusted.

The API was started with the HTTP development profile on `http://localhost:5165`; all three new schema GETs and the existing forms list returned successfully. No test data was written to form_structure. PUT/create scenarios were exercised only in disposable databases.

Local API process was launched using `dotnet run --no-build --project FormManagementApi/FormManagementApi.csproj --launch-profile http` from api. Logs are in the approved temporary directory as `api-schema-v1.stdout.log` and `api-schema-v1.stderr.log`.

## Environment finding and scope

The local model database already contains Forms/FormVersions; newly created databases inherit them. Tests reset only those inherited copies in their own generated form_schema_tests_<guid> databases and drop only these owned databases afterward. No model or shared development reset was performed. All test databases were cleaned up.

The legacy mock and frontend runtime were not changed. Existing user work, including GetFormById edits, remains present. Next change: migrate-form-builder-to-schema-v1 for API hooks, version-scoped draft, explicit Save, CRUD/groups/descriptions and DnD. Renderer integration follows separately.
