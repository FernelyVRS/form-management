# Form version lifecycle implementation

## Delivered

- Migration `002_FormVersionLifecycleGuardrails.sql`: `Forms.SourceFormId`/`SourceVersionId` with FKs, filtered unique indexes `UX_FormVersions_Draft`/`UX_FormVersions_Published`, check `CK_FormVersions_VersionNumberPositive`. Guarded, transactional and repeatable; aborts with 51001/51002/51003/51004. Rehearsed on disposable DBs (apply, idempotence, all abort paths rollback fully).
- EF mapping: provenance properties, filtered indexes, check constraint and non-generic FK builders.
- Slices: `CreateFormVersion`, `PublishFormVersion`, `ArchiveFormVersion`, `CreateFormFromVersion` plus shared `LifecycleShared.cs` (provenance rows, ProblemDetails codes, lock/numbering/question-count/serialization helpers). Per-form row lock (`UPDLOCK, HOLDLOCK`) and explicit transactions; numbering includes Archived; publish archives the previous Published atomically; manual archive is Draft-only; derivation accepts Published/Archived only; Archived is terminal.
- Stable ProblemDetails codes: `invalid_request`, `version_not_found`, `form_not_found`, `invalid_version_state`, `version_conflict`, `not_publishable`, `schema_identity_violation`, `invalid_stored_schema`.
- `GetFormById` now returns ordered versions including `rowVersion` (base64) and 404 for missing forms.
- Frontend: `formLifecycleApi.ts` (Zod, `requestJson`, encoded IDs, direct responses, ProblemDetails mapping), `useFormLifecycle.ts` (shared detail query with AbortSignal, identity-based keys, publish/archive/derive/clone mutations with `retry: false` and cache invalidation). `getFormByIdWithVersions` removed; builder metadata, detail page and clone-source loading share `useFormDetailQuery`.
- Management UI: real publication summary (including "Sin publicación"), Draft/latest/history; per-state actions (Editar/Publicar/Archivar; Ver estructura/Crear versión/Clonar formulario); confirmations that cancel without requests; `VersionModal` with Published+Archived-only sources, empty/error states and stale-selection protection; "Continuar borrador" when a Draft exists; clone dialog preserving input on errors and navigating with validated response ids; conflict/`invalid_version_state` messages refresh authoritative state.
- Version status contract: derivation sources are Published and Archived; Draft is excluded (spec delta in `version-status-contract`).

## Verification

- Backend: build succeeded (6 pre-existing warnings). `dotnet test` with `FORM_SCHEMA_TEST_SQL`: **83/83 passed**, including 15 new lifecycle SQL integration tests; temporary test databases cleaned up.
- Frontend: `pnpm build` success; `pnpm lint` 0 errors (5 pre-existing warnings, none from this change's files); `pnpm test:unit` **85/85** (22 new lifecycle tests: parsers, routes/bodies, ProblemDetails mapping, action matrix).
- Playwright: new `tests/form-version-lifecycle.spec.ts` **8/8 passed** (modal sources, cancelled confirmation without POST, single request while pending, conflict recovery refresh, Continue-draft navigation, clone error keeps input, clone success navigation). Focused suites form-list/builder-workspace/form-builder-v1: **20/20 passed** after adding `rowVersion` to their detail mocks. Full run: only legacy tab-UI suites (`question-*`, `section-*`) fail; they are pre-existing and unrelated (they target a removed tabs UI on `/`).
- Migration 002 was not applied to the shared local database `form_structure` yet (task 8.3, requires explicit authorization).

## Deployment and live verification (2026-10-10)

- Migration `002` applied to `form_structure` on `sqlserver22` after a verified backup: `form_structure_before_lifecycle_2026-10-10.bak` (RESTORE VERIFYONLY passed). Re-run is idempotent. Catalog verified: provenance columns, both filtered unique indexes, `CK_FormVersions_VersionNumberPositive` and all lifecycle FKs (`FK_FormVersions_Form`, `FK_FormVersions_DerivedFrom`, `FK_Forms_SourceForm`, `FK_Forms_SourceVersion`). Constraint probes in rolled-back transactions: duplicate Draft/Published inserts and promotions rejected (2601), zero/negative numbers, orphan FormIds and missing provenance targets rejected (547); no leftover rows.
- **Bug found and fixed during live verification**: publishing a Draft while a previous Published existed failed with 2601 on `UX_FormVersions_Published` whenever the Draft's GUID sorted before the Published's in the EF `SaveChanges` batch (the batch archived and promoted in key order, not in logical order). Fix in `PublishFormVersion`: archive the previous Published in its own `SaveChanges` inside the transaction before promoting the Draft, so the filtered index never sees an intermediate two-Published state and rollback still restores the previous Published. Regression test `PublishReplacesPreviousPublishedWhenDraftKeySortsFirst` seeds adversarial key order (`0000…0001` Draft vs `ffff…ffff` Published); it fails without the fix and passes with it. Backend suite: **83/83**.
- Full cycle against the local test form (`ea007cc2…`, Formulario de prueba v1): publish v1 → derive v2 (snapshot fidelity true) → publish v2 (v1 auto-archived, `archivedVersionId` correct) → derive v3 from Archived v1 (recovery, fidelity true). Rejections: derive-from-Draft 409 `invalid_version_state`, archive/republish of Published 409, second Draft 409, publish of empty schema 422 `not_publishable`. Clone from v2 returned 201 with validated ids, correct `SourceFormId`/`SourceVersionId` provenance in SQL and full schema fidelity.
- Final local state: test form has v1 Archived, v2 Published (derived from v1), v3 Draft (recovery source); clone form "Verificacion ciclo lifecycle" with one Draft v1. Probe artifacts were removed.
- API was stopped after verification. Frontend was not restarted; no writers were active during migration.

## Remaining scope

- Legacy double-submit/management Playwright suites still target the removed tabs UI; candidate for cleanup outside this change.
- 6 pre-existing backend warnings (NU1903, ASPDEPR002) belong to phase 7.
