# Project Status

> Estado reconstruido el 2026-09-19 y actualizado el 2026-09-20. Este documento distingue entre hechos confirmados, inferencias y decisiones pendientes. El repositorio contiene cambios locales sin commit, por lo que el estado descrito no coincide completamente con `HEAD`.

## Descripción del proyecto

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

Estas son versiones de la máquina inspeccionada, no versiones fijadas formalmente por el repositorio.

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
    Question/
    Section/
  hooks/
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

- Node.js 20 o superior. Este mínimo se infiere de las dependencias resueltas; no hay un campo `engines`.
- pnpm compatible con el lockfile actual.
- .NET SDK 10.
- SQL Server accesible por TCP.
- Certificado HTTPS de desarrollo de .NET.
- Chromium de Playwright para ejecutar las pruebas E2E.

### Base de datos

La configuración de desarrollo espera:

```text
Server=localhost,1433
Database=form_structure
```

La base y las tablas deben prepararse manualmente:

1. Crear la base `form_structure`.
2. Seleccionarla explícitamente.
3. Ejecutar `api/FormManagementApi/NewFile1.sql`.

El script tiene `CREATE DATABASE` comentado y no contiene `USE form_structure`. No debe ejecutarse sin seleccionar antes la base correcta.

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

No existen:

- `global.json` para fijar el SDK .NET.
- `.nvmrc` o `.node-version`.
- Campo `engines` en `package.json`.
- Campo `packageManager` en `package.json`.
- Lock de NuGet.
- `Dockerfile` o Docker Compose.

El árbol local muestra una migración no consolidada de npm a pnpm: `package-lock.json` está eliminado y `pnpm-lock.yaml` todavía no está rastreado.

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

1. Revisar y cerrar TASK-002, cuyo lint ya está implementado y verificado.
2. Consolidar pnpm y las versiones de Node, pnpm y .NET para validar desde un checkout limpio.
3. Formalizar en OpenSpec el contrato HTTP básico de formularios.
4. Hacer reproducible SQL Server mediante Docker sin alterar el volumen local existente.
5. Alinear creación, listado y detalle con el contrato aprobado.
6. Recuperar tres pruebas Playwright representativas sobre las rutas actuales.
7. Especificar e implementar creación/clonado de versiones con concurrencia controlada.
8. Separar modo builder y modo read-only con validación del estado remoto.

El backlog fue analizado contra código, Git, OpenSpec, AGENTS y Agent OS el 2026-09-20. TASK-004 a TASK-009 requieren descomposición antes de implementar; permanecen `Pendiente` porque aún no tienen specs o tareas hijas aprobadas.

Trabajo posterior que todavía no tiene una tarea suficientemente acotada:

- Implementar lectura y guardado de estructura.
- Implementar publicación si continúa dentro del alcance.
- Retirar el mock global del flujo normal.
- Persistir todas las operaciones CRUD del builder.
- Elegir y validar un único schema JSON.
- Ampliar pruebas backend, de contratos y E2E más allá de la suite mínima.

TODO explícitos en código:

- Generar GUID desde código: `CreateForm.cs`.
- Guardar usuario en base de datos: `CreateForm.cs`.
- Limpiar propiedades específicas al cambiar el tipo de pregunta: `CreateQuestion.tsx`.

## Estado de OpenSpec

Estado verificado con la CLI:

```text
Workflow: spec-driven
Cambios activos: 0
Cambios archivados: 1
Specs principales: 1
Último change: fix-version-status-contract (4/4 tareas, archivado)
```

La spec principal vigente es `openspec/specs/version-status-contract/spec.md`. Define los estados canónicos, el filtro Published-only del modal, la separación entre valores contractuales y etiquetas localizadas, y el build frontend sin errores de comparación de estados.

El change completado se conserva en `openspec/changes/archive/2026-09-20-fix-version-status-contract/`. `openspec list --json` no devuelve cambios activos:

```json
{"changes":[]}
```

Los documentos de `web/docs/specs/` son especificaciones manuales y no artefactos reconocidos por OpenSpec. `2026-02-form-detail-module.md` está marcado `Approved`, pero su implementación es parcial y esa aprobación no pertenece al workflow formal de OpenSpec.

## Problemas conocidos

### Compilación y calidad

- `pnpm build` está verde desde el 2026-09-20; la comparación obsoleta `"publicada"` fue reemplazada por `Published`.
- Vite advierte que el chunk principal minificado supera 500 kB; no bloquea el build.
- `pnpm lint` finaliza con 0 errores y mantiene visibles 8 warnings de hooks y React Refresh.
- `dist/` está excluido del lint; ya no se analizan bundles generados.
- ESLint declara React 18, mientras el proyecto usa React 19.

### Ejecución

- La API inicia y Scalar responde, pero `GET /forms` devuelve 500 si SQL Server no está disponible.
- Docker Engine 29.4.2 está disponible y existe el contenedor local `sqlserver22` con SQL Server 2022 Developer, binding `1433:1433` y volumen `sqlvolume`.
- Al momento de la inspección 2026-09-20, `sqlserver22` estaba detenido con exit code 255 y no había listener en `localhost:1433`.
- No se inició el contenedor ni se consultaron datos o metadata interna; el contenido y schema real de `form_structure` no están confirmados.
- No existe Compose para recrear el contenedor y el volumen existente no debe usarse en pruebas destructivas.
- La confianza del certificado HTTPS no fue confirmada, aunque existe un certificado válido.

### Contratos e integración

- El frontend consume cinco endpoints que el backend no implementa.
- `POST /forms` devuelve una forma distinta a la esperada por el frontend.
- El backend expone `numeroVersion`; el frontend espera `numero`.
- Los GET por ID devuelven `200` con `null` en vez de `404`.
- `GetFormVersionById` documenta un DTO, pero devuelve una entidad EF.
- `SchemaJson` se almacena sin validación estructural.

### Bugs funcionales conocidos

- Editar una pregunta sin cambiarla de sección puede eliminarla.
- Se puede borrar una sección con preguntas aunque la UI indique lo contrario.
- Existe un `debugger` activo en `DeleteSection.tsx`.
- El reordenamiento no actualiza consistentemente las propiedades `orden`.
- Inputs numéricos pueden guardar strings en propiedades tipadas como números.
- `FormDetailPage` muta el array de versiones mediante `.sort()` durante render.
- `useFormMetadataStore` y `useUserStore` no tienen integración efectiva.

### Tests

- Los 15 tests Playwright corresponden a una navegación anterior.
- Resultado verificado: 5 fallos y 10 tests no ejecutados.
- `webServer` y `baseURL` están comentados en Playwright.
- Solo Chromium está habilitado.
- No existen tests backend.

### Seguridad de dependencias

Resultado de las auditorías al 2026-09-19:

- Frontend: 15 vulnerabilidades, incluyendo 9 altas.
- Backend: `Microsoft.OpenApi` transitivo con vulnerabilidad alta.
- Hay paquetes transitivos backend marcados como deprecated.

No se detectaron incompatibilidades explícitas de peer dependencies durante la restauración.

## Deuda técnica

- No hay inicialización reproducible de infraestructura.
- No hay migraciones EF ni estrategia de evolución de base documentada.
- No hay CI.
- No hay tests backend.
- Los tests frontend están desactualizados.
- No hay manejo global de excepciones ni formato uniforme de errores.
- No hay health checks.
- No hay autenticación ni autorización.
- La credencial SQL está versionada en texto plano.
- La configuración local está hardcodeada y no externalizada por ambiente.
- React Query está configurado, pero las consultas reales usan `fetch` y `useEffect` manuales.
- Conviven mock, Zustand, estado local y datos remotos como fuentes de verdad.
- Existen stores, componentes y prototipos sin uso.
- Hay bloques grandes de código comentado y logs de depuración.
- La documentación transversal fue actualizada; varias decisiones técnicas siguen pendientes de OpenSpec.
- La migración npm a pnpm no está consolidada.
- No están fijadas las versiones de Node, pnpm o .NET SDK.
- `components.json` apunta a una hoja CSS que no existe en esa ruta.
- El archivo HTTP del backend conserva el endpoint de plantilla `/weatherforecast`.

## Últimos cambios importantes

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

Revisar `TASK-002 - Dejar el lint como señal confiable` y, si no hay hallazgos bloqueantes, sincronizar y archivar su change.

Secuencia recomendada:

1. Revisar el diff contra `frontend-lint-quality-gate`.
2. Confirmar que los 8 warnings diferidos permanecen visibles y fuera del alcance aprobado.
3. Sincronizar la spec principal y archivar el change si la revisión pasa.
4. Continuar con TASK-004 para consolidar pnpm y runtimes.

Esta prioridad mantiene verdes los quality gates básicos antes de abordar el flujo de versiones, que todavía requiere contrato HTTP, endpoints backend, integración y pruebas.

Después del cierre de TASK-002, el orden recomendado es TASK-004 → TASK-003 → TASK-005 → TASK-006 → TASK-007 → TASK-008 → TASK-009.

## Archivos importantes para entender el proyecto

### Contexto y reglas

- `RPM-context-project.md`: PRD y contexto más completo.
- `openspec/config.yaml`: reglas y schema objetivo documentado.
- `AGENTS.md`: comandos, estructura y convenciones del repositorio.
- `agent-os/standards/index.yml`: índice de estándares confirmados.
- `web/docs/specs/2026-02-form-detail-module.md`: spec manual del detalle/versionado.
- `web/docs/specs/plan-migracion-features.md`: plan de organización frontend.
- `json sructure borrador.json`: borrador alternativo de schema; no debe asumirse como contrato definitivo.

### Backend

- `api/FormManagementApi/Program.cs`: composición del host, CORS, EF, OpenAPI y Carter.
- `api/FormManagementApi/FormManagementApi.csproj`: runtime y dependencias.
- `api/FormManagementApi/Data/AppDbContext.cs`: mapeo de entidades.
- `api/FormManagementApi/Entities/Form.cs`: entidad de formulario.
- `api/FormManagementApi/Entities/FormVersion.cs`: entidad de versión.
- `api/FormManagementApi/Features/Forms/GetForms/GetForms.cs`: listado.
- `api/FormManagementApi/Features/Forms/GetFormById/GetFormById.cs`: detalle y versiones.
- `api/FormManagementApi/Features/Forms/CreateForm/CreateForm.cs`: creación inicial.
- `api/FormManagementApi/Features/Forms/CreateFormVersion/CreateFormVersion.cs`: stub de versionado.
- `api/FormManagementApi/NewFile1.sql`: esquema SQL manual.
- `api/FormManagementApi/appsettings.Development.json`: conexión de desarrollo; contiene una credencial y debe tratarse con cuidado.

### Frontend

- `web/src/router.tsx`: mapa de rutas.
- `web/src/services/form.ts`: contratos HTTP esperados por el frontend.
- `web/src/types/form.ts`: tipos de formulario y versión.
- `web/src/types/fields.ts`: modelo actual de campos.
- `web/src/types/seccion.ts`: modelo actual de secciones.
- `web/src/features/forms/pages/FormListPage.tsx`: listado.
- `web/src/features/forms/pages/CreateFormPage.tsx`: creación.
- `web/src/features/forms/pages/FormDetailPage.tsx`: detalle y foco del trabajo reciente.
- `web/src/features/forms/pages/FormPage.tsx`: builder.
- `web/src/features/forms/components/VersionModal.tsx`: selección de una versión Published como fuente para crear versiones.
- `web/src/features/forms/components/VersionCard.tsx`: presentación de versiones.
- `web/src/features/forms/components/StatusBadge.tsx`: estados visuales.
- `web/src/store/formStructure.ts`: estructura activa del builder.
- `web/src/features/forms/hooks/useForms.ts`: carga mock actual.
- `web/src/mocks/formStructure.json`: estructura simulada.
- `web/playwright.config.ts`: configuración E2E incompleta.
- `web/tests/`: pruebas de una navegación anterior.

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
