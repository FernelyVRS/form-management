# Builder v1 implementation

## Delivered

- Strict schema-response parsing, route identity checking, eight-byte base64 token validation and version-specific Query keys.
- API GET cancellation and mutation cancellation of outstanding reads before PUT; no autosave.
- Per-route Zustand draft with baseline, token, dirty/save status and recoverable errors. Refetch does not replace dirty content; accepted save responses are not rehydrated over success status.
- Immutable CRUD/move/ordering operations with complete v1 validation, dependency integrity and baseline field protection.
- RHF Section/Group/Field dialogs with numeric coercion, descriptions, supported validation, static option rows and dependent variable/map editing.
- Canonical tree with inline descriptions, keyboard/focus/click help, confirmed deletion, editor movement and keyboard reorder.
- Lazy dnd-kit dragging with typed compatible drop containers and pure movement; no PUT from dragging.
- Explicit Save, pending disable, error/validation/conflict retention and confirmed reload/navigation; browser beforeunload warning.
- Canonical builder/read-only structure routes and direct create/detail response mapping.
- No runtime imports of the preserved mock at `web/src/mocks/legacy/formStructure.json`. The move retained its JSON content; line endings were normalized by the patch tool.
- Added shadcn primitives from @shadcn registry, kept existing label, corrected CSS config and reused local cn utility instead of keeping an extra cn dependency.

## Verification

- `pnpm test:unit`: 63 passed (55 contract + 5 operations + 3 draft lifecycle tests).
- `pnpm build`: success; existing bundle-size warning. DnD has a separate lazy chunk.
- `pnpm lint`: 0 errors, 6 residual warnings. Generated Playwright directories are excluded to avoid a lint/results cleanup race.
- Playwright builder/list suite with FORM_SCHEMA_LIVE_SMOKE=1: 16 passed. Includes real pointer drag, CRUD, groups, simple constraints, options/maps, core/variable preservation, save/read-back, pending/error/conflict handling, dirty navigation, read-only routes and creation/detail entry points.
- The live smoke reads an existing local empty version from the API; no development schemas were written by UI tests. Other browser scenarios intercept API requests.
- Runtime search has no mock imports, fake hooks or /estructura service references.
- Strict OpenSpec validation and `git diff --check` pass. Existing backend/user work was preserved; no SQL mutation was part of this frontend stage.

## Remaining scope

/view currently inspects canonical structure. Full dynamic answer controls, dependent-answer updates and output submission belong to render-form-schema-v1. Cloning/publication endpoints remain separate backend work. Old unreachable editor components are retained for deliberate cleanup, not consumed by active routes.
