# Form Management

Herramienta interna para definir, administrar y versionar formularios dinámicos mediante estructuras JSON. El repositorio es un monorepo con un frontend React y una API ASP.NET Core.

## Estructura

- `web/`: React 19, TypeScript, Vite, Zustand, React Hook Form y Playwright.
- `api/`: ASP.NET Core, Carter, Entity Framework Core y SQL Server.
- `openspec/`: specs vigentes y cambios gestionados mediante el workflow `spec-driven`.
- `docs/`: estado operativo y backlog priorizado.
- `contracts/form-schema/v1/`: [contrato inglés versionado, ejemplos y corpus compartido](contracts/form-schema/v1/README.md), usado por API y builder.

## Estado Actual

- El build frontend está verde con `pnpm build`; lint sin errores ni warnings.
- Los estados canónicos de versión son `Draft`, `Published` y `Archived`.
- La API inicializa schemas v1, permite GET/PUT Draft-only con RowVersion y expone el ciclo de vida completo (derivar versión, clonar formulario, publicar atómicamente y archivar). El builder carga/edita v1 y guarda explícitamente; el renderer dinámico de respuestas sigue pendiente.
- El toolchain está fijado (Node, pnpm, .NET SDK) y existe un bootstrap reproducible de SQL Server con Docker Compose.

Consulta [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) para el estado detallado y [`docs/BACKLOG.md`](docs/BACKLOG.md) para las próximas tareas.

## Desarrollo Local

Requisitos (versiones fijadas): Node 22.13.0 (`web/.node-version`), pnpm 10.33.0 (Corepack, `packageManager` en `web/package.json`), .NET SDK 10.0.201 (`api/global.json`).

### Todo el stack con Docker (recomendado)

Levanta SQL Server, la API y el frontend en un solo comando:

```powershell
cp .env.example .env   # definir MSSQL_SA_PASSWORD (una sola vez)
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **API + Scalar**: http://localhost:5165/scalar
- La base se inicializa sola (`db-init` aplica `NewFile1.sql` + migraciones 001/002; es repetible).
- Para parar: `docker compose down` (añade `-v` si quieres borrar también los datos de SQL).

Para **desarrollar con hot-reload** del frontend, usa el modo watch (queda en foreground; sincroniza los cambios de `web/` al contenedor y Vite los recarga sin rebuild):

```powershell
docker compose up --build --watch
```

Tras cambiar código de la API: `docker compose up --build api`.

El Compose publica SQL Server en el puerto host `14331` por defecto para no chocar con un contenedor `sqlserver22` preexistente en 1433; la API habla con SQL por la red interna (`sqlserver:1433`), así que el puerto del host solo afecta a herramientas externas. Si no usas `sqlserver22`, puedes fijar `MSSQL_PORT=1433` en `.env`.

### Sin Docker (manual)

Frontend:

```powershell
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Base de datos por separado (sin API ni frontend, para desarrollo local mixto):

```powershell
cp .env.example .env   # definir MSSQL_SA_PASSWORD
docker compose --env-file .env up -d sqlserver db-init
```

La opción manual equivalente (contenedor propio `sqlserver22` u otro) y el detalle de migraciones están en [`api/FormManagementApi/Database/Migrations/README.md`](api/FormManagementApi/Database/Migrations/README.md). No elimines ni reutilices destructivamente volúmenes preexistentes; consulta [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

Backend:

```powershell
cd api
dotnet restore "FormManagementApi.sln"
dotnet run --project "FormManagementApi/FormManagementApi.csproj" --launch-profile https
```

La API espera SQL Server en `localhost:1433` (ajustable con `ConnectionStrings__DockerConnection`).

## Verificación

```powershell
cd web
pnpm build
pnpm lint
pnpm test:unit
pnpm exec playwright test
```

`pnpm build` y `pnpm lint` funcionan actualmente (lint en 0 errores y 0 warnings). La suite Playwright corre en modo headed y requiere el dev server; las suites focalizadas (listado, builder y ciclo de vida) están verdes y los specs legacy de una UI retirada fueron eliminados.

Tests de contrato backend desde la raíz:

```powershell
dotnet test api/FormManagementApi.Tests/FormManagementApi.Tests.csproj
```

Para pruebas SQL/HTTP, configurar `FORM_SCHEMA_TEST_SQL` según [las instrucciones de migración](api/FormManagementApi/Database/Migrations/README.md); sin esa variable las pruebas SQL se omiten explícitamente. El backend local usa la migración v1 aplicada en `sqlserver22` y expone `GET/PUT /forms/{formId}/versions/{versionId}/schema`.
