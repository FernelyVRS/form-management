## Why

The repository has incompatible form definitions: a legacy builder mock, an English draft, and a mixed-language documented contract. A single versioned English contract with equivalent frontend and backend validation is needed before implementing durable editing and rendering.

## What Changes

- **BREAKING**: Define the canonical document as `{ "schemaVersion": 1, "sections": [] }`, replacing the old root-array contract.
- **BREAKING**: Use English property names and discriminators exclusively; preserve localized display text and existing external `variable` values.
- Define sections, one-level groups, and discriminated text/number/select fields, with optional descriptions.
- Require `variable` and `core` on every field and standardize options as `{ label, value }` with string values.
- Reference dependent selects through `dependency.field` (external variable) and a sibling `map`.
- Include only existing simple constraints under `validation`: number `min`/`max` and text `maxLength`. Exclude `required` and ambiguous `range`.
- Publish JSON Schema, canonical examples, invalid fixtures, TypeScript/Zod and C# validators with shared acceptance tests.
- Update contractual documentation to supersede the mixed-language model and prohibition on all embedded validation.
- Preserve the legacy mock file and current runtime during this contract-only stage; subsequent changes will remove its production use without adding a legacy adapter.

## Capabilities

### New Capabilities

- `form-schema-contract`: Versioned English form document, structural and referential validation, serialization and cross-runtime acceptance parity.

### Modified Capabilities

None. List retrieval and version status behavior remain governed by their existing specs.

## Impact

- New shared artifacts under `contracts/form-schema/v1/`.
- New frontend domain definitions under `web/src/features/forms/model/`.
- New C# schema definitions under `api/FormManagementApi/Features/Forms/Shared/Schema/` and focused test infrastructure.
- Updates to OpenSpec context, PRD, project status and backlog.
- This stage establishes validators without integrating them into existing routes, stores or endpoints.
- SQL migration, RowVersion, schema GET/PUT, builder migration, explicit saving and rendering are subsequent changes. No database mutation is part of this change.
