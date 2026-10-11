## Context

The active builder uses `Seccion[]`, `preguntas`, `tipo`, and unchecked mock assertions. The root draft uses English keys but lacks external variables/core flags and embeds behaviors not yet specified. OpenSpec context currently describes a third mixed-language model and prohibits embedded validation.

The user explicitly approved an English v1 envelope, existing simple validation only, variable-based dependencies, one-level groups, mandatory variable/core, no runtime legacy support, and preservation of the old mock. These decisions supersede the old documentation for the new contract. The current runtime will remain unchanged until later integration changes.

A read-only audit of `form_structure` in `sqlserver22` found three Draft version-1 records, each containing exactly `{}`, no derived versions and no duplicate Drafts/version numbers. This is a point-in-time observation: persistence work must repeat the audit before any mutation.

## Goals / Non-Goals

**Goals:**

- Publish one authoritative English contract with equivalent acceptance in JavaScript and .NET.
- Establish typed, strict parsing and lossless serialization before integrating persistence.
- Capture the approved descriptions, simple validation and dependencies.
- Provide shared positive/negative fixtures and meaningful pure-validator tests.

**Non-Goals:**

- Changing SQL records, adding RowVersion, adding endpoints or changing current creation behavior.
- Changing Zustand, CRUD forms, routes, DnD, rendering or runtime mock loading.
- Implementing cloning, publication, external response submission or core-field edit protection.
- Adding a legacy converter, `required` constraint, visibility rules, remote option providers or recursive groups.

## Decisions

### Versioned envelope and stable technical vocabulary

The root has exactly `schemaVersion: 1` and `sections: SectionNode[]`. Empty is `{ "schemaVersion": 1, "sections": [] }`. An array root is rejected instead of heuristically interpreted. Contract version is independent of business version number and future SQL RowVersion.

Section keys: `id`, `type: "section"`, `title`, optional `description`, `entity`, `order`, `items`.

Group keys: `id`, `type: "group"`, `label`, optional `description`, `order`, `items` containing fields only. The group retains `label` from the agreed examples; sections alone use `title`. Groups are visual containers and inherit the section entity, without introducing an output nesting level.

Field keys: `id`, `type: "field"`, `component`, `variable`, `label`, optional `description`, `order`, `core`, plus component-specific properties. No editor-only `parentId`/`sectionId` is allowed.

Property names/discriminators are English. Labels, titles, descriptions, entity values and external variables are not translated. IDs follow `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$`; variables follow `^[A-Z][A-Za-z0-9]*$` and remain contractual external names.

### Strict component-specific validation

Text supports optional `validation: { maxLength?: positive integer }`. Number supports optional `validation: { min?: finite number, max?: finite number }`, with `min <= max` when both exist. Select does not carry `validation` in v1. Omitted/empty validation imposes no answer constraints; empty answers are not made mandatory by these properties.

`required` is not a supported property in the form document. Required schema properties in JSON Schema still use its standard `required` keyword: that checks document structure, not whether an end user must answer a field.

`range` has no defined runtime semantics and is replaced by min/max in the new example. Numeric `maxLength` from the old mock is not adopted as a digit-count rule.

### One unambiguous select mode

Static select requires `options: { label, value }[]`. Dependent select requires `dependency: { field: string }` and sibling `map: Record<string, Option[]>`, with no `options`. Options can be empty in drafts; their non-empty string values must be unique within each option list.

`dependency.field` resolves by globally unique `variable`, including fields inside groups. The target must be a select, self-references and cycles are invalid. Forward references are allowed because validation resolves after traversing the entire document. Map keys must exist among the source select's possible values (static options or the union of dependent map values). Missing map entries are valid and resolve to no options, not to fallback options.

### Split structural and semantic validation

Draft 2020-12 JSON Schema defines local shapes and rejects unknown properties. Zod and .NET parsing enforce the same structure. A second semantic pass checks global ID/variable uniqueness, consecutive sibling orders, valid references, map keys and cycles.

JSON Schema alone cannot adequately express cross-document relationships. Its acceptance must therefore not be advertised as full semantic acceptance. Error results include a document path and a stable error code; exact localized message parity is not required.

Use existing Zod and `System.Text.Json`. Add focused frontend/backend test tooling only where necessary to execute the shared fixture corpus. No additional runtime validator package is required unless implementation establishes a concrete need.

### Canonical fixtures, independent runtime integration

`contracts/form-schema/v1/` holds JSON Schema, complete/empty examples and an indexed corpus of valid/invalid fixtures. Frontend and backend tests consume the same corpus with the same expected acceptance.

New domain code lives under `web/src/features/forms/model/` and `api/FormManagementApi/Features/Forms/Shared/Schema/`. Legacy types remain in place until the builder migration. The old mock is not moved in this stage because current runtime still imports it; later cutover will move it intact to `mocks/legacy/` and remove those imports.

### Follow-up changes

1. `persist-form-version-schema`: SQL audit and migration, RowVersion, canonical creation, validated Draft-only schema GET/PUT with English DTOs.
2. `migrate-form-builder-to-schema-v1`: per-version draft, explicit Save, field/group CRUD, descriptions, order normalization and DnD.
3. `render-form-schema-v1`: separate view route, dynamic controls, descriptions/tooltips, dependent options and simple answer constraints.

Core and variable preservation across derived versions is a future write-time invariant requiring a baseline; this contract stage validates presence/types, not edits against that baseline.

## Risks / Trade-offs

- [Validator drift] -> Consume the same fixtures in both runtimes and add cases for every spec scenario.
- [Old context contradicts new decisions] -> Update the context and PRD during implementation, explicitly distinguishing target contract from existing runtime.
- [Strict rejection surfaces old data] -> No legacy adapter is planned; downstream persistence must audit and handle the known empty placeholders before cutover.
- [Contract-only success mistaken for end-to-end completion] -> Record remaining persistence/builder/renderer milestones in status and backlog.
- [User work is present in the worktree] -> Re-read touched files and scope edits to this contract initiative.

## Migration Plan

Publish and test the contract modules without importing them into runtime routes. Update docs to identify v1 as the target and legacy as the current builder implementation. Then proceed through the follow-up changes above. Rollback of this stage requires reverting only the newly introduced contract modules, fixtures and documentation; no persisted data changes occur.

## Open Questions

None blocking this stage. Publication policy, repeated entity output, tooltip implementation and write-time core protection belong to subsequent feature changes.
