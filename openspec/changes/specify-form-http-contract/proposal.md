## Why

The three basic form endpoints (`GET /forms`, `POST /forms`, `GET /forms/{formId}`) are implemented and consumed by the frontend, but no OpenSpec requirement defines their wire contract: response shape, public key names, nullability, HTTP codes, `Location`, or error bodies. The only related spec (`version-status-contract`) covers status values alone, and the contract discrepancies recorded in `docs/PROJECT_STATUS.md` are stale. Formalizing the contract now (TASK-003) gives TASK-006 a target, prevents partial migrations, and is required before the external consumer integrates.

## What Changes

- Add a new specification for the basic form HTTP contract: direct responses without an envelope, public keys in English unified with the lifecycle endpoints (**BREAKING** for frontend wire format), nullability, HTTP status codes, `Location` on create, UTC timestamps, and ProblemDetails error bodies with stable `code` values.
- Align the backend with the approved matrix: rename DTO keys to English, generate `CreatedAt`/`UpdatedAt` in UTC, validate `name` on create (`400 invalid_request`), return `404 form_not_found` with a body instead of an empty 404, and document `descripcion`/`description` as nullable.
- Update the frontend boundary schemas, types, and services to the English keys, keeping localized UI copy unchanged.
- Correct stale contract statements in `docs/PROJECT_STATUS.md`.

## Capabilities

### New Capabilities
- `form-http-contract`: Wire contract of `GET /forms`, `POST /forms`, and `GET /forms/{formId}` — direct response shape, English public keys, nullability, HTTP codes, `Location`, error ProblemDetails with stable codes, and verification strategy.

### Modified Capabilities
- (none) — `version-status-contract` is referenced, not redefined; `form-list-retrieval` describes frontend retrieval behavior and does not change.

## Impact

- Backend: `api/FormManagementApi/Features/Forms/GetForms/GetForms.cs`, `CreateForm/CreateForm.cs`, `GetFormById/GetFormById.cs` (DTO renames, UTC timestamps, validation, error bodies); OpenAPI/Scalar output updates automatically.
- Frontend: `web/src/features/forms/api/formsApi.ts`, `web/src/features/forms/hooks/useFormLifecycle.ts` (detail schema), `web/src/services/form.ts` (`createForm` request/response keys), `web/src/types/form.ts`, and their consumers (`FormListPage`, `FormDetailPage`, `CreateFormPage`).
- Docs: `docs/PROJECT_STATUS.md`, `docs/BACKLOG.md` (TASK-003 → completada, TASK-006 desbloqueada).
- Out of scope (per backlog): cloning, publishing, single-Draft rule, schema persistence, builder/view routes, renderer, authentication, and `GET /forms/{formId}/versions/{versionId}` (deferred to a later task).
