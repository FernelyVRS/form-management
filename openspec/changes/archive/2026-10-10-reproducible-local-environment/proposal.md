## Why

A clean checkout of the repository cannot reproduce the working environment: the npm→pnpm migration is incomplete (`package-lock.json` still tracked, `pnpm-lock.yaml` untracked, no `packageManager`/`engines`/`global.json`), Node/pnpm/.NET versions are not pinned, and SQL Server only exists as the manually created `sqlserver22` container with no Compose definition or scripted database initialization. This blocks TASK-004/TASK-005, onboarding, and any future CI work.

## What Changes

- Declare pnpm as the official package manager: add `packageManager` (Corepack), `engines` and `pnpm.onlyBuiltDependencies` (esbuild) to `web/package.json`; add `.node-version` and `api/global.json`; remove the tracked `web/package-lock.json` and track `web/pnpm-lock.yaml` (accepting its current resolved versions).
- Align developer commands in `AGENTS.md` with pnpm (it still documents npm for the frontend).
- Add `compose.yml` for SQL Server 2022 Developer with a named volume distinct from the existing `sqlvolume`, a healthcheck, and credentials supplied via a git-ignored `.env` (`.env.example` committed).
- Add `scripts/init-local-db.ps1` that waits for readiness, creates `form_structure`, and applies the baseline `NewFile1.sql` plus migrations `001_PersistFormSchemaV1.sql` and `002_FormVersionLifecycleGuardrails.sql` transactionally with `sqlcmd -b`; repeatable on an already-initialized database.
- Document the bootstrap flow in `README.md` and `docs/PROJECT_STATUS.md`. The existing `sqlserver22` container and its data remain untouched.

## Capabilities

### New Capabilities

- `local-environment-bootstrap`: pinned and documented toolchain (Node, pnpm, .NET SDK), single tracked frontend lockfile, and a reproducible Docker-based SQL Server bootstrap that provisions `form_structure` with all schema migrations applied.

### Modified Capabilities

(none)

## Impact

- `web/package.json`, new `web/pnpm-lock.yaml` (tracked), removed `web/package-lock.json`, new `web/.node-version`, new `api/global.json`, root `AGENTS.md`, root `.gitignore` (ignore `.env`), new `compose.yml`, `.env.example`, new `scripts/init-local-db.ps1`, `README.md`, `docs/PROJECT_STATUS.md`, `docs/BACKLOG.md` (TASK-004/TASK-005 status).
- No application code, API endpoints, or existing databases change. The developer's existing `sqlserver22` container keeps working on port 1433; the Compose stack is opt-in and uses its own volume and project name.
