# AGENTS.md - Form Management Repository

## Project Structure

This is a monorepo with two main packages:

- `web/` - React 19 frontend (Vite, TypeScript)
- `api/` - .NET backend API

## Developer Commands

Toolchain is pinned: Node 22.13.0 (`web/.node-version`), pnpm 10.33.0 (`packageManager` in `web/package.json`, enable via Corepack), .NET SDK 10.0.201 (`api/global.json`). Use pnpm for all frontend commands.

### Frontend (web/)

```bash
cd web
pnpm install --frozen-lockfile # Install dependencies (single lockfile: pnpm-lock.yaml)
pnpm dev      # Start dev server
pnpm build   # Typecheck + build (tsc -b && vite build)
pnpm lint    # ESLint (0 errors, 0 warnings)
pnpm test:unit # Unit tests (vitest)
```

### Testing (web/)

```bash
cd web
pnpm exec playwright test           # Run all tests (headed by default)
pnpm exec playwright test <file>     # Run single test file
```

Tests are in `tests/` directory. Playwright config is in `playwright.config.ts`.

### Local database

The fastest way to run everything (SQL Server + API + frontend) is the full Compose stack:

```bash
cp .env.example .env    # set MSSQL_SA_PASSWORD
docker compose --env-file .env up --build
```

- Frontend (Vite): http://localhost:5173
- API + Scalar: http://localhost:5165/scalar
- `db-init` applies `NewFile1.sql` + migrations 001 + 002 automatically (repeatable).

For frontend hot-reload during development, add `--watch` (foreground; syncs `web/` into the container so Vite reloads without rebuild):

```bash
docker compose --env-file .env up --build --watch
```

SQL Server alone can also be provisioned without the API/frontend services (does not touch any pre-existing container or volume):

```bash
cp .env.example .env    # set MSSQL_SA_PASSWORD
docker compose --env-file .env up -d sqlserver db-init
```

See `api/FormManagementApi/Database/Migrations/README.md` for the manual procedure.

## Architecture

### Frontend (web/)

- Entry: `src/main.tsx` → `src/App.tsx` → `src/router.tsx`
- Path alias: `@/*` → `./src/*`
- API URL: `http://localhost:5165` by default, overridable with `VITE_API_URL` (configured in `src/config/env.ts`)
- State: Zustand stores in `src/store/`
- Data fetching: TanStack Query in `src/services/`

### Feature Structure (web/src/features/forms/)

```
pages/       - Route components (FormListPage, FormDetailPage, CreateFormPage, FormPage)
components/ - Feature-specific components
hooks/      - Feature hooks (useForms.ts)
```

## OpenSpec Workflow

This repo uses the OpenSpec system for change management. Workflows are in `.agent/workflows/`:

- `/opsx:explore` - Think through problems, investigate codebase
- `/opsx:propose` - Create change proposals
- `/opsx:apply` - Apply approved changes
- `/opsx:archive` - Archive completed changes

Skills are in `.agent/skills/`.

## Code Quality

- React 19 with hooks - avoid `&&` for falsy values, use ternaries
- Heavy components (dnd-kit) - use React.lazy()
- TypeScript - project references in `tsconfig.json`
- ESLint config in `eslint.config.js`
- Tailwind CSS v4 with `@tailwindcss/vite`

## Important Notes

- Tests require dev server running on `http://localhost:5173` (Vite default)
- No pre-commit hooks configured
- Build order: lint → typecheck → test (not enforced)

## Base de datos local

La base de datos de desarrollo es el SQL Server del stack Compose (servicio `sqlserver`):

```powershell
cp .env.example .env   # definir MSSQL_SA_PASSWORD
docker compose --env-file .env up -d
```

- El puerto host es `MSSQL_PORT` de `.env` (14331 en el entorno local actual); `db-init` crea `form_structure` y aplica `NewFile1.sql` → migraciones 001 → 002 automáticamente.
- Para inspeccionar o validar la base local, usar siempre esta instancia. `sqlserver22` (puerto 1433) es un contenedor manual legacy: no es necesario para ninguna tarea y no debe requerirse.
- Tests de integración backend: configurar `FORM_SCHEMA_TEST_SQL` contra la instancia Compose (ejemplo en `api/FormManagementApi/Database/Migrations/README.md`). Las pruebas crean y dropan sus propias bases desechables `form_schema_tests_*`; eso está permitido.
- No borrar, resetear ni migrar `form_structure` ni tocar volúmenes salvo instrucción explícita.
