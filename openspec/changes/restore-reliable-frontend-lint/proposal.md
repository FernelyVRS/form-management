## Why

The frontend lint command analyzes generated `dist/` assets and buries four actionable source errors under thousands of generated-code diagnostics. Restoring a focused lint signal is necessary before broader frontend and contract work can rely on it as a quality gate.

## What Changes

- Exclude generated production output from the existing ESLint scope without excluding source or tests.
- Correct the four confirmed source errors instead of weakening lint rules.
- Keep remaining warnings visible and record that they are intentionally deferred when they require behavioral work.
- Preserve the successful frontend production build.

## Capabilities

### New Capabilities

- `frontend-lint-quality-gate`: Defines reliable lint scope, source/test error expectations, warning visibility, and build regression protection.

### Modified Capabilities

None.

## Impact

- Affected frontend configuration: `web/eslint.config.js`.
- Affected source modules: the three Section operations and `FormPage` identified by the current lint baseline.
- No API, database, package, lockfile, form schema, runtime, or dependency changes.
- Hook and React Refresh warnings remain visible but are not behaviorally refactored by this change.
