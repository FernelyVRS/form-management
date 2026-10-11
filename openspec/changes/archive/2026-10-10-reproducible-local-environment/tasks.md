## 1. Toolchain pinning

- [x] 1.1 Add `packageManager`, `engines` and `pnpm.onlyBuiltDependencies` (esbuild) to `web/package.json`
- [x] 1.2 Create `web/.node-version` (22.13.0) and `api/global.json` (SDK 10.0.201, rollForward latestFeature)
- [x] 1.3 Confirm `web/pnpm-lock.yaml` is current and `web/package-lock.json` remains untracked
- [x] 1.4 Add `.env` to the root `.gitignore` before any `.env` exists

## 2. SQL Server bootstrap

- [x] 2.1 Write `compose.yml` with pinned SQL Server 2022 image, healthcheck, dedicated named volume and credentials from `.env`
- [x] 2.2 Write `.env.example` documenting `MSSQL_SA_PASSWORD` (and optional port) with placeholder values
- [x] 2.3 Write `scripts/init-local-db.ps1` (readiness wait, create `form_structure`, apply NewFile1.sql → 001 → 002 with `sqlcmd -b`, `-Server` parameter, repeatable)
- [x] 2.4 Reference the bootstrap script from `api/FormManagementApi/Database/Migrations/README.md`

## 3. Documentation

- [x] 3.1 Align `AGENTS.md` frontend commands to pnpm and document the Compose bootstrap flow
- [x] 3.2 Update `README.md` with the reproducible environment section
- [x] 3.3 Mark TASK-004/TASK-005 progress in `docs/BACKLOG.md` and `docs/PROJECT_STATUS.md`

## 4. Verification

- [x] 4.1 `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint` and `pnpm test:unit` succeed with the pinned toolchain
- [x] 4.2 `dotnet build` and backend tests succeed against the existing `sqlserver22` (untouched)
- [x] 4.3 Rehearsal: bring the stack up on host port 14331, run the bootstrap script, verify catalog/constraints, tear the rehearsal down
- [x] 4.4 `openspec validate` passes and `implementation-results.md` records outcomes
