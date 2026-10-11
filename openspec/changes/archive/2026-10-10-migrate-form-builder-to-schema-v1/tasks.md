## 1. Data And State

- [x] 1.1 Add validated version-schema API/query/mutation boundaries and metadata entry-point mappings.
- [x] 1.2 Implement immutable canonical CRUD/move/order operations with reference and baseline protection tests.
- [x] 1.3 Implement route-scoped draft state, explicit saving/error/conflict handling and refetch isolation with tests.

## 2. Builder UI

- [x] 2.1 Add RHF section/group/field editors, static option rows, dependency map editing and simple constraints.
- [x] 2.2 Add canonical structure inspection, inline descriptions, accessible field help and confirmed deletion.
- [x] 2.3 Add lazy DnD, empty container drop targets and keyboard/editor movement using canonical operations.
- [x] 2.4 Add Save/reload status and dirty navigation/unload blockers, disabling edits during saving.

## 3. Runtime Cutover

- [x] 3.1 Switch builder/view routes and Draft detail/create entry points to canonical data without enabling editing in read-only routes.
- [x] 3.2 Remove global mock/fake hooks, move original mock intact to legacy and remove obsolete runtime structure service paths.

## 4. Verification

- [x] 4.1 Add deterministic Playwright for CRUD/group/dependency/order, save/reload, conflicts, errors, navigation and read-only behavior.
- [x] 4.2 Run lint, build, pure contract/operations/store tests and relevant Playwright; smoke-test live canonical read without changing development data.
- [x] 4.3 Update docs/status/backlog, validate OpenSpec and record implementation results and mock preservation.
