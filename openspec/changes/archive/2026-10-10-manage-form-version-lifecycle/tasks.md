## 1. Contract And Preparation

- [x] 1.1 Re-read the confirmed lifecycle rules and the shared serializer/validator modules; document the English request/response DTOs, ProblemDetails codes and precedence used by all four commands.
- [x] 1.2 Repeat the read-only `sqlserver22` audit (statuses, duplicates, numbers, existing indexes/checks, RowVersion) and record the results before any schema change.

## 2. Migration 002 And EF Mapping

- [x] 2.1 Write `002_FormVersionLifecycleGuardrails.sql` adding `SourceFormId`/`SourceVersionId` to `Forms`, filtered unique indexes for Draft and Published per `FormId`, and the `VersionNumber > 0` check, with preconditions and `SET XACT_ABORT ON`.
- [x] 2.2 Make the script transactional and repeatable, aborting with a classified report on conflicting duplicate Draft/Published rows or incompatible same-named objects.
- [x] 2.3 Update the migrations README with audit, backup, writer-downtime, rehearsal and rollback guidance for `002`.
- [x] 2.4 Reflect the filtered indexes, check constraint and provenance columns/navigation in `AppDbContext` and entities.
- [x] 2.5 Rehearse the script on a disposable database in `sqlserver22`, including idempotent re-run and abort-on-conflict paths.

## 3. Backend Lifecycle Commands

- [x] 3.1 Add shared helpers: form-row lock within an explicit transaction, `MAX(VersionNumber) + 1` assignment, canonical snapshot copy preserving ids/variables/core/descriptions/validations/options/maps, and question counting including grouped fields.
- [x] 3.2 Implement `PublishFormVersion`: ownership/status/token resolution, stored v1 validation, publish minimum, derived-core revalidation, atomic archive-previous-then-promote, UTC timestamps and refreshed tokens.
- [x] 3.3 Implement `CreateFormVersion`: same-form Published/Archived source, Draft source and existing-Draft rejections, validated snapshot copy with `DerivedFromVersionId`, sequential numbering and `Location` for builder navigation.
- [x] 3.4 Implement `CreateFormFromVersion`: source validation, atomic Form + Draft v1 creation, snapshot copy, provenance columns and inherited core protection, returning new form/version identifiers.
- [x] 3.5 Implement `ArchiveFormVersion`: Draft-only status change preserving number/schema/provenance with refreshed token; reject Published with `invalid_version_state`.
- [x] 3.6 Wire ProblemDetails responses with the stable codes for every rejection path and confirm no partial writes on failures.
- [x] 3.7 Update form detail reads to order versions by number and distinguish latest version from current publication for the management UI.

## 4. Backend Lifecycle Integration Tests (Real SQL Server)

- [x] 4.1 Extend `SqlSchemaTestHost` scenarios: apply `002` to a disposable baseline and seed forms/versions for lifecycle HTTP tests.
- [x] 4.2 Test derivation from Published and Archived with full snapshot equality, provenance fields and untouched sources; test Draft/foreign/missing source rejections.
- [x] 4.3 Test existing-Draft conflict, numbering across Archived versions and two concurrent derivations without duplicate Drafts or numbers.
- [x] 4.4 Test initial publish and atomic replacement of a previous Published; rejection for empty schema, invalid stored schema and broken core identity.
- [x] 4.5 Test Draft archive preservation and Published archive rejection; stale-token conflicts for publish and archive.
- [x] 4.6 Test rollback on an injected failure after archiving the previous Published, and verify rejections leave statuses/schemas/tokens unchanged.
- [x] 4.7 Test migration idempotence, abort-on-conflict classification and constraint enforcement of the filtered indexes and check.

## 5. Frontend Lifecycle Data And Commands

- [x] 5.1 Create the lifecycle API module in `features/forms/api/` with Zod schemas, `requestJson`, encoded IDs, direct-response parsing and ProblemDetails error mapping; remove `json.data` expectations from migrated services.
- [x] 5.2 Add the shared form-detail query with AbortSignal support and identity-based keys; reuse it in `FormDetailPage`, builder metadata and clone-source loading, replacing the imperative detail load.
- [x] 5.3 Add publish/archive/derive/clone mutations with pending controls, no automatic retries and invalidation of list, detail and schema caches.

## 6. Frontend Management UI

- [x] 6.1 Replace the hardcoded publication summary in `FormDetailPage` with real publication, Draft, latest-version and ordered history data, including the "Sin publicación" state.
- [x] 6.2 Implement per-state actions (Editar/Publicar/Archivar borrador; Ver estructura/Nueva versión/Clonar formulario) with confirmations that cancel without a request and disable while pending.
- [x] 6.3 Wire the `VersionModal` opener (Nueva versión), Published+Archived sources with loading/error/retry/empty states and stale-response protection; offer Continuar borrador when a Draft exists.
- [x] 6.4 Implement the clone flow preserving name/description on errors and navigating with validated response identifiers; rename View Live to Ver estructura.
- [x] 6.5 Surface `version_conflict` and `invalid_version_state` as actionable Spanish messages that refresh authoritative state without clobbering unsaved builder drafts.

## 7. Frontend Tests

- [x] 7.1 Add Vitest coverage for lifecycle parsers, route/request bodies, ProblemDetails mapping and the per-state action matrix.
- [x] 7.2 Add Playwright coverage: modal opening from detail, source eligibility (Published/Archived only), cancelled confirmation without POST, single request while pending and Continue-draft navigation.
- [x] 7.3 Add Playwright coverage for clone error preserving input, success navigation with response IDs and conflict recovery refresh.

## 8. Verification And Closure

- [x] 8.1 Run backend build and the full test suite including the new lifecycle SQL integration tests; resolve regressions from this change.
- [x] 8.2 Run frontend `pnpm build`, lint and the focused Playwright suites plus new lifecycle tests; confirm detail-page `useEffect` warning is gone.
- [x] 8.3 With authorization: back up `form_structure`, stop writers, apply `002`, deploy API and verify existing data plus the full cycle against the local test form.
- [x] 8.4 Review the scoped diff preserving unrelated worktree changes and the legacy mock; record results in `implementation-results.md` and update status/backlog docs.
