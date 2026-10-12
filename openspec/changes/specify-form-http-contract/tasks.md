## 1. Backend — English wire contract

- [x] 1.1 Extract the ProblemDetails helper from `LifecycleProblems` into `Features/Forms/Shared/Problems/ApiProblems.cs` and make the lifecycle helper delegate to it (no behavior change).
- [x] 1.2 `GetForms.cs`: rename DTO keys to `id`, `name`, `description`, `createdAt`, `updatedAt`, `totalVersions`, `latestVersion`, `latestVersionId`; make the latest-version projection null-safe (no `First()` throw).
- [x] 1.3 `CreateForm.cs`: request `{ name, description? }` with validation (missing/empty `name` or malformed body → `400 invalid_request`); response `{ formId, versionId, number }`; UTC timestamps (`DateTime.UtcNow`); keep `Location: /forms/{formId}`.
- [x] 1.4 `GetFormById.cs`: rename DTO keys (`versions[].number`, `versions[].status`, …); return `404` with ProblemDetails `code: form_not_found` instead of an empty 404.

## 2. Frontend — boundary schemas in English

- [x] 2.1 `formsApi.ts`: Zod schema on the English wire keys, mapping to the internal Spanish `Form` model; keep list validation failing closed.
- [x] 2.2 `useFormLifecycle.ts`: `formDetailSchema` on English keys (`number`, `status`, …), preserving the existing internal mapping.
- [x] 2.3 `services/form.ts`: `createForm` sends `{ name, description }` and parses `{ formId, versionId, number }`; confirm `createFormFromVersion` (lifecycle path) is unaffected.
- [x] 2.4 Adjust wire-facing types in `types/form.ts` if any leak English keys; UI components must not change their internal model usage.

## 3. Verification

- [x] 3.1 Backend integration tests (against `SqlSchemaTestHost`): list English keys and ordering; create `201` + `Location` + body keys + `400 invalid_request` for missing/empty/malformed; detail `200` contract, ascending version order, `404` with `form_not_found` body.
- [x] 3.2 Frontend boundary tests: English-key fixtures parse; legacy Spanish-key fixtures are rejected; run `pnpm build`, `pnpm lint` (0/0), `pnpm test:unit`.
- [x] 3.3 Full backend suite green (`dotnet test`, ≥83 tests) and Scalar page reflects the renamed DTOs.
- [x] 3.4 `openspec validate --all` passes with 0 errors.

## 4. Docs

- [x] 4.1 `docs/PROJECT_STATUS.md`: replace the stale contract-discrepancy claims with the approved matrix and note the breaking wire change.
- [x] 4.2 `docs/BACKLOG.md`: mark TASK-003 completed with closure notes and record that TASK-006 now has its formal target.
