## Context

The developer machine runs Node 22.13.0, pnpm 10.33.0 and .NET SDK 10.0.201, but the repository pins none of them: `web/package-lock.json` is still tracked (deleted on disk), `web/pnpm-lock.yaml` exists only locally, and `AGENTS.md` documents npm commands while `README.md` documents pnpm. SQL Server runs only as the hand-made `sqlserver22` container (SQL Server 2022 Developer, port 1433, volume created outside the repo); a fresh clone has no way to provision `form_structure` with the baseline schema plus migrations `001` and `002`.

## Goals / Non-Goals

**Goals:**

- One official package manager (pnpm) with exactly one tracked frontend lockfile.
- Pinned, documented versions of Node, pnpm and the .NET SDK that match the verified local toolchain.
- A versioned, opt-in Docker Compose stack that provisions a disposable SQL Server and initializes `form_structure` end-to-end with a single scripted command.
- Consistent tooling commands across `AGENTS.md`, `README.md` and `package.json`.

**Non-Goals:**

- Updating application dependencies or regenerating the pnpm lockfile with newer resolutions.
- CI pipelines, containerizing the API or the frontend.
- Touching the existing `sqlserver22` container, its volume, or the current `form_structure` data.
- EF Core migrations; the database-first, versioned SQL scripts approach stays.

## Decisions

- **pnpm as official manager, versions pinned as-is.** `packageManager: "pnpm@10.33.0"` (Corepack), `engines: { node: ">=22.13.0 <23", pnpm: ">=10.33.0 <11" }`, `.node-version` with `22.13.0`, and `api/global.json` with SDK `10.0.201` and `rollForward: latestFeature`. Rationale: freeze what is already verified rather than upgrade; alternatives (npm lockfile restore, unpinned ranges) were rejected because they keep the reproducibility gap.
- **Accept the current `pnpm-lock.yaml` resolutions.** It resolves several newer versions than the deleted npm lockfile; converting it is out of scope. The tracked file becomes the single source of truth and `pnpm install --frozen-lockfile` is the documented install command.
- **Allow esbuild's build script via `pnpm.onlyBuiltDependencies`.** pnpm 10 blocks postinstall scripts by default; without this entry a clean install cannot run Vite/esbuild.
- **Compose stack is opt-in and isolated.** Project name `form-management`, container port 1433 published on host `1433` only when the developer stops `sqlserver22` (documented); volume `form-management-sql-data` is separate from the existing `sqlvolume`. Image `mssql/server-2022` pinned to a current 2022 CU tag. `SA_PASSWORD` comes from a git-ignored `.env`; `.env.example` documents the variable names.
- **Bootstrap is a one-shot script, not a container entrypoint.** `scripts/init-local-db.ps1` waits for the `sqlcmd` healthcheck, then runs (with `-b`, inside one transaction where applicable) `NewFile1.sql` → `001` → `002` against `form_structure`. Rationale: the same scripts drive the manual `sqlserver22` flow, keep the documented deployment procedure authoritative, and the script is idempotent (migrations are guarded) so re-running it is safe. The script accepts a `-Server` parameter so it can target any SQL instance (e.g., a disposable one on another port) for rehearsal.
- **Rehearsal on a different host port.** Verification brings the stack up on host port `14331` so the running `sqlserver22` on `1433` is never disturbed; the committed default remains `1433`.

## Risks / Trade-offs

- [Port 1433 conflict if both stacks run] → Documented: stop `sqlserver22` before starting the Compose stack on the default port; rehearsal uses `14331`.
- [`.env` with a local password could be committed] → `.env` added to `.gitignore` before any `.env` file exists; only `.env.example` is tracked.
- [Corepack ignored by developers using a global pnpm] → `engines` + documented install command still guard versions; `packageManager` enables the strict path.
- [Bootstrap script drifts from manual procedure] → Both paths execute the same files under `api/FormManagementApi/Database/Migrations` and `NewFile1.sql`; the migrations README references the script.
- [Frozen lockfile blocks `pnpm install` after future dependency edits] → Expected behavior; edits must update the lockfile in the same change.

## Migration Plan

1. Land toolchain files (`package.json` fields, `.node-version`, `global.json`, lockfile swap, `.gitignore`, `AGENTS.md`) — reversible by deleting the files.
2. Land Compose/bootstrap files and docs.
3. Verify: `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `dotnet build`, backend tests against existing `sqlserver22`, and a full rehearsal of `init-local-db.ps1` against a disposable instance on port 14331 that is torn down afterwards.
4. Rollback: revert the commit; nothing in running systems or shared data changes.

## Open Questions

- None blocking; the exact SQL Server 2022 CU tag is chosen at implementation time from the current Docker Hub tags and recorded in `compose.yml`.
