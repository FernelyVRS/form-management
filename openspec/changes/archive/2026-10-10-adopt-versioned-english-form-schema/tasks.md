## 1. Shared Contract And Fixtures

- [x] 1.1 Create `contracts/form-schema/v1/form-schema.schema.json` using Draft 2020-12 with strict envelope, node discriminators, one-level groups and component-specific properties.
- [x] 1.2 Add empty and complete examples covering descriptions, text maxLength, numeric min/max, static/dependent selects and group fields while preserving existing external variable values in adapted examples.
- [x] 1.3 Create an indexed shared fixture corpus covering valid empty containers, absent descriptions/validation, forward/group/chained dependencies and missing map entries.
- [x] 1.4 Add invalid structural fixtures for old roots/keys, unknown versions/properties, unsupported components, nested groups, missing variable/core, mixed select modes and invalid constraints/options.
- [x] 1.5 Add invalid semantic fixtures for duplicate identities/orders/option values, missing or non-select targets, self-dependency, cycles and unsupported map keys.
- [x] 1.6 Document structural versus semantic validation responsibilities, fixture expectations and contract-version versus business-version distinctions in the contract README.

## 2. Frontend Contract Module

- [x] 2.1 Add discriminated document, section, group, field, option and dependency definitions under `web/src/features/forms/model/` without replacing active legacy types.
- [x] 2.2 Implement strict Zod structural parsing with component-specific validation rules and path-bearing error codes.
- [x] 2.3 Implement the semantic pass for global IDs/variables, consecutive sibling order, unique option values, dependency resolution, source map keys and cycle detection.
- [x] 2.4 Add parse/serialize helpers that preserve supported values and reject invalid inputs instead of asserting types or emitting legacy keys.
- [x] 2.5 Add the minimal frontend pure-test runner setup and scripts needed for the shared corpus, without changing Playwright coverage or runtime routing.
- [x] 2.6 Run all shared fixtures through frontend validation and test complete-document round trips with Unicode text and grouped fields.

## 3. Backend Contract Module

- [x] 3.1 Add explicit C# document/node DTOs and serializer configuration under `Features/Forms/Shared/Schema/`, preserving English wire names and rejecting unknown properties.
- [x] 3.2 Implement structural/component validation with path-bearing error codes and faithful handling of missing required properties, nulls and booleans.
- [x] 3.3 Implement backend semantic validation matching the frontend rules, including chained dependency maps, forward references and cycle detection.
- [x] 3.4 Implement canonical serialization/parse helpers independent of EF entities or HTTP handlers.
- [x] 3.5 Add a focused backend test project consuming the same indexed fixtures and testing round-trip preservation.
- [x] 3.6 Verify cross-runtime acceptance parity for every fixture and document which semantic cases are intentionally beyond JSON Schema alone.

## 4. Documentation And Follow-up Boundaries

- [x] 4.1 Update `openspec/config.yaml` to the approved English envelope and simple embedded validations, keeping complex answer rules excluded.
- [x] 4.2 Update the schema sections of `RPM-context-project.md` to match the authoritative contract and retain external-variable/core meaning.
- [x] 4.3 Update `docs/PROJECT_STATUS.md` to distinguish target v1 from active legacy runtime and record the point-in-time read-only SQL audit.
- [x] 4.4 Update `docs/BACKLOG.md` with sequenced persistence, builder and renderer changes, explicit Save and later mock relocation without deletion.
- [x] 4.5 Link the canonical contract and fixture/test commands from relevant READMEs without duplicating competing definitions.

## 5. Verification

- [x] 5.1 Validate JSON Schema syntax/structure and structural fixture behavior using test tooling; explicitly separate semantic rejection cases.
- [x] 5.2 Run frontend lint, typecheck/build and contract tests, addressing only regressions introduced by this change.
- [x] 5.3 Run backend build and contract tests, ensuring all shared fixture expectations and serializer round trips pass.
- [x] 5.4 Review the diff to confirm the original mock is preserved and database, active endpoints, builder, stores and routes have not been modified by this stage.
- [x] 5.5 Validate the OpenSpec change and record implementation results before proceeding to persistence.
