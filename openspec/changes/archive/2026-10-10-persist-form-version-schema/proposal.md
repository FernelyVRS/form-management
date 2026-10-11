## Why

The English v1 contract and cross-runtime validators are implemented, but versions still store `{}` and there is no working schema read/write flow. Durable validated persistence with optimistic concurrency is the prerequisite for migrating the builder to explicit Save.

## What Changes

- Add canonical schema GET/PUT endpoints at `/forms/{formId}/versions/{versionId}/schema`, with English direct-response DTOs.
- Validate documents using the existing v1 validator before writes and on reads; never expose EF entities or escaped schema strings through the new endpoints.
- Permit full-document replacement only for Draft versions and return conflicts instead of overwriting concurrent edits.
- Add SQL Server RowVersion mapped as an EF concurrency token and exchanged as base64 outside the schema document.
- **BREAKING deployment prerequisite**: Introduce a versioned, guarded SQL migration to normalize known empty `{}` placeholders into v1 envelopes and add RowVersion plus low-level JSON/envelope checks.
- Initialize newly created versions with the canonical empty document using the existing serializer.
- Preserve external variables on retained field IDs and source core fields for derived versions at the write boundary.
- Add real SQL Server integration tests for valid saves, rejected writes, read-back and concurrency, alongside existing contract tests.

## Capabilities

### New Capabilities

- `form-version-schema-persistence`: Canonical version schema retrieval, Draft-only validated replacement, concurrency, canonical creation and guarded SQL deployment.

### Modified Capabilities

None. This change consumes `form-schema-contract` from the completed `adopt-versioned-english-form-schema` change without redefining its structure. List retrieval and status values remain unchanged.

## Impact

- Affects FormVersion EF entity/mapping, initial form creation, new Carter vertical slices, versioned SQL scripts and backend tests.
- Existing creation metadata request/response names remain compatible; only the persisted initial schema and incorrect creation Location are corrected.
- Uses the existing schema serializer/validator and SQL Server provider. Integration test tooling may add ASP.NET test-host dependencies.
- No frontend API/store/builder migration, legacy schema reader, automatic production startup migration, cloning endpoint or publication workflow is included.
- Current SQL audit shows three Draft version-1 rows containing `{}` and no RowVersion; re-audit and backup precede migration execution.
