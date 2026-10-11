## Context

Schema v1 persistence (`persist-form-version-schema`) is implemented: GET/PUT schema endpoints with RowVersion optimistic concurrency, Draft-only writes, shared validator/serializer and migration `001_PersistFormSchemaV1.sql` applied locally. The lifecycle is not: `Features/Forms/CreateFormVersion/CreateFormVersion.cs` is an empty stub with no route, and there are no publish, archive or clone endpoints. The frontend `FormDetailPage` hardcodes a `v1.0.0 / Publicada` summary with imperative loading, `VersionModal` is mounted with no opener control, and the lifecycle services in `web/src/features/forms/api/` still expect a legacy `json.data` wrapper.

The last read-only audit of `sqlserver22` / `form_structure` shows 1 form, 1 Draft version, no Published, no duplicate Draft/Published, unique `(FormId, VersionNumber)` present, and no filtered Draft/Published indexes. That audit is a point-in-time snapshot; it must be repeated before any migration. Existing worktree changes (frontend builder work, edited `GetFormById`, untracked tests) belong to other in-flight work and must be preserved.

Business rules already confirmed: at most one Draft and one Published per form (not necessarily both); publishing a Draft archives the previous Published atomically; manual archive is Draft-only, preserving rows, schema, number and provenance; Published/Archived are the only derivation sources for a new version or cloned form; Archived is terminal and recoverable only by deriving a new Draft; publishing requires a valid v1 schema and at least one question, counting fields inside groups, with no per-section requirement; copies preserve `variable`, `core`, IDs, descriptions, validations, options and maps; explicit Save stays and the builder never publishes unsaved local state.

## Goals / Non-Goals

**Goals:**

- Complete the lifecycle end to end: derive a version, clone a form, publish and archive, with atomic per-form transitions.
- Enforce single Draft/Published invariants in SQL (filtered unique indexes) and in handlers, with transactional form-level coordination and `MAX(VersionNumber) + 1` numbering including Archived.
- Return explicit English DTOs, direct responses and stable ProblemDetails codes; never expose EF entities.
- Deliver migration `002` database-first, transactional, repeatable and aborting on conflicting data, tested on isolated databases in `sqlserver22`.
- Replace the frontend's fictional publication summary with real lifecycle data, per-state actions, confirmations and recoverable conflicts.
- Prove the behavior with backend integration tests on real SQL Server and frontend tests of commands, states and errors.

**Non-Goals:**

- Answer renderer, response capture or any change to the v1 schema contract.
- Legacy editor cleanup (`remove-legacy-form-editor`), package pruning, or archived OpenSpec sync.
- Restoring Archived versions directly, soft-deleting forms, or form-level metadata editing.
- Rewriting historical timestamps in UTC or renaming all legacy metadata DTOs.
- Autosave, optimistic UI publication, or background jobs.

## Decisions

### Lifecycle transitions and invariants

```text
Draft -- publish --> Published -- publish replacement --> Archived
  |
  +-- archive --> Archived

Published | Archived -- derive (new version | new form) --> new Draft
```

At most one Draft and one Published per form, enforced by filtered unique indexes and re-checked inside each command transaction. Archived is terminal: no status transition out of Archived; recovery is always derivation. Publishing a Draft when another Published exists archives the previous one first, in the same transaction, to avoid violating the Published index. Manual archive accepts only Draft; archiving a Published is rejected even though publishing replaces it implicitly.

### Endpoints and slices

| Operation | Route | Slice |
|---|---|---|
| Create version from version | `POST /forms/{formId:guid}/versions` | `PublishFormVersion` sibling: `CreateFormVersion` (completed) |
| Create form from version | `POST /forms/from-version` | `CreateFormFromVersion` |
| Publish Draft | `POST /forms/{formId:guid}/versions/{versionId:guid}/publish` | `PublishFormVersion` |
| Archive Draft | `POST /forms/{formId:guid}/versions/{versionId:guid}/archive` | `ArchiveFormVersion` |

Each command is its own Carter slice with explicit English DTOs and a direct response (no `{ data }`), matching the forms-list and schema persistence conventions. Both IDs are always resolved together; a version belonging to another form is `404`. Success responses return `Location` pointing at the canonical resource (`/forms/{formId}` or `/forms/{formId}/versions/{versionId}/schema`) so the UI can navigate with validated IDs.

### Command contracts

- `CreateFormVersion` request: `{ "sourceVersionId": "guid" }`. Source must be Published or Archived and belong to the same form; a Draft source is rejected; creation is rejected if another Draft already exists for the form. The stored schema snapshot is parsed with the existing serializer, validated, copied verbatim (ids, variables, core, descriptions, validations, options, maps) and the new Draft records `DerivedFromVersionId`. The source is never modified.
- `CreateFormFromVersion` request: `{ "name": "string", "description": "string|null", "sourceFormId": "guid", "sourceVersionId": "guid" }`. Same source-state rules. Creates a new Form plus its Draft version 1 atomically, copying the validated snapshot, and persists form-level provenance (`SourceFormId`/`SourceVersionId` nullable columns added by migration `002`) plus the inherited core-protection baseline. The two snapshots are physically independent documents.
- `PublishFormVersion` and `ArchiveFormVersion` requests carry `{ "rowVersion": "base64" }`, required. Publish loads the Draft, verifies the token against the stored RowVersion, re-validates the stored v1 document, requires at least one question (fields at any depth, including inside groups), re-validates derived core identity, archives the previous Published if any, promotes the Draft and commits both writes together.
- Responses for all four commands share a version-summary shape: `formId`, `versionId`, `number`, `status`, `derivedFromVersionId`, `rowVersion` (base64), `createdAt`, `updatedAt`; publish additionally returns `archivedVersionId` (nullable) when a previous Published was replaced; clone additionally returns the new `formId`/`versionId` pair and provenance.

### ProblemDetails contract

Stable `code` extension on ProblemDetails; rejections never leave partial writes.

| Condition | Status | Code |
|---|---|---|
| Malformed body, missing/invalid token or unknown keys | 400 | `invalid_request` |
| Form/version pair missing or version not in the form | 404 | `version_not_found` |
| Source form missing for clone | 404 | `form_not_found` |
| Source is a Draft, or a Draft already exists, or status transition not allowed | 409 | `invalid_version_state` |
| Stale `rowVersion` or database concurrency failure | 409 | `version_conflict` |
| Stored schema invalid or unpublishable (zero questions) | 422 | `not_publishable` |
| Derived-core/variable invariant broken | 422 | `schema_identity_violation` |
| Stored schema cannot be parsed | 500 | `invalid_stored_schema` |

Request-shape checks run first; ownership and state before schema work; token comparison before mutation. Concurrency failures surface as `version_conflict` and the UI refreshes the authorized state.

### Transactional coordination and numbering

Every mutating command runs inside an explicit transaction that first locks the parent `Form` row (`SELECT ... FOR UPDATE`-equivalent via `UPDLOCK, HOLDLOCK` raw SQL executed through the same `AppDbContext` connection/transaction) so two commands on the same form serialize. Version numbers are assigned as `MAX(VersionNumber) + 1` over all versions of the form including Archived, computed only after the lock is held; numbers are never reused. RowVersion continues to protect individual row updates; the filtered unique indexes are the last line of defense and turn residual races into controlled constraint failures surfaced as `version_conflict`. Multi-row transitions (publish + archive-previous) use explicit `SaveChangesAsync` calls within the same transaction and commit once; any failure rolls the whole command back (verified by an injected-failure test).

### Migration 002: filtered indexes, check, provenance columns

`api/FormManagementApi/Database/Migrations/002_FormVersionLifecycleGuardrails.sql`, following the `001` guarded style:

- Add nullable `SourceFormId`/`SourceVersionId` (Guid) to `Forms` for clone provenance, with FK to `Forms`/`FormVersions` set to NO ACTION and no cascade delete.
- Add unique filtered index `UX_FormVersions_Draft` on `(FormId)` where `Status = 'Draft'`, and `UX_FormVersions_Published` on `(FormId)` where `Status = 'Published'`.
- Add check `CK_FormVersions_VersionNumberPositive` on `VersionNumber > 0`.
- Reflect all of the above in `AppDbContext` (`HasFilter`/`HasCheckConstraint`/navigation configuration).
- The script is transactional, repeatable and precondition-guarded: it aborts with a classified report if conflicting duplicate Draft/Published rows exist or an incompatible same-named object is present, instead of choosing winners. Pre-application audit re-checks duplicates and states in the target database; application requires backup and paused writers, after isolated-database rehearsal.

### Frontend data flow and management UI

- One lifecycle API module in `web/src/features/forms/api/` with Zod schemas, `requestJson` from `web/src/lib/api/`, encoded GUIDs in URLs, direct-response parsing and structured ProblemDetails errors; no `json.data`.
- One form-detail query (AbortSignal-aware, keys by formId) shared by `FormDetailPage`, builder metadata and clone-source loading, replacing the imperative load in the detail page and eliminating its `useEffect` lint warning.
- `FormDetailPage` shows: current publication (or "Sin publicación"), available Draft ("Continuar borrador"), latest version by number (distinct from the published one) and the ordered history. Actions per state: Draft → Editar, Publicar, Archivar borrador; Published/Archived → Ver estructura, Nueva versión, Clonar formulario. `View Live` is renamed `Ver estructura`.
- `VersionModal` gains a real opener (Nueva versión) and its source list becomes Published + Archived (Draft excluded per the `version-status-contract` delta), with loading/error/retry/empty states and last-selection-wins protection against stale responses. A concurrent Draft switches the primary action to Continuar borrador.
- Publish/archive open confirmation dialogs (cancel performs no request), disable while pending to allow a single in-flight request, keep name/description on clone errors, and navigate only with IDs validated from the response. Conflicts (`version_conflict`, `existing draft`) show actionable Spanish copy and refresh the authoritative state; local unsaved builder state is never silently overwritten and explicit Save remains the only write path to schemas.

### Testing strategy

Backend: extend the opt-in SQL integration host (`SqlSchemaTestHost`, `FORM_SCHEMA_TEST_SQL`, disposable databases in `sqlserver22`) covering: derivation from Published/Archived with byte-identical schema copies and provenance; Draft source and foreign/missing version rejections; existing-Draft conflict; numbering across Archived; initial publish and atomic replacement of a previous Published; publish rejection for empty/invalid schemas and broken core identity; Draft-only archive; stale tokens and races between save/publish/archive; two concurrent creations never duplicating Draft or numbers; full rollback on injected mid-transaction failure; migration idempotence, abort-on-conflict and constraint enforcement; refreshed timestamps/tokens only on accepted commands.

Frontend: Vitest for parsers/route building/request bodies and per-state action matrices; Playwright for modal opening from the detail page, source eligibility, cancelled confirmations without POST, single request while pending, navigation and cache invalidation, Continue-draft flow and conflict recovery — following the harness conventions already used by the focused workspace/builder suites.

## Risks / Trade-offs

- [Filtered indexes fail to deploy because hidden duplicates exist] → Re-audit immediately before application; abort with classification and require an explicit human decision; never auto-archive winners.
- [Two simultaneous commands race past the handler check] → Form-row lock serializes same-form commands; indexes turn residual races into constraint failures mapped to `version_conflict`.
- [Publish promotes a schema that later fails identity checks] → Re-validate stored document and derived core inside the transaction before any mutation; 422 with no writes.
- [Clone snapshot loses derived properties through default serialization] → Copy via the canonical serializer round-trip and assert JSON equality in tests, as done for schema persistence.
- [UI refresh clobbers an unsaved builder draft] → Lifecycle queries never write into the builder store; the builder keeps its version-scoped draft and explicit Save; metadata refreshes only presentation state.
- [Migration deployed while an old API binary still writes] → Stop writers, deploy migration and API as a paired change; migration is the only schema writer.
- [Stale modal responses replace a newer selection] → AbortSignal cancellation plus request-sequence guard in the source selector.

## Migration Plan

1. Re-audit `form_structure` (duplicates, statuses, numbers, existing indexes/checks) and confirm the worktree baseline.
2. Implement migration `002`, EF mapping, slices and tests; rehearse the script against a disposable database derived from the current shape, including abort-on-conflict paths.
3. Run the full backend suite plus new lifecycle integration tests; run frontend build/lint/tests.
4. With authorization: back up `form_structure`, stop writers, apply `002`, deploy the API, verify existing rows unchanged and commands behave against the test form (`ea007cc2-...`).
5. Deploy the frontend; verify the detail page drives real data and the full Draft → publish → derive → archive cycle works locally.
6. Record results in `implementation-results.md`; any later rollback is a restore decision only, since new lifecycle data cannot be downgraded in place.

## Open Questions

None blocking. Deployment authorization for `form_structure` and the disposable test connection value remain execution prerequisites, as with `001`.
