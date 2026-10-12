# Project Status

> Estado reconstruido el 2026-09-19 y actualizado el 2026-10-10. Este documento distingue entre hechos confirmados, inferencias y decisiones pendientes. El repositorio contiene cambios locales sin commit, por lo que el estado descrito no coincide completamente con `HEAD`.

## Descripción del proyecto

### Actualización: entorno reproducible (2026-10-10)

Cierre de TASK-004 y TASK-005 vía el change archivado `reproducible-local-environment`:

- Toolchain fijado: pnpm 10.33.0 (`packageManager`/Corepack), Node 22.13.0 (`web/.node-version` + `engines`), .NET SDK 10.0.201 (`api/global.json`, `rollForward: latestFeature`); `pnpm.onlyBuiltDependencies` con esbuild; único lockfile `web/pnpm-lock.yaml` (`package-lock.json` eliminado); raíz `.gitignore` con `.env`.
- SQL Server reproducible: `compose.yml` con imagen fijada `2022-CU27-ubuntu-22.04`, healthcheck, volumen propio por proyecto (distinto de `sqlvolume`) y puerto `${MSSQL_PORT:-1433}`; `.env.example` sin secretos; `scripts/init-local-db.ps1` espera readiness, crea `form_structure`, aplica NewFile1 → 001 → 002 con `sqlcmd -b` y verifica constraints.
- Bug encontrado y corregido en la verificación: sqlcmd corre con `QUOTED_IDENTIFIER OFF`; re-ejecutar la migración 001 sobre una base ya migrada fallaba con Msg 1934 por los índices filtrados del 002. El script ahora fuerza `SET QUOTED_IDENTIFIER ON;` (nota añadida al README de migraciones).
- Verificación: rehearsals completos en puerto 14331 con proyecto aislado (`form-management-rehearsal`): bootstrap fresh y re-ejecución sobre base inicializada, catálogo verificado y teardown limpio. `sqlserver22` intacto. Frontend `pnpm install --frozen-lockfile` + build + lint 0/0 + 85 unitarios; backend build 0 errores + 83 tests. AGENTS.md y README.md usan pnpm y documentan el flujo Compose.
- Pendiente de commit por parte del usuario: lockfile swap (`-d web/package-lock.json` + `web/pnpm-lock.yaml` sin trackear) y los archivos de pinning/artefactos nuevos.

### Actualización: higiene de calidad (2026-10-10)

- Archivados los 4 changes completados sin archivar (`restore-reliable-frontend-lint`, `adopt-versioned-english-form-schema`, `persist-form-version-schema`, `migrate-form-builder-to-schema-v1`) tras sincronizar sus delta specs como specs principales (`frontend-lint-quality-gate`, `form-schema-contract`, `form-version-schema-persistence`, `form-schema-builder`). Quedan 0 cambios activos y 7 archivados; 7 specs principales.
- Warnings backend eliminados: retirados los 4 `.WithOpenApi()` obsoletos (ASPDEPR002) en CreateForm, GetForms, GetFormById y GetFormVersionById; fijado `Microsoft.OpenApi 2.7.5` en `FormManagementApi.csproj` (parche de GHSA-v5pm-xwqc-g5wc, CVE-2026-49451). `dotnet build -t:Rebuild`: 0 warnings, 0 errors; `dotnet list package --vulnerable --include-transitive`: sin paquetes vulnerables.
- Warnings frontend eliminados: `SelectDependedTypeFields.tsx` ahora usa effects con guard por refs (sin dependencias faltantes); `react-refresh/only-export-components` configurado con `allowConstantExport` y `allowExportNames: ["useFormField", "badgeVariants", "buttonVariants"]` para los exports canónicos de shadcn/ui. `pnpm lint`: 0 errores y 0 warnings (antes 0/5).
- Playwright siempre headed: `headless: false` en `web/playwright.config.ts`; el `webServer` inicia Vite en 5173. Los 3 suites legacy de tabs fueron eliminados (2026-10-10); quedan 4 archivos y 29 tests, todos en verde.
- Verificación: backend 83/83, frontend 85/85 unitarios, `pnpm build` y `pnpm lint` verdes.

### Actualización: contrato HTTP de formularios (2026-10-12)

Cambio OpenSpec `specify-form-http-contract` implementado y verificado (14 tareas). Los tres endpoints básicos quedan alineados a la matriz aprobada, unificando el wire format con los endpoints del ciclo de vida. **Cambio breaking en el wire:** las respuestas ahora usan claves en inglés; el modelo interno del frontend permanece en español y la traducción ocurre solo en la frontera Zod (`formsApi.ts`, `useFormLifecycle.ts`, `services/form.ts`).

- `GET /forms` → `[{ id, name, description, createdAt, updatedAt, totalVersions, latestVersion, latestVersionId }]`, proyección de última versión null-safe (sin `First()` que lanza).
- `POST /forms` → request `{ name, description? }` con validación manual (name faltante/vacío/no-string, description no-string o JSON malformado → `400 invalid_request` sin efectos secundarios); respuesta `201 { formId, versionId, number }` + `Location: /forms/{formId}`; timestamps UTC (`DateTime.UtcNow`).
- `GET /forms/{formId}` → `{ id, name, description, createdAt, updatedAt, versions: [{ id, number, status, rowVersion, createdAt, updatedAt }] }` ordenados asc por number; `404` con ProblemDetails `code: form_not_found`.
- ProblemDetails unificado: helper extraído a `Features/Forms/Shared/Problems/ApiProblems.cs`; `LifecycleProblems` delega sin cambio de comportamiento.
- Playwright: fixtures de `builder-workspace`, `form-builder-v1`, `form-list` y `form-version-lifecycle` migrados a claves inglesas.

Verificación: backend **94/94** con SQL real (`FormHttpContractTests` añade 11 tests de contrato con `SqlSchemaTestHost`; `SchemaPersistenceTests` y `LifecycleTests` actualizados al wire nuevo); frontend **96/96** unitarios (tests de frontera en `formsApi.test.ts`, `useFormLifecycle.test.ts`, `form.test.ts` que rechazan el formato legacy), `pnpm build` y `pnpm lint` (0/0) verdes; `openspec validate --all` 9/9. Verificado en vivo: API Docker reconstruida responde con claves inglesas y nulls presentes (`"description"`, `"updatedAt":null`); openapi/v1.json sin claves legacy.

### Actualización: ciclo de vida de versiones (2026-10-10)

Ciclo de versiones completo en código: `POST /forms/{id}/versions` (derivar desde Published/Archived), `POST /forms/from-version` (clonar formulario), `POST .../publish` (atómico, archiva la publicación anterior) y `POST .../archive` (solo Draft), con ≤1 Draft y ≤1 Published por formulario, numeración estable que incluye Archived, lock de fila y transacciones explícitas. ProblemDetails con códigos estables (`version_conflict`, `not_publishable`, etc.). `GetFormById` devuelve versiones ordenadas con `rowVersion` y 404 real.

Frontend: módulo `formLifecycleApi` + hooks TanStack Query (sin reintentos en mutaciones), `FormDetailPage` con resumen real de publicación ("Sin publicación" incluido), acciones por estado con confirmación que cancela sin petición, `VersionModal` con fuentes Published+Archived (Draft excluido), "Continuar borrador" y clonado que conserva el input en errores. `getFormByIdWithVersions` eliminado; builder y detalle comparten `useFormDetailQuery`.

Verificación: backend 83/83 con SQL real (15 tests de integración del ciclo de vida); frontend build/lint verdes, 85 unitarios y Playwright: 8 nuevos del ciclo de vida y suites focalizadas form-list/builder/form-builder en verde. Los suites legacy de tabs (`question-*`, `section-*`) siguen fallando por una UI eliminada, ajeno a este cambio.

Migración 002 desplegada en `form_structure` (2026-10-10) tras backup verificado `sqlserver22:/var/opt/mssql/data/form_structure_before_lifecycle_2026-10-10.bak`; idempotente y con restricciones verificadas por sondeos en transacciones con rollback. La verificación en vivo encontró y corrigió un bug del publish atómico: el orden del batch de `SaveChanges` de EF depende de la clave, y si el GUID del Draft ordenaba antes que el Published el índice filtrado rechazaba la transición; ahora se archiva en un `SaveChanges` propio antes de promover, con test de regresión `PublishReplacesPreviousPublishedWhenDraftKeySortsFirst`. Ciclo completo verificado contra el formulario de prueba: publish→derive (fidelidad de snapshot)→publish con auto-archivo→recuperación desde Archived→clonado con provenance; invariantes rechazan con códigos estables. Estado local: v1 Archived, v2 Published, v3 Draft (recuperación) y clon "Verificacion ciclo lifecycle". Detalle en `openspec/changes/manage-form-version-lifecycle/implementation-results.md`.

### Actualización: contrato inglés v1

UI/UX del builder mejorada: workspace de ancho completo con outline/búsqueda, selección persistida en URL, canvas compacto y panel de propiedades. Editor responsive conserva valores al pasar de desktop a móvil; protege propiedades sin aplicar. Opciones dependientes se editan visualmente, con JSON avanzado opcional. Barra de guardado visible, Ctrl/Cmd+S, validación inline en español y controles/inspección read-only accesibles. Ver `docs/BUILDER_UI_REVIEW.md`: 63 tests unitarios y 21 Playwright focalizados correctos, build verde y lint sin errores (6 warnings existentes).

Datos locales de prueba después de la limpieza solicitada: se eliminaron los 3 formularios antiguos y sus 3 versiones, tras backup verificado `sqlserver22:/var/opt/mssql/data/form_structure_before_test_seed_2026-10-01_20-02-07.bak`. Queda un formulario **Formulario de prueba v1** (`ea007cc2-8ca2-430e-be90-31d5f7723c46`), versión Draft 1 (`f2eb4844-fc17-463c-b2ab-3e73161799d4`). Su schema está en `contracts/form-schema/v1/examples/test-form.json`: dos secciones, todos los tipos soportados y un grupo en la primera, segunda vacía. Creado/validado/guardado mediante POST forms y PUT schema. Las auditorías con 3 placeholders más abajo son históricas. La prueba smoke de lectura elige un formulario existente en lugar de depender de IDs eliminados.

El contrato activo está en `contracts/form-schema/v1/README.md` y `form-schema.schema.json`: envelope versionado, keys inglesas, groups de un nivel, variable/core obligatorios, descripciones, min/max/maxLength y dependencias por variable. Zod y .NET comparten fixtures de aceptación y round-trip. El builder activo ya usa v1; las observaciones históricas sobre Seccion/mock más abajo describen la implementación anterior y quedan supersedidas por esta actualización.

Auditoría SQL solo lectura en `sqlserver22` / `form_structure`: 3 formularios y 3 versiones Draft número 1, todas con `SchemaJson = "{}"`, sin derivadas ni Drafts/números duplicados. No había RowVersion ni constraint JSON. Es una fotografía previa a la migración, no una garantía sobre futuros registros. Este cambio no modifica SQL ni endpoints.

Persistencia v1 implementada y desplegada localmente: GET/PUT `/forms/{formId}/versions/{versionId}/schema`, validación v1, Draft-only, RowVersion y preservación de variables/campos core derivados. Se verificó nuevamente la auditoría y se convirtió únicamente los 3 `{}` conocidos, conservando metadata. La base tiene RowVersion y `CK_FormVersions_SchemaV1` habilitado/trusted. Backup verificado en `sqlserver22`: `/var/opt/mssql/data/form_structure_before_schema_v1_2026-10-01_16-32-00.bak`. API activa en `http://localhost:5165`; GET de las tres versiones correcto.

Pruebas backend: 68 correctas, incluidas 11 de integración SQL/HTTP con bases temporales aisladas; las bases temporales se eliminaron al terminar. El entorno `model` contiene tablas de aplicación que se heredan al crear bases; los tests recrean únicamente sus copias temporales, no modifican model. Instrucciones en `api/FormManagementApi/Database/Migrations/README.md`.

Builder migrado: GET/PUT v1, Query por form/version, store aislado por instancia de ruta, CRUD Section/Group/Field con RHF, opciones estáticas/dependientes y constraints, orden normalizado, DnD lazy y movimiento por teclado/editor. Guardado explícito con estados/errores, protección de campos guardados, conflictos con recarga confirmada y bloqueo de navegación/unload dirty. /view y estados no-Draft muestran estructura sin controles de edición.

El mock legacy fue eliminado definitivamente el 2026-10-11; ya no hay bootstrap mock, hooks fake, servicios /estructura ni snapshot JSON de referencia. Los entry points de creación/detalle mapean respuestas directas y numeroVersion. Pruebas frontend: 63 unitarias y 16 Playwright del builder/listado con smoke local de solo lectura habilitado. Lint: 0 errores y 6 warnings residuales. Persistencia SQL no fue modificada por el cambio frontend.

Pendiente: renderer dinámico de respuestas. No se implementó compatibilidad legacy; el contenido del mock anterior fue eliminado en la limpieza de 2026-10-11.

Verificación del contrato: `pnpm test:unit` en web y `dotnet test api/FormManagementApi.Tests/FormManagementApi.Tests.csproj` desde la raíz. El corpus distingue estructura JSON Schema de reglas semánticas, con serializers probados en ambos runtimes.

Form Management es una herramienta interna para definir, administrar y versionar formularios dinámicos mediante estructuras JSON.

El objetivo documentado es evitar formularios hardcodeados y permitir que su estructura cambie sin modificar el código de la aplicación. Los formularios resultantes serán consumidos por otro sistema.

Problemas que busca resolver:

- Formularios extensos y variables según ubicación, dispositivo u otras reglas.
- Alto tiempo de implementación al modificar formularios en código.
- Dificultad para validar cambios.
- Baja reutilización y escalabilidad.
- Riesgo elevado de errores al mantener estructuras hardcodeadas.

Fuentes principales: `RPM-context-project.md` y `openspec/config.yaml`.

## Stack tecnológico

### Frontend

- React 19.2.x.
- TypeScript 5.7.x.
- Vite 6.4.x.
- React Router 7.14.x.
- TanStack React Query 5.100.x.
- Zustand 5.0.x.
- React Hook Form 7.73.x.
- Zod 3.25.x, instalado pero no integrado en los formularios revisados.
- Tailwind CSS 4.2.x.
- Radix UI y componentes shadcn.
- dnd-kit para drag-and-drop.
- Playwright 1.59.x para pruebas E2E.
- pnpm como gestor usado por el árbol local actual.

### Backend

- C# y ASP.NET Core.
- Target efectivo: .NET 10 (`net10.0`).
- Carter 10 para Minimal APIs.
- Entity Framework Core 10.0.5.
- SQL Server.
- Scalar para documentación OpenAPI.

La documentación de contexto todavía indica .NET 9. El `.csproj` y la compilación verificada requieren .NET 10.

### Herramientas verificadas en la máquina actual

- Node.js 22.13.0.
- pnpm 10.33.0.
- npm 10.9.2.
- .NET SDK 10.0.201.
- Docker CLI 29.4.2 y Docker Compose 5.1.3.

Estas son versiones de la máquina inspeccionada; desde el 2026-10-10 el repositorio las fija formalmente (ver "Versiones y reproducibilidad").

## Arquitectura

### Repositorio

Monorepo con frontend y backend separados:

```text
form-management/
  api/          Backend ASP.NET Core
  web/          Frontend React
  openspec/     Configuración y artefactos OpenSpec
  agent-os/     Estándares descubiertos del proyecto
  docs/         Documentación transversal
```

### Frontend

La organización principal es feature-based:

```text
web/src/features/forms/
  pages/
  components/
    builder/
  hooks/
  api/
  model/
  builder/            # store del builder aislado por ruta
```

Responsabilidades compartidas:

- `src/components/ui/`: primitives de UI.
- `src/components/forms/`: controles reutilizables por tipo de campo.
- `src/components/dnd/`: componentes drag-and-drop.
- `src/services/`: acceso HTTP.
- `src/store/`: stores Zustand.
- `src/types/`: contratos TypeScript.
- `src/mocks/`: estructura simulada de formulario.

El frontend combina actualmente estado local React, Zustand, TanStack Query y datos mock. Las responsabilidades entre estas fuentes todavía no están estabilizadas.

### Backend

El backend sigue parcialmente Vertical Slice Architecture:

```text
api/FormManagementApi/Features/Forms/<UseCase>/<UseCase>.cs
```

Los endpoints implementados repiten este patrón:

- Un módulo `Endpoint : ICarterModule`.
- Registro de ruta en `AddRoutes`.
- Handler estático asíncrono.
- Acceso directo a `AppDbContext`.
- DTOs definidos en el mismo slice.

No existen controllers, repositorios ni una capa de servicios intermedia.

### Persistencia

- Entidades principales: `Form` y `FormVersion`.
- `FormVersion.SchemaJson` almacena el esquema como texto.
- Mapeo de entidades mediante Fluent API en `AppDbContext.OnModelCreating`.
- SQL Server como base de datos.
- No hay migraciones EF Core ni inicialización automática.
- El esquema se crea manualmente con `api/FormManagementApi/NewFile1.sql`.

## Estructura principal

```text
api/
  FormManagementApi.sln
  FormManagementApi/
    Data/AppDbContext.cs
    Entities/
    Features/Forms/
    Properties/launchSettings.json
    Program.cs
    NewFile1.sql
    appsettings.json
    appsettings.Development.json

web/
  src/
    features/forms/
    components/
    services/form.ts
    store/
    types/
    mocks/formStructure.json
    router.tsx
  tests/
  package.json
  pnpm-lock.yaml
  playwright.config.ts
  vite.config.ts

openspec/
  config.yaml
  changes/
  specs/

agent-os/
  standards/
```

## Cómo ejecutar el proyecto

### Requisitos

- Node.js 22.13.0 (fijado en `web/.node-version` y `engines`).
- pnpm 10.33.0 (Corepack, `packageManager` en `web/package.json`).
- .NET SDK 10.0.201 (fijado en `api/global.json`).
- SQL Server accesible por TCP (reproducible vía `compose.yml`, ver abajo).
- Certificado HTTPS de desarrollo de .NET.
- Chromium de Playwright para ejecutar las pruebas E2E.

### Base de datos

La configuración de desarrollo espera:

```text
Server=localhost,1433
Database=form_structure
```

Opción reproducible (recomendada, no toca el volumen del contenedor preexistente `sqlvolume`):

```powershell
cp .env.example .env        # definir MSSQL_SA_PASSWORD
docker compose --env-file .env up -d
.\scripts\init-local-db.ps1 # crea form_structure y aplica NewFile1 → 001 → 002
```

El script espera readiness real, omite la baseline si ya existe, aplica migraciones con `sqlcmd -b` (forzando `QUOTED_IDENTIFIER ON`) y verifica tablas, índices, checks, FKs, columnas de provenance y RowVersion. Los rehearsales deben usar `-p <nombre>` y `MSSQL_PORT` para no colisionar con el stack por defecto.

Procedimiento manual alternativo en `api/FormManagementApi/Database/Migrations/README.md`.

### Backend

Desde `api/`:

```powershell
dotnet restore "FormManagementApi.sln"
dotnet run --project "FormManagementApi/FormManagementApi.csproj" --launch-profile https
```

URLs esperadas:

```text
https://localhost:7284
http://localhost:5165
https://localhost:7284/scalar
```

Compilación verificada:

```powershell
dotnet build "FormManagementApi.sln" --no-restore
```

Resultado al 2026-09-19: correcto, con 0 errores y 0 warnings.

### Frontend

Desde `web/`:

```powershell
pnpm install --frozen-lockfile
pnpm dev -- --host localhost --port 5173 --strictPort
```

URL esperada:

```text
http://localhost:5173
```

Se recomienda `--strictPort` porque CORS y los tests esperan exactamente el puerto 5173.

Scripts disponibles:

```powershell
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

No existen scripts `test`, `typecheck` o `test:e2e`.

Resultado al 2026-09-20: `pnpm build` finaliza correctamente. Vite mantiene un warning no bloqueante porque el chunk principal supera 500 kB después de minificación.

### Tests

Con Vite ejecutándose en el puerto 5173:

```powershell
pnpm exec playwright install chromium
pnpm exec playwright test
```

Estado verificado: Playwright descubre 15 tests, pero la suite actual falla porque navega a `/` esperando el builder y esa ruta ahora muestra `FormListPage`.

`dotnet test` finaliza correctamente, pero no ejecuta pruebas porque la solución no contiene un proyecto de tests.

## Configuración requerida

### Backend

- `ASPNETCORE_ENVIRONMENT=Development` es definido por los perfiles de lanzamiento.
- La aplicación lee `ConnectionStrings:DockerConnection`.
- Puede sobrescribirse mediante `ConnectionStrings__DockerConnection`.
- CORS acepta únicamente `http://localhost:5173`.
- OpenAPI y Scalar solo se publican en Development.

Problemas confirmados:

- La connection string de desarrollo contiene una contraseña SQL en texto plano.
- `DockerConnection` solo está presente en `appsettings.Development.json`.
- No hay configuración de conexión para otros ambientes dentro del repositorio.
- La conexión llamada `DockerConnection` apunta a `localhost`, pero no existe configuración Docker para crear SQL Server.

### Frontend

- La URL del API está hardcodeada como `https://localhost:7284` en `web/src/services/form.ts`.
- No se usa `VITE_API_URL`.
- No existen archivos `.env`.
- Vite no tiene proxy hacia el backend.

### Versiones y reproducibilidad

Fijadas por el repositorio desde el 2026-10-10 (change `reproducible-local-environment`):

- `api/global.json`: SDK 10.0.201 con `rollForward: latestFeature`.
- `web/.node-version` (22.13.0) y `engines` en `web/package.json` (Node `>=22.13.0 <23`, pnpm `>=10.33.0 <11`).
- `packageManager: "pnpm@10.33.0"` (Corepack).
- Lockfile único: `web/pnpm-lock.yaml` (rastrear al commit; `package-lock.json` eliminado).
- Infraestructura de base de datos: `compose.yml` + `.env.example` + `scripts/init-local-db.ps1` (ver sección Base de datos).

Siguen sin existir: lock de NuGet y CI.

## Funcionalidades implementadas

Las siguientes piezas existen y funcionan al menos de forma aislada. Esto no implica que todos los flujos estén integrados de extremo a extremo.

### Backend

- Entidades `Form` y `FormVersion`.
- Configuración EF Core y conexión a SQL Server.
- `GET /forms`.
- `GET /forms/{id}`.
- `GET /forms/{formId}/version/{id}`.
- `POST /forms`, que crea un formulario y su primera versión Draft.
- OpenAPI y Scalar en Development.

### Frontend

- Rutas para listado, creación, detalle, builder y visualización.
- Listado visual de formularios.
- Búsqueda local por nombre y descripción.
- Pantalla de creación de formulario.
- Pantalla de detalle con estados de carga, error y reintento.
- Historial visual mediante `VersionCard` y `StatusBadge`.
- Contrato frontend de estados de versión alineado con backend y SQL: `Draft`, `Published` y `Archived`.
- `VersionModal` reconoce versiones `Published`, excluye Draft y Archived como fuentes y conserva el estado vacío cuando no hay versiones publicadas.
- CRUD local de secciones y preguntas mediante Zustand.
- Formularios construidos con React Hook Form.
- Reordenamiento de secciones y preguntas mediante drag-and-drop.
- Componentes para preguntas de texto, número, selección, selección dependiente y compuestas.

### Organización

- Migración física de páginas, componentes y hooks de formularios a `src/features/forms/`.
- Agent OS instalado con estándares confirmados en `agent-os/standards/`.
- OpenSpec configurado con workflow `spec-driven`.

## Funcionalidades parcialmente implementadas

### Gestión de versiones

- `CreateFormVersion.cs` es un stub sin endpoint ni handler.
- No existe creación o clonado de versiones en backend.
- No existe publicación en backend.
- No se garantiza un único Draft.
- No existe archivado.
- `VersionModal` está montado, pero no hay un control activo que lo abra desde `FormDetailPage`.
- Las acciones de publicar y editar Draft están comentadas.
- Un Draft muestra `Edit`, pero navega a `/view`.
- La tarjeta de versión actual está hardcodeada como `v1.0.0 / Publicada`.

### Builder y persistencia

- El builder carga inicialmente un mock global.
- Intenta cargar y guardar estructura mediante endpoints que no existen.
- Solo el drag-and-drop intenta persistir.
- Crear, editar y eliminar secciones o preguntas solo modifica Zustand.
- La pestaña `Opciones` es un placeholder.
- Los inputs de filtro no tienen lógica.

### Visualización de versiones

- `/builder` y `/view` renderizan el mismo `FormPage` editable.
- No se impide editar una versión Published por URL directa.
- No existe un modo read-only efectivo.

### Creación de formularios

- El formulario frontend existe.
- El backend `POST /forms` existe.
- La integración está rota porque el frontend espera `json.data` y el backend devuelve el DTO directamente.
- La creación desde una versión llama a un endpoint inexistente.

### Schema JSON

No existe un contrato único implementado. Conviven al menos tres variantes:

- El formato definido en `openspec/config.yaml` y el PRD.
- Los tipos y mock actuales del frontend.
- `json sructure borrador.json`.

Las variantes difieren en nombres de propiedades, tipos, validaciones, dependencias y estructura de secciones.

## Trabajo pendiente

Prioridad alta:

1. ~~Formalizar en OpenSpec el contrato HTTP básico de formularios (TASK-003)~~ — completado 2026-10-12 con el change `specify-form-http-contract` (aplicado y verificado; ver sección "Actualización: contrato HTTP de formularios").
2. Implementar el renderer dinámico `render-form-schema-v1` (backlog item 4): la última pieza funcional del ciclo definir→editar→versionar→publicar→ver.

Cerrado o mayormente cerrado desde el 2026-09-20: TASK-001 (build), TASK-002 (lint, archivado), TASK-004 y TASK-005 (entorno reproducible, archivados 2026-10-10), TASK-003 (spec formal del contrato HTTP, completado 2026-10-12), TASK-006 (contrato básico: respuesta directa y ciclo de vida; residuos acotados tras TASK-003: `GetFormVersionById` y nullability restante), TASK-007 (suites legacy de tabs eliminados 2026-10-10), TASK-008 (creación/clonado/publicación/archivo de versiones, era `manage-form-version-lifecycle`), TASK-009 (mayormente: /view y no-Draft son read-only; quedan matices de protección por URL).

Trabajo posterior sin tarea acotada: renderer de respuestas, persistencia de respuestas, listas de entidades y reglas complejas, contrato de integración con el sistema consumidor, CI, health checks y autenticación.

TODO explícitos en código:

- Generar GUID desde código: `CreateForm.cs`.
- Guardar usuario en base de datos: `CreateForm.cs`.

## Estado de OpenSpec

Estado verificado con la CLI el 2026-10-10:

```text
Workflow: spec-driven
Cambios activos: 0
Cambios archivados: 8
Specs principales: 8
Último change: reproducible-local-environment (archivado 2026-10-10)
```

Specs principales vigentes en `openspec/specs/`: `version-status-contract`, `form-list-retrieval`, `form-version-lifecycle`, `frontend-lint-quality-gate`, `form-schema-contract`, `form-version-schema-persistence`, `form-schema-builder` y `local-environment-bootstrap`.

Los 8 changes completados se conservan en `openspec/changes/archive/` (`2026-09-20-fix-version-status-contract`, `2026-09-21-modernize-form-list-data-flow` y los seis de 2026-10-10). `openspec list` no devuelve cambios activos: `No active changes found.`

Los documentos de `web/docs/specs/` son especificaciones manuales y no artefactos reconocidos por OpenSpec. `2026-02-form-detail-module.md` está marcado `Approved`, pero su implementación es parcial y esa aprobación no pertenece al workflow formal de OpenSpec.

## Problemas conocidos

### Compilación y calidad

- `pnpm build` está verde desde el 2026-09-20; la comparación obsoleta `"publicada"` fue reemplazada por `Published`.
- Vite advierte que el chunk principal minificado supera 500 kB; no bloquea el build.
- `pnpm lint` finaliza con **0 errores y 0 warnings** desde el 2026-10-10; los warnings diferidos de hooks y React Refresh fueron corregidos o permitidos de forma canónica (shadcn) y `dist/` sigue excluido.
- `dotnet build` finaliza con **0 warnings y 0 errors** desde el 2026-10-10 (ASPDEPR002 retirado, Microsoft.OpenApi fijado en 2.7.5 sin vulnerabilidades transitivas).
- ESLint declara React 18, mientras el proyecto usa React 19; no genera diagnósticos, pero debe corregirse como parte de TASK-004.

### Ejecución

- La API inicia y Scalar responde, pero `GET /forms` devuelve 500 si SQL Server no está disponible.
- Docker Engine 29.4.2 está disponible y existe el contenedor local `sqlserver22` con SQL Server 2022 Developer, binding `1433:1433` y volumen `sqlvolume`.
- Al momento de la inspección 2026-09-20, `sqlserver22` estaba detenido con exit code 255 y no había listener en `localhost:1433`.
- No se inició el contenedor ni se consultaron datos o metadata interna; el contenido y schema real de `form_structure` no están confirmados.
- No existe Compose para recrear el contenedor y el volumen existente no debe usarse en pruebas destructivas.
- La confianza del certificado HTTPS no fue confirmada, aunque existe un certificado válido.

### Contratos e integración

- ~~El frontend consume cinco endpoints que el backend no implementa.~~ (histórico; el renderer de respuestas aún no existe, ver trabajo pendiente).
- ~~`POST /forms` devuelve una forma distinta a la esperada por el frontend.~~ Resuelto 2026-10-12: request `{ name, description? }`, respuesta `201 { formId, versionId, number }` + `Location`.
- ~~El backend expone `numeroVersion`; el frontend espera `numero`.~~ Resuelto 2026-10-12 (breaking wire): el wire usa `number`; el frontend mapea a `numero` en la frontera Zod.
- ~~Los GET por ID devuelven `200` con `null` en vez de `404`.~~ Resuelto 2026-10-12: `404` con ProblemDetails `code: form_not_found`.
- `GetFormVersionById` documenta un DTO, pero devuelve una entidad EF. (Residual de TASK-006.)
- `SchemaJson` se almacena sin validación estructural. (Supersedido por la validación v1 de persistencia; ver `form-version-schema-persistence`.)

### Bugs funcionales conocidos

- `FormDetailPage` calcula el orden de versiones en render; actualmente copia antes de ordenar (`[...form.versiones].sort(...)`), sin mutación observable.
- Los bugs del editor legacy de tabs/CRUD (editar/borrar preguntas y secciones, `debugger` en `DeleteSection.tsx`, reordenamiento de `orden`, inputs numéricos) murieron con su código el 2026-10-11.

### Tests

- Suite Playwright: 29 tests en 4 archivos desde el 2026-10-10; `baseURL` y `webServer` activos y ejecución siempre headed (`headless: false`).
- Las suites focalizadas (form-list, builder, form-builder-v1, form-version-lifecycle) pasan: 28 passed + 1 smoke local omitido (requiere API activa).
- Los 3 suites legacy de tabs (`question-*`, `section-*`, `section-form-double-submit`) fueron eliminados el 2026-10-10: apuntaban a una UI eliminada y fallaban siempre.
- Suite backend: 83 tests (15 de integración SQL con bases temporales aisladas) pasando con `FORM_SCHEMA_TEST_SQL`.

### Seguridad de dependencias

Auditoría original (2026-09-19): 15 vulnerabilidades frontend, incluidas 9 altas.

**Re-auditoría y corrección 2026-10-11**: `pnpm audit` reportó 41 vulnerabilidades (2 críticas, 25 altas, 12 moderadas, 2 bajas) y tras la remediación quedó en **0**. Acciones: `react-router` → 7.18.4, `vite` → 6.4.4, `vitest` → 4.1.11 (mayor; cubre las críticas de `tinypool`) y fijación de transitivos vía `pnpm.overrides` (`brace-expansion`, `postcss`, `nanoid`, `browserslist`, `js-yaml`, `source-map-js`, `@babel/core`, `baseline-browser-mapping`). Verificación: build, lint 0/0 y 85/85 unit en vitest 4.1.11.
- Backend: `Microsoft.OpenApi` transitivo con vulnerabilidad alta (GHSA-v5pm-xwqc-g5wc) — **resuelto el 2026-10-10** fijando `Microsoft.OpenApi 2.7.5`; `dotnet list package --vulnerable` reporta 0 vulnerabilidades.
- Hay paquetes transitivos backend marcados como deprecated (NU1903 se resolvió junto con el pin; revisar deprecated en la próxima actualización de dependencias).

No se detectaron incompatibilidades explícitas de peer dependencies durante la restauración.

## Deuda técnica

- Inicialización de base de datos reproducible disponible (`compose.yml` + `scripts/init-local-db.ps1`); aún sin CI que la ejecute.
- No hay migraciones EF ni estrategia de evolución de base documentada (database-first con scripts SQL).
- No hay CI.
- Los tests frontend están desactualizados en parte (legacy de tabs).
- No hay manejo global de excepciones ni formato uniforme de errores.
- No hay health checks.
- No hay autenticación ni autorización.
- La credencial SQL de desarrollo sigue versionada en `appsettings.Development.json`; `.env` y `.gitignore` ya protegen los secretos locales nuevos.
- La configuración de frontend está hardcodeada (`https://localhost:7284`) y no externalizada por ambiente.
- React Query está configurado, pero las consultas reales usan `fetch` y `useEffect` manuales.
- Conviven mock, Zustand, estado local y datos remotos como fuentes de verdad.
- El cluster legacy sin uso (editor de tabs, stores, prototipos, mock) fue eliminado el 2026-10-11; quedan por revisar primitives y paquetes posiblemente sin uso (Fase 6, "Primitives y paquetes").
- Hay bloques grandes de código comentado y logs de depuración.
- La documentación transversal fue actualizada; varias decisiones técnicas siguen pendientes de OpenSpec.
- `components.json` apunta a una hoja CSS que no existe en esa ruta.

## Últimos cambios importantes

### Limpieza de código muerto el 2026-10-11

Ejecución de la Fase 6 del plan de lifecycle (`remove-legacy-form-editor`), sin cambio OpenSpec formal por ser solo supresión verificada sin cambio de comportamiento. Se eliminó sin consumidores ni imports desde el router: el cluster del editor legacy (`Question/`, `Section/`, `Table.tsx`, `TableRowActions.tsx`, `FormDialog.tsx`, prototipos `FormCreator*`, `components/forms/*`, `components/dnd/*`), los stores sin uso (`formStructure`, `formMetadata`, `user`), el re-export `pages/FormPage.tsx`, el barrel `types/index.ts`, `types/fields.ts`, `types/seccion.ts` y `VersionWithEstructura`, el mock legacy y `json sructure borrador.json`, `FormManagementApi.http` (solo contenía `/weatherforecast`) y el `Folder` fantasma `EditForm` del csproj. Desvíos del plan (que recomendaba preservar `user.ts` y el mock histórico): se eliminaron por petición de limpieza explícita.

### Cambio de entorno reproducible el 2026-10-10

- TASK-004 y TASK-005 cerradas vía el change archivado `reproducible-local-environment`.
- Toolchain fijado (Node, pnpm, SDK .NET), lockfile único pnpm y bootstrap SQL reproducible con Compose + script.
- Bug de `QUOTED_IDENTIFIER` en sqlcmd detectado en la verificación y corregido en el script y el README de migraciones.
- AGENTS.md, README.md, PROJECT_STATUS.md y BACKLOG.md alineados.

### Cambio de higiene el 2026-10-10

- Archivados los 4 changes completados pendientes; 0 activos, 7 archivados, 7 specs principales (4 nuevos sincronizados hoy).
- Eliminados los warnings de backend (ASPDEPR002 y vulnerabilidad Microsoft.OpenApi) y del frontend lint (0/0).
- Playwright configurado en modo headed permanente.
- Documentación (`PROJECT_STATUS.md`, `BACKLOG.md`) actualizada al estado real.

### Historial confirmado

Antes del trabajo documentado el 2026-09-20, el repositorio contenía cuatro commits:

```text
a401497 2026-04-24 openspec
423c331 2026-04-08 first commit
a5cb192 2026-04-08 first commit
2751dee 2026-04-08 first commit
```

El commit `a401497` añadió contexto del proyecto, configuración OpenSpec, un borrador JSON y limpió parte de los artefactos de Visual Studio. No añadió funcionalidad de aplicación. El trabajo del 2026-09-20 incorpora la migración de estados, los quality gates recuperados, sus artefactos OpenSpec y la documentación operativa.

Solo existe la rama `main`; no hay otras ramas, tags o stashes.

### Trabajo reciente del frontend

El foco funcional más reciente parece ser el rediseño del detalle y versionado:

- Reescritura parcial de `FormDetailPage.tsx`.
- Rediseño de tarjetas en `FormListPage.tsx`.
- Nuevos `VersionCard.tsx` y `StatusBadge.tsx` para presentar los estados canónicos.
- Migración de estados a `Draft`, `Published` y `Archived`; el contrato de estados quedó formalizado y el filtro obsoleto del modal fue corregido.
- Ajuste parcial del DTO de `GetFormById`.
- Reorganización del router.
- Inicio de un store de usuario sin consumidores.
- Migración incompleta de npm a pnpm.

El ajuste del contrato de estados cuenta con una spec OpenSpec archivada. Los demás cambios de esta lista no cuentan necesariamente con un artefacto OpenSpec específico y deben evaluarse por separado.

### Cambio completado el 2026-09-20

- `TASK-001` pasó a `Completada`.
- `VersionModal` ahora filtra fuentes mediante el estado canónico `Published`.
- Se verificaron los mappings de Draft, Published y Archived en los componentes relacionados.
- `pnpm build` volvió a finalizar correctamente sin `TS2367`.
- La revisión posterior no encontró defectos bloqueantes; permanece como mejora futura añadir cobertura automatizada del filtro.
- La capability `version-status-contract` fue sincronizada como spec principal y el change quedó archivado.

### Preparación del backlog 2026-09-20

- Se revisaron las ocho tareas pendientes contra el código actual, Git/OpenSpec, `AGENTS.md` y los estándares Agent OS.
- El backlog contiene 9 tareas: 1 `Completada`, 7 `Pendiente`, 0 `En análisis`, 0 `Especificada`, 0 `En desarrollo`, 1 `En revisión` y 0 `Descompuesta`.
- Ninguna tarea pendiente tiene todavía una spec suficiente para cambiar a `Especificada`.
- TASK-003 fue acotada al contrato HTTP básico; el ciclo de vida de versiones queda separado.
- TASK-005 ahora reconoce `sqlserver22` como referencia del entorno local y prohíbe usar destructivamente `sqlvolume` sin aprobación.
- TASK-004, TASK-005, TASK-006, TASK-007, TASK-008 y TASK-009 quedaron identificadas como candidatas a descomposición.
- TASK-006, TASK-007, TASK-008 y TASK-009 están bloqueadas para implementación por contratos, infraestructura o reglas de negocio aún no aprobadas; sí pueden continuar por análisis y especificación cuando corresponda.
- Se documentaron decisiones humanas, dependencias y criterios verificables sin implementar código ni crear cambios OpenSpec.

### Implementación de TASK-002 el 2026-09-20

- Se creó y validó el change activo `restore-reliable-frontend-lint`.
- ESLint ignora únicamente `dist/**` y conserva `src`, `tests` y configuración dentro del alcance.
- Se corrigieron `prefer-const`, `no-debugger`, `no-explicit-any` y la variable sin uso sin reducir severidades.
- El lint completo y enfocado finalizan con 0 errores y 8 warnings visibles.
- `pnpm build` continúa verde; permanece el warning no bloqueante por tamaño del chunk principal.
- TASK-002 está `En revisión`; todavía no se sincronizó ni archivó su change.

## Próxima tarea recomendada

Con el entorno reproducible cerrado (TASK-004 + TASK-005), el siguiente paso es eliminar/migrar los suites Playwright legacy de tabs (cierre de TASK-007) y luego afrontar `render-form-schema-v1` (renderer dinámico read-only de formularios v1), la última pieza funcional grande del ciclo definir→editar→versionar→publicar→ver.

Secuencia sugerida:

1. Migrar/eliminar los suites Playwright legacy de tabs (TASK-007).
2. `render-form-schema-v1`: visor dinámico read-only.
3. Re-auditar y actualizar dependencias frontend.
4. TASK-003: formalizar en OpenSpec el contrato HTTP básico de formularios.

## Archivos importantes para entender el proyecto

### Contexto y reglas

- `RPM-context-project.md`: PRD y contexto más completo.
- `openspec/config.yaml`: reglas y schema objetivo documentado.
- `AGENTS.md`: comandos, estructura y convenciones del repositorio.
- `agent-os/standards/index.yml`: índice de estándares confirmados.
- `web/docs/specs/2026-02-form-detail-module.md`: spec manual del detalle/versionado.
- `web/docs/specs/plan-migracion-features.md`: plan de organización frontend.

### Backend

- `api/FormManagementApi/Program.cs`: composición del host, CORS, EF, OpenAPI y Carter.
- `api/FormManagementApi/FormManagementApi.csproj`: runtime y dependencias.
- `api/FormManagementApi/Data/AppDbContext.cs`: mapeo de entidades.
- `api/FormManagementApi/Entities/Form.cs`: entidad de formulario.
- `api/FormManagementApi/Entities/FormVersion.cs`: entidad de versión.
- `api/FormManagementApi/Features/Forms/GetForms/GetForms.cs`: listado.
- `api/FormManagementApi/Features/Forms/GetFormById/GetFormById.cs`: detalle y versiones.
- `api/FormManagementApi/Features/Forms/CreateForm/CreateForm.cs`: creación inicial.
- `api/FormManagementApi/Features/Forms/CreateFormVersion/CreateFormVersion.cs`: derivación de nuevas versiones Draft.
- `api/FormManagementApi/NewFile1.sql`: esquema SQL manual.
- `api/FormManagementApi/appsettings.Development.json`: conexión de desarrollo; contiene una credencial y debe tratarse con cuidado.

### Frontend

- `web/src/router.tsx`: mapa de rutas.
- `web/src/services/form.ts`: contratos HTTP esperados por el frontend.
- `web/src/types/form.ts`: tipos de formulario y versión.
- `web/src/features/forms/pages/FormListPage.tsx`: listado.
- `web/src/features/forms/pages/CreateFormPage.tsx`: creación.
- `web/src/features/forms/pages/FormDetailPage.tsx`: detalle y foco del trabajo reciente.
- `web/src/features/forms/pages/FormBuilderPage.tsx`: builder/visor de versiones.
- `web/src/features/forms/components/VersionModal.tsx`: selección de una versión Published como fuente para crear versiones.
- `web/src/features/forms/components/VersionCard.tsx`: presentación de versiones.
- `web/src/features/forms/components/StatusBadge.tsx`: estados visuales.
- `web/src/features/forms/hooks/useForms.ts`: carga del listado con React Query.
- `web/playwright.config.ts`: configuración E2E (headed, baseURL `http://localhost:5173`).
- `web/tests/`: suites focalizadas del flujo actual (listado, builder, ciclo de vida).

## Dudas no resueltas

Estas decisiones no están confirmadas por Git, OpenSpec ni una implementación consistente:

- Si los contratos públicos distintos del estado de versión deben usar nombres en español o inglés. Los estados de versión ya usan `Draft`, `Published` y `Archived`.
- Si las respuestas API deben ser directas o envolver datos en `{ data }`.
- Si la ruta canónica de edición será `/edit` o `/builder`.
- Si una versión nueva clona siempre la última o una versión seleccionada.
- Si la futura API de clonado debe aplicar la misma regla Published-only que actualmente utiliza el modal.
- Si publicar continúa dentro del alcance inmediato.
- Si las dependencias entre campos deben referenciar `id` o `variable`.
- Si las validaciones pertenecen al schema o a un documento separado.
- Si `group` y `composed` forman parte del contrato final.
- Si pnpm reemplazará oficialmente a npm.
- Si SQL Server debe ejecutarse localmente o mediante un contenedor todavía no versionado.
