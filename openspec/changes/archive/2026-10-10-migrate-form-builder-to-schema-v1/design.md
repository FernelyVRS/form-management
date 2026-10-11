## Context

Canonical schema GET/PUT and RowVersion are deployed. The old builder still mixes server data, mock and editable Seccion state; only DnD attempts persistence. Current detail/create services have metadata number/envelope mismatches which must be mapped at the boundary so users can reach the new builder.

## Goals / Non-Goals

**Goals:** Identified v1 drafts, Section/Group/Field CRUD, descriptions, dependent options, simple constraints, explicit saving, dirty/conflict protection and valid ordering.

**Non-Goals:** New SQL changes, cloning/publication endpoints, legacy schema conversion or the final answer renderer. /view displays the canonical structure read-only until renderer work.

## Decisions

- API functions parse direct schema responses and validate identity against route IDs. Query keys include form/version; requests carry AbortSignal. Query refetches do not hydrate over a dirty draft.
- A per-route Zustand store is created inside a keyed route component, preventing stale responses and save completion from another version from replacing active state. It stores baseline/schema/token/status/error, while Query owns server responses.
- Pure immutable operations insert/update/remove/move and normalize sibling order. They validate before adoption, so referenced field deletion or incompatible component conversion fails without changing the draft. Baseline variables and baseline core flags/identities are protected conservatively in the frontend; backend remains authoritative for derived-source invariants.
- IDs are entered in snake_case at creation and immutable while editing. External variables are immutable for baseline fields. RHF owns modal editor values; placement metadata is not serialized. Static option rows are editable; dependent selects choose a source variable and edit its map as JSON with full-document validation on apply.
- Section/group descriptions appear inline; field descriptions use focus/hover/click accessible contextual help. New primitives come from the existing shadcn registry, preserving installed components.
- Existing dnd-kit is lazy-loaded for structure movement with compatible node types and empty-container targets. Keyboard reorder buttons and the editor parent control provide equivalent non-pointer movement. All moves remain local until Save.
- Save takes a snapshot, disables editing while pending, validates, performs one PUT and adopts the response token as baseline. Failed validation/network/conflict retains local changes. Conflicts require explicit reload/discard, never automatic overwrite. Router blockers and beforeunload warn on pending work; navigation is also blocked during saving.
- Remove global mock hydration and fake schema hooks. Move the mock intact to mocks/legacy. Replace route imports with new builder/view pages; obsolete components remain unreachable until deliberate cleanup.
- Map existing create/detail responses without renaming their wire metadata. Draft cards go to /builder, other statuses to /view. No new version actions are offered by the builder while their endpoints are absent.

## Risks / Trade-offs

- [Metadata drift] -> Validate/map adjacent responses and cover actual direct creation response.
- [Lost edits through refetch/navigation] -> Route-scoped store, explicit hydration and blockers.
- [DnD malformed positions] -> Feed events into the same typed pure move operation and validate legal containers.
- [Server rejects derived-source preservation] -> Retain draft and show server issue paths; do not guess a source absent from GET metadata.
- [Old tests assume / is builder] -> Add deterministic tests on actual routes; keep unrelated tests visible as legacy.

## Migration Plan

Introduce API/operations/store, build editors and tree, switch routes/metadata entry points, remove mock imports and relocate the original file, then verify pure tests, focused Playwright, lint/build and a live read-only backend smoke check. No persisted development schema is modified by automated UI tests.
