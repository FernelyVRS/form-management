## Why

Schema v1 persistence is implemented, but the version lifecycle is not: `CreateFormVersion` is an empty stub, and there are no working endpoints for publishing, archiving, or cloning a form. Without these transitions the form management flow cannot progress past a single editable Draft, the UI shows a hardcoded `v1.0.0 / Publicada` summary, and there is no SQL guarantee that a form holds at most one Draft and one Published version.

## What Changes

- Implement four Carter vertical slices: create a version from another version (`POST /forms/{formId}/versions`), create a form from a version (`POST /forms/from-version`), publish a Draft (`POST /forms/{formId}/versions/{versionId}/publish`) and archive a Draft (`POST /forms/{formId}/versions/{versionId}/archive`).
- Define explicit English DTOs and direct responses (no `{ data }` wrapper) with stable ProblemDetails codes for every rejection path.
- Enforce the confirmed lifecycle rules: at most one Draft and one Published per form; publishing archives the previous Published atomically; manual archive is Draft-only; Published/Archived are the only derivation sources; Archived is terminal and recoverable only by deriving a new Draft.
- Add a guarded, transactional SQL migration (`002`) adding unique filtered indexes on `(FormId)` for Draft and for Published, plus a `VersionNumber > 0` check; reflect them in EF.
- Add per-form transactional coordination: lock the Form row, number versions as `MAX(VersionNumber) + 1` including Archived, and commit or roll back every write together.
- Copy full schema snapshots preserving `id`, `variable`, `core`, descriptions, validations, options and maps; register `DerivedFromVersionId` and form-level provenance for clones; snapshots stay physically independent.
- Enforce publish preconditions: valid stored v1 schema and at least one question, counting fields inside groups; no per-section content requirement.
- Replace the frontend's hardcoded publication summary with real data: publication status, available draft, latest version and history, plus actions per state (Edit/View structure, Publish, New version, Clone form, Archive draft) with confirmation dialogs.
- Add lifecycle API client code with Zod parsing, `requestJson`, encoded IDs, AbortSignal-aware queries, no automatic retries, pending controls and cache invalidation.
- Update the frontend `version-status-contract` to admit Published and Archived as selectable sources and exclude Draft.
- Add backend integration tests on real SQL Server (isolated databases in `sqlserver22`) and frontend tests for the full lifecycle.

## Capabilities

### New Capabilities

- `form-version-lifecycle`: Version state transitions, derivation sources and cloning, publish/archive commands, transactional per-form coordination, SQL uniqueness guarantees and the management UI backed by real lifecycle data.

### Modified Capabilities

- `version-status-contract`: The version creation modal currently allows only Published sources and excludes Archived; the requirement changes to include both Published and Archived versions as selectable sources while still excluding Draft.

## Impact

- Backend: new slices under `api/FormManagementApi/Features/Forms/` (`PublishFormVersion`, `CreateFormVersion`, `CreateFormFromVersion`, `ArchiveFormVersion`), shared schema-copy and question-count helpers, `Form`/`FormVersion` mapping, new migration `api/FormManagementApi/Database/Migrations/002_*.sql` and its README.
- Database: new filtered unique indexes and check constraint; requires audit, backup and writer coordination before applying to `form_structure`.
- Frontend: `web/src/features/forms/api/` lifecycle client, `FormDetailPage`, `VersionModal`, `VersionCard`, builder metadata wiring, `useForms`/`useFormSchema` hooks and Playwright/Vitest suites.
- Contracts: schema v1 document is unchanged; only version/form metadata commands are added.
- Excludes the answer renderer, the legacy editor cleanup change (`remove-legacy-form-editor`), archived OpenSpec sync and the legacy Playwright suite migration, which remain separate work.
