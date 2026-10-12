## Context

The basic form endpoints already exist and the frontend already consumes them with Zod validation at the boundary, but the wire contract was never specified: DTO key language differs per endpoint (Spanish in the basic three, English in the lifecycle commands), error bodies are inconsistent (empty 404 vs ProblemDetails), `POST /forms` stamps local time (`DateTime.Now`) instead of UTC, and `name` is not validated. `docs/PROJECT_STATUS.md` still records contract discrepancies that no longer exist.

Approved decision matrix (user, 2026-10-11):

1. **Envelope**: direct responses, no `{ data }` wrapper.
2. **Key language**: English, unified with the lifecycle endpoints (`name`, `description`, `status`, `number`, …). **BREAKING** for wire format.
3. **Errors**: ProblemDetails bodies with a stable `code` extension, as the lifecycle endpoints already do.

Stakeholders: the frontend (only consumer today), the future external consumer of the API, and TASK-006 which must implement this spec afterwards.

## Goals / Non-Goals

**Goals:**
- One normative spec for `GET /forms`, `POST /forms`, `GET /forms/{formId}`: shape, keys, nullability, codes, `Location`, timestamps, error bodies, and verification strategy.
- Backend and frontend aligned to the approved matrix within the same change (single coordinated breaking cut while the external consumer is not yet integrated).
- Reuse the existing ProblemDetails shape of the lifecycle endpoints so every endpoint fails alike.

**Non-Goals:**
- Cloning, publishing, the single-Draft rule, schema persistence, builder/view routes, renderer, authentication.
- `GET /forms/{formId}/versions/{versionId}` — deferred to a later task.
- Redefining `version-status-contract` (`Draft`/`Published`/`Archived` values are referenced, not redefined).
- Renaming the frontend's internal model (Spanish fields stay inside the UI; translation happens at the API boundary).

## Decisions

**D1 — Direct response body.** Alternatives: `{ data }` envelope. Direct wins because every shipped endpoint (list, create, detail, lifecycle commands) already returns the resource directly, `requestJson`/Zod consume it as-is, and an envelope adds a layer with no current consumer need (pagination/errors have dedicated mechanisms).

**D2 — English wire keys, unified with lifecycle.** The matrix:

| Endpoint | Keys |
|---|---|
| `GET /forms` → `200` | `[{ id, name, description, createdAt, updatedAt, totalVersions, latestVersion, latestVersionId }]` |
| `POST /forms` → `201` + `Location` | request `{ name, description? }`; response `{ formId, versionId, number }` |
| `GET /forms/{formId}` → `200` | `{ id, name, description, createdAt, updatedAt, versions: [{ id, number, status, rowVersion, createdAt, updatedAt }] }` |

`number`/`status` mirror `LifecycleVersionResponse`, so detail and lifecycle never disagree again. Alternatives: keep Spanish (rejected — violates the "English technical keys" convention and guarantees a second breaking cut when the external consumer arrives); rename everything to Spanish (rejected — contradicts the schema contract and lifecycle already shipped in English).

**D3 — Frontend translation at the boundary.** Wire schemas (Zod) parse English keys and map into the existing Spanish internal model (`nombre`, `numero`, `estado`), following the pattern already used by `mapDetail`/`mapForm`. UI copy and component APIs do not change; only the boundary schemas, `createForm` keys, and `types/form.ts` wire-facing types move. Alternative: rename the internal model too — larger diff, zero contract value.

**D4 — Errors as ProblemDetails with `code`.** `400 invalid_request` (missing/empty `name`, malformed JSON) and `404 form_not_found`. Shape matches `LifecycleProblems`: HTTP status + `title` set to the code + `code` extension. Implementation: extract the helper into `Features/Forms/Shared/Problems/ApiProblems.cs` and delegate the lifecycle helper to it (behavior preserved, verified by the existing 83 backend tests). Alternative: keep empty 404 — rejected: consumers cannot distinguish "not found" from a proxy error without parsing prose.

**D5 — Timestamps are UTC (RFC 3339) on the wire.** `POST /forms` switches `DateTime.Now` → `DateTime.UtcNow`; the spec requires `Z`-suffixed values for rows created after this change. No DB migration: rows created by local Windows runs before this change may carry local time, which is accepted and documented (see Risks).

**D6 — Nullability is part of the contract.** `description` and `updatedAt` are nullable; `updatedAt: null` means "never updated". The frontend maps `null` → fallback (`createdAt`) as it does today. `name` is required and non-empty on create.

**D7 — Verification strategy.** Three layers: (a) backend integration tests asserting status codes, English keys, `Location`, and error bodies against a real SQL instance (existing `SqlSchemaTestHost` harness); (b) frontend Zod boundary schemas as executable contract tests (parse fixtures, reject violations); (c) shared fixtures are not duplicated — backend tests assert shapes directly, frontend schemas are the consumer guard. `openspec validate --all` gates the change.

## Risks / Trade-offs

- [Breaking wire change silently misses a consumer] → frontend is the only consumer; boundary Zod schemas fail closed; grep confirms no other reader of the old keys; single atomic commit for backend + frontend.
- [Historical rows carry local timestamps] → spec scopes `Z` to values produced from this change; old rows accepted as-is; no backfill (low value, single dev database).
- [Extracting the shared Problem helper regresses lifecycle behavior] → keep the exact same ProblemDetails fields; run the full backend suite (83 tests) which already covers lifecycle error codes.
- [OpenAPI/Scalar examples change with DTO renames] → generated from code; verify the Scalar page after the backend change.
- [`latestVersion` semantics when a form has no versions] → contract requires `totalVersions ≥ 1` (create always writes version 1); backend makes the projection null-safe instead of `First()` throwing.

## Migration Plan

1. Backend first: rename DTOs, add validation/error bodies, fix UTC, extract `ApiProblems`; backend tests green.
2. Frontend second (same change): update boundary schemas, `createForm`, types; `pnpm build`, `lint`, `test:unit` green.
3. Docs (`PROJECT_STATUS`, `BACKLOG`) updated; no DB migration; rollback = revert the commit (no schema or data change).

## Open Questions

- Whether `GET /forms/{formId}/versions/{versionId}` joins the basic contract in TASK-006 or gets its own spec — deferred by the approved scope.
- Whether the future external consumer needs pagination on `GET /forms` — out of scope; revisit when its integration contract is drafted.
