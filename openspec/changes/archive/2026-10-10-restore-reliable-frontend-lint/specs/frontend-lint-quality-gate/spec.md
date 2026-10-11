## ADDED Requirements

### Requirement: Generated output is excluded from lint
The frontend lint quality gate SHALL exclude generated production output under `dist/` while continuing to analyze maintained source and test files.

#### Scenario: Production output exists
- **WHEN** `pnpm lint` runs after a production build has generated files under `dist/`
- **THEN** ESLint produces no diagnostics for files under `dist/`

#### Scenario: Maintained files are analyzed
- **WHEN** lint runs against the frontend workspace
- **THEN** files under `src/` and `tests/` remain in lint scope

### Requirement: Source and test lint contains no errors
The frontend lint quality gate SHALL complete without ESLint errors in maintained source and test files.

#### Scenario: Focused lint validation
- **WHEN** ESLint analyzes `src` and `tests`
- **THEN** it reports zero errors

### Requirement: Rules are not weakened to hide defects
The implementation MUST correct the confirmed source violations without disabling or reducing the applicable lint rules globally.

#### Scenario: Confirmed source violations are corrected
- **WHEN** the four confirmed lint violations are reviewed after implementation
- **THEN** each violation is absent because its source code was corrected rather than its rule being suppressed

### Requirement: Existing warnings remain observable
The frontend lint quality gate SHALL continue to report unresolved warnings unless they are independently corrected for a documented reason.

#### Scenario: Deferred warnings remain visible
- **WHEN** `pnpm lint` runs after the confirmed errors are corrected
- **THEN** deferred hook and React Refresh warnings remain visible and do not fail the command

### Requirement: Production build remains successful
The frontend production build SHALL continue to complete after lint configuration and source corrections.

#### Scenario: Build regression check
- **WHEN** `pnpm build` runs after the lint changes
- **THEN** TypeScript and Vite complete successfully
