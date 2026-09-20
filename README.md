# Form Management

Herramienta interna para definir, administrar y versionar formularios dinámicos mediante estructuras JSON. El repositorio es un monorepo con un frontend React y una API ASP.NET Core.

## Estructura

- `web/`: React 19, TypeScript, Vite, Zustand, React Hook Form y Playwright.
- `api/`: ASP.NET Core, Carter, Entity Framework Core y SQL Server.
- `openspec/`: specs vigentes y cambios gestionados mediante el workflow `spec-driven`.
- `docs/`: estado operativo y backlog priorizado.

## Estado Actual

- El build frontend está verde con `pnpm build`.
- Los estados canónicos de versión son `Draft`, `Published` y `Archived`.
- El flujo completo de creación, clonado, publicación y persistencia de versiones todavía no está implementado.
- El lint finaliza sin errores y mantiene 8 warnings conocidos; la suite Playwright requiere trabajo adicional.

Consulta [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) para el estado detallado y [`docs/BACKLOG.md`](docs/BACKLOG.md) para las próximas tareas.

## Desarrollo Local

Frontend:

```powershell
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Backend:

```powershell
cd api
dotnet restore "FormManagementApi.sln"
dotnet run --project "FormManagementApi/FormManagementApi.csproj" --launch-profile https
```

La API espera SQL Server en `localhost:1433`. El entorno local conocido usa el contenedor Docker `sqlserver22`, pero el repositorio todavía no incluye una definición reproducible para crearlo e inicializarlo. No elimines ni reutilices destructivamente su volumen; consulta [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Verificación

```powershell
cd web
pnpm build
pnpm lint
pnpm exec playwright test
```

`pnpm build` y `pnpm lint` funcionan actualmente; el lint conserva 8 warnings documentados. Playwright tiene problemas conocidos y no debe asumirse verde.
