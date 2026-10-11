## ADDED Requirements

### Requirement: Pinned toolchain

The repository SHALL pin the verified local toolchain: `web/package.json` SHALL declare `packageManager` for pnpm and `engines` for Node and pnpm; `web/.node-version` SHALL contain the pinned Node version; `api/global.json` SHALL pin the .NET SDK version with a documented `rollForward` policy. Installations MUST NOT require guessing tool versions.

#### Scenario: Corepack resolves the official pnpm

- **WHEN** a developer enables Corepack in `web/` and runs the documented install command
- **THEN** Corepack activates the exact pnpm version declared in `packageManager`

#### Scenario: Wrong Node major is rejected or flagged

- **WHEN** a developer uses a Node version outside the declared `engines` range
- **THEN** the package manager reports the mismatch instead of silently proceeding

#### Scenario: .NET SDK rolls forward within policy

- **WHEN** the pinned SDK patch is absent but a newer SDK satisfying `rollForward` is installed
- **THEN** `dotnet build` succeeds using the allowed SDK

### Requirement: Single tracked frontend lockfile

Exactly one frontend dependency lockfile SHALL be tracked: `web/pnpm-lock.yaml`. The legacy `web/package-lock.json` SHALL NOT be tracked. `pnpm install --frozen-lockfile` on a clean checkout SHALL succeed without modifying the lockfile, and `pnpm.onlyBuiltDependencies` SHALL permit the esbuild build script required by Vite.

#### Scenario: Clean frozen install

- **WHEN** `pnpm install --frozen-lockfile` runs in `web/` on a fresh checkout with the pinned toolchain
- **THEN** it completes successfully, leaves `pnpm-lock.yaml` unmodified, and esbuild's postinstall script is allowed

#### Scenario: No second lockfile exists

- **WHEN** the repository is inspected for frontend lockfiles
- **THEN** only `web/pnpm-lock.yaml` is tracked

### Requirement: Consistent documented commands

`AGENTS.md`, `README.md` and `web/package.json` scripts SHALL use the same package manager (pnpm) for all frontend commands.

#### Scenario: Agent and README commands match reality

- **WHEN** the documented frontend commands in `AGENTS.md` and `README.md` are executed with pnpm on a prepared checkout
- **THEN** they run the intended scripts without referencing npm

### Requirement: Reproducible SQL Server bootstrap

The repository SHALL provide an opt-in `compose.yml` running SQL Server 2022 Developer with a named volume distinct from any pre-existing local volume, a readiness healthcheck, and credentials supplied only through a git-ignored `.env` described by a tracked `.env.example`. A scripted bootstrap (`scripts/init-local-db.ps1`) SHALL wait for readiness, create `form_structure`, and apply `NewFile1.sql`, `001_PersistFormSchemaV1.sql` and `002_FormVersionLifecycleGuardrails.sql` in order with `sqlcmd -b` (with `QUOTED_IDENTIFIER ON`), targeting a caller-supplied compose project so rehearsals never require the default project or port. Existing local containers and data SHALL NOT be modified by this capability.

#### Scenario: Fresh stack initializes the schema

- **WHEN** a developer copies `.env.example` to `.env`, starts the Compose stack, and runs the bootstrap script against it
- **THEN** `form_structure` exists with `Forms`, `FormVersions`, RowVersion, the v1 schema checks, the lifecycle filtered indexes and all foreign keys from the baseline plus migrations 001 and 002

#### Scenario: Bootstrap is repeatable

- **WHEN** the bootstrap script runs again against an already initialized database
- **THEN** it completes without errors, without duplicating constraints or indexes, and without altering existing rows

#### Scenario: Rehearsal does not disturb the existing development database

- **WHEN** the stack is started as a separate compose project on an alternate host port and the bootstrap script is run with `-Project <name>` against it
- **THEN** the pre-existing `sqlserver22` container and its data on port 1433 remain untouched, and the rehearsal instance can be torn down completely

#### Scenario: Credentials are never committed

- **WHEN** the repository is inspected for secrets introduced by this capability
- **THEN** only `.env.example` with placeholder values is tracked and `.env` is listed in `.gitignore`

### Requirement: Existing environments remain authoritative

The manual deployment procedure documented in `api/FormManagementApi/Database/Migrations/README.md` SHALL remain valid; the bootstrap script SHALL execute the same migration files rather than a divergent copy, and SHALL NOT run automatically at API startup.

#### Scenario: Script and manual path share sources

- **WHEN** the bootstrap script and the manual `sqlcmd` procedure are compared
- **THEN** both apply the same `NewFile1.sql` and numbered migration files from `api/FormManagementApi/Database/Migrations`
