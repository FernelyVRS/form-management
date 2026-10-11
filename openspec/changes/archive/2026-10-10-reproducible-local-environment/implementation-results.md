# Implementation Results: reproducible-local-environment

Date: 2026-10-10. Implements `docs/BACKLOG.md` TASK-004 (toolchain consolidation) and TASK-005 (reproducible local database).

## What was delivered

### Toolchain (TASK-004)

- `web/package.json`: `packageManager: "pnpm@10.33.0"`, `engines` (Node `>=22.13.0 <23`, pnpm `>=10.33.0 <11`), `pnpm.onlyBuiltDependencies: ["esbuild"]`.
- `web/.node-version` (22.13.0) and `api/global.json` (SDK 10.0.201, `rollForward: latestFeature`).
- Single tracked frontend lockfile: `web/pnpm-lock.yaml` (resolutions accepted as-is); legacy `web/package-lock.json` stays deleted. NOTE for the commit: `pnpm-lock.yaml` is currently untracked and `package-lock.json` deletion is unstaged — both must be committed together.
- Root `.gitignore` created with `.env`/`.env.*` ignores (`.env.example` excepted).
- `AGENTS.md` now documents pnpm commands, the pinned toolchain and the Compose bootstrap; it no longer references npm.

### SQL Server bootstrap (TASK-005)

- `compose.yml`: SQL Server 2022 Developer pinned to `mcr.microsoft.com/mssql/server:2022-CU27-ubuntu-22.04`, healthcheck (tools18 with tools fallback), volume `<project>_sql-data` (distinct from any pre-existing volume), `${MSSQL_PORT:-1433}` publish, `MSSQL_SA_PASSWORD` required from environment. No top-level `name:` so `-p` can isolate rehearsals.
- `.env.example` with `MSSQL_SA_PASSWORD` and `MSSQL_PORT` placeholders.
- `scripts/init-local-db.ps1`: loads `.env`, resolves the compose container (`-Project`, default `form-management`), waits for readiness, creates `form_structure`, applies `NewFile1.sql` only when `dbo.Forms` is absent, then `001` and `002` with `sqlcmd -b`; verifies tables, indexes, checks, FKs, provenance columns and RowVersion.
- Migrations `README.md` documents the bootstrap path next to the manual procedure.

## Verification

- **Toolchain**: `pnpm install --frozen-lockfile` clean (1.6s, no lockfile changes), `pnpm build` green, `pnpm lint` 0/0, `pnpm test:unit` 85/85. `dotnet build` 0 errors; backend tests 83/83 against the untouched `sqlserver22`.
- **Rehearsal (isolated stack on host port 14331, project `form-management-rehearsal`)**: image pull + `up --wait` healthy; bootstrap created `form_structure` and produced 2 tables, 3 indexes (`UX_FormVersions_FormId_VersionNumber`, `UX_FormVersions_Draft`, `UX_FormVersions_Published`), 3 checks (`CK_FormVersions_SchemaV1`, `CK_FormVersions_Status`, `CK_FormVersions_VersionNumberPositive`), 6 FKs, 2 provenance columns and RowVersion. `sqlserver22` on 1433 was never touched.
- **Repeatability**: re-running the script against the initialized database skips the baseline and re-applies both migrations without errors or duplicated objects.
- **Teardown**: `docker compose -p form-management-rehearsal down -v` removed container, volume and network; no leftovers.

## Bug found and fixed during verification

Re-running migration `001` through sqlcmd after `002` exists failed with Msg 1934 (`QUOTED_IDENTIFIER`): sqlcmd sessions run with `QUOTED_IDENTIFIER OFF`, and the `UPDATE dbo.FormVersions` in `001` line 56 touches a table that now has filtered indexes from `002`. The bootstrap script now prepends `SET QUOTED_IDENTIFIER ON;` to every piped batch. This is the same class of issue previously observed with DELETEs against the filtered-index tables. The manual procedure in the migrations README now carries the same note.

## Decisions recorded

- pnpm declared official; npm lockfile abandoned (it was already deleted on disk).
- Current `pnpm-lock.yaml` resolutions accepted (no bulk upgrade).
- Compose image pinned by CU tag (`2022-CU27-ubuntu-22.04`); update consciously.
- Rehearsals use `-p <name>` plus `MSSQL_PORT` overrides; the committed default port stays 1433.

## Follow-ups

- Commit the lockfile swap (`-d web/package-lock.json` + add `web/pnpm-lock.yaml`) together with the new pinning files.
- Optional: a CI job could later run `scripts/init-local-db.ps1` against a service container.
