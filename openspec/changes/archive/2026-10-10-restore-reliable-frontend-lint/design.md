## Context

The frontend runs ESLint from `web/` with `eslint .`, while the flat configuration applies to JavaScript and TypeScript recursively and does not ignore Vite's generated `dist/` directory. The current source/test baseline contains four errors and eight warnings; generated output adds thousands of irrelevant diagnostics. The repository already has a green TypeScript production build and established lint rules, so this change should restore signal without redesigning the configuration or changing application behavior.

## Goals / Non-Goals

**Goals:**

- Exclude only generated production output from lint scope.
- Correct the four confirmed source errors at their source.
- Keep warnings visible for later evaluation.
- Preserve the production build and existing lint rule severities.

**Non-Goals:**

- Resolve hook dependency or React Refresh warnings that may require behavioral or component-boundary changes.
- Change the declared React version, package manager, dependencies, lockfiles, or runtime requirements.
- Fix unrelated section-deletion behavior, commented code, logging, or form architecture.
- Refactor forms, routing, state management, or generated build output.

## Decisions

### Use a flat-config ignore for generated output

Add a narrowly scoped `dist/**` ignore to `eslint.config.js` and keep the existing `eslint .` command. This preserves lint coverage for configuration, source, and tests while preventing generated bundles from entering ESLint.

Alternative considered: narrow the package script to `eslint src tests`. Rejected because it would silently stop linting relevant project configuration files and make the script's scope less complete.

### Fix source errors without changing rule severity

Apply direct local corrections: use `const` for an immutable collection, remove the active `debugger`, type the section edit form and submit data with the existing `Seccion` contract, and construct section summaries without an unused destructured binding.

Alternative considered: disable or downgrade the four rules. Rejected because that would make lint green by hiding actionable source defects.

### Defer warnings while preserving visibility

The eight current warnings remain in output. Hook dependency warnings can change data-loading behavior, and React Refresh warnings concern shared primitive exports; both require separately scoped review rather than opportunistic changes.

Alternative considered: fix every warning in this change. Rejected because it expands a focused quality-gate repair into behavioral refactoring.

## Risks / Trade-offs

- [Risk] An overly broad ignore could hide maintained code. -> Mitigation: ignore only `dist/**` and verify `src` and `tests` directly.
- [Risk] Typing the edit form could expose an incompatible form contract. -> Mitigation: use the existing `Seccion` type already required by `SectionForm`.
- [Trade-off] Lint remains warning-bearing. -> Mitigation: warnings stay visible and are documented rather than suppressed.
- [Risk] A source correction changes runtime behavior. -> Mitigation: limit changes to semantics-preserving lint fixes and run the production build.

## Migration Plan

1. Add the generated-output ignore.
2. Correct the four source errors independently.
3. Run focused lint for `src` and `tests`, then the normal lint command.
4. Run the production build.
5. If a correction changes behavior or verification fails, revert only that local correction and reassess its typing rather than weakening lint rules.

## Open Questions

None blocking this change. React version metadata and warning remediation remain explicitly deferred.
