# Form schema v1

The canonical contract uses English property names and discriminators. Display text and external `variable`/`entity` values remain in their original language. See [the complete example](examples/complete.json) and [the empty document](examples/empty.json).

The local development [test form](examples/test-form.json) has two sections: six fields covering text, number, static select and dependent select, including a group, in the first; an empty second section for editing. Its core flags are false to allow CRUD experiments. It was validated and saved using the schema API.

## Contract

- Root: `{ "schemaVersion": 1, "sections": [] }`.
- Section: `id`, `type`, `title`, optional `description`, `entity`, `order`, `items`.
- Group: `id`, `type`, `label`, optional `description`, `order`, field-only `items`.
- Field: `id`, `type`, `component`, `variable`, `label`, optional `description`, `order`, `core`, and component-specific properties.
- Components: `text`, `number`, `select`.
- IDs are globally unique snake_case; variables are globally unique PascalCase external keys.
- Sibling orders are consecutive positive integers starting at 1; array position need not match order.
- Text validation: optional `maxLength`. Number validation: optional `min`/`max`, with min <= max.
- Answer `required`, `range`, visibility and recursive groups are not supported.
- Select has either `options` or `dependency` plus sibling `map`, never both. Options use non-empty string label/value with unique values within each list.
- Dependency references another select by external variable, including forward references and fields in groups. Cycles and self-reference are invalid. A source value without a map entry gives an empty list.
- Unknown properties and legacy array documents are rejected.

Descriptions are text, not executable HTML. The builder shows section/group descriptions inline and field help beside its label, accessible by focus, hover and click. Full answer rendering is a subsequent change.

`schemaVersion` identifies the document format. It is not the form's business version number or a SQL concurrency `rowVersion`. External variable immutability and core preservation against a derived baseline are write-time invariants for the later persistence/builder changes.

## Validation layers

[form-schema.schema.json](form-schema.schema.json) is Draft 2020-12 and validates local structure. JSON Schema's `required` keyword means a document property must exist; it does not make an answer mandatory.

Zod and .NET validators also check semantic rules: global identity uniqueness, sibling order, option-value uniqueness, min/max consistency, dependency targets, map keys and cycles. JSON Schema alone cannot check these relationships. `structural: true, valid: false` fixtures intentionally distinguish this difference.

## Shared corpus

[fixtures.json](fixtures.json) indexes each scenario's name, source file (default `examples/complete.json`), structural expectation and full-validation expectation. Optional `changes` specify JSON-pointer paths to replace/add or remove on a fresh copy of the source document. An empty path replaces the root. The indexed mutations avoid dozens of duplicate documents and are materialized independently by both test runners. Each case starts with a fresh example; cases never mutate one another.

The complete example includes forward references, a group-contained source select, a chained dependency, a missing map entry for source value `0`, Unicode descriptions, all components, optional constraints and existing external variable names. This is a canonical example, not an import/conversion tool for the old mock.

## Verification

From `web/`:

```powershell
pnpm test:unit
pnpm lint
pnpm build
```

From the repository root:

```powershell
dotnet test api/FormManagementApi.Tests/FormManagementApi.Tests.csproj
```

Frontend tests compile the JSON Schema with Ajv 2020 and check every structural expectation, then exercise Zod plus semantic validation. Backend tests run the same corpus and check full acceptance. Both test serializers preserve supported properties, option strings and Unicode content through round trips.

The modules are wired into active schema GET/PUT endpoints and the version-scoped builder with explicit Save. The /view route displays the structure read-only; full answer renderer integration is a subsequent change. The old mock is preserved at `web/src/mocks/legacy/formStructure.json`, without runtime imports or a legacy converter.
