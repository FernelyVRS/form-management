# Backlog Operativo

Backlog derivado de las tareas priorizadas en la Fase 6. `TASK-001` y `TASK-002` están completadas; `TASK-008` fue superada por el change completado `manage-form-version-lifecycle` (ciclo de vida de versiones completo, archivado 2026-10-10). Las tareas restantes conservan su estado individual.

## Iniciativa prioritaria: schema inglés v1

1. **adopt-versioned-english-form-schema**: contrato compartido, JSON Schema, ejemplos, Zod/.NET, tests de paridad y documentación. Este paso no integra el runtime. Fuente normativa: `contracts/form-schema/v1/README.md`.
2. **persist-form-version-schema — completado localmente**: migración transaccional aplicada a los 3 placeholders auditados tras backup verificado, RowVersion, constraint v1 y endpoints GET/PUT Draft-only. Respuestas estructuradas inglesas, errores y concurrencia comprobados con SQL real. 68 tests backend correctos; resultados en `openspec/changes/persist-form-version-schema/implementation-results.md`.
3. **migrate-form-builder-to-schema-v1 — completado**: Query y borrador aislado por ruta, Section/Field/Group y DnD lazy, orden normalizado, protección core/variable, Guardar explícito y recuperación de errores/conflictos. El mock legacy fue eliminado en la limpieza de 2026-10-11 (ya sin imports de runtime desde la migración a v1). /view inspecciona estructura read-only. Resultados en `openspec/changes/migrate-form-builder-to-schema-v1/implementation-results.md`.
4. **render-form-schema-v1**: vista dinámica read-only, descripciones inline/tooltip accesible, selects dependientes y constraints simples sin respuestas obligatorias. Mantener UI localizada y keys técnicas inglesas.
5. **manage-form-version-lifecycle — completado**: endpoints y slicing de crear versión desde versión, clonar formulario, publicar (atómico) y archivar Draft, con invariantes de ≤1 Draft/Publicado, numeración estable y ProblemDetails con códigos. UI de detalle con resumen real, acciones por estado, confirmaciones y clonado. Migración 002 aplicada a `form_structure` tras backup verificado; bug de orden de batch del publish detectado en la verificación en vivo y corregido con test de regresión. 83 tests backend, 85 unitarios y 22 Playwright nuevos correctos. Resultados en `openspec/changes/manage-form-version-lifecycle/implementation-results.md`.

Estas decisiones superseden las preguntas históricas de schema más abajo. El listado/metadata y sus pruebas mantienen su alcance independiente. Clonado/publicación completos, listas de entidades y reglas complejas tendrán sus propios cambios posteriores.

### TASK-001 - Recuperar un build frontend verde

Estado: Completada

Prioridad: Alta

Origen: Fase 6

Descripción:
Corregir la migración incompleta de estados de versión que impedía compilar el frontend. Antes de la implementación, `VersionModal` comparaba contra el literal antiguo `publicada`, mientras el contrato TypeScript ya utilizaba `Draft`, `Published` y `Archived`.

Motivo:
Es un cambio localizado y de bajo riesgo que recupera el quality gate más básico, permite revisar el modelo de versiones y deja una base compilable antes de modificar funcionalidades mayores.

Módulos involucrados:
- `web/src/types/form.ts`
- `web/src/features/forms/components/VersionModal.tsx`
- `web/src/features/forms/components/StatusBadge.tsx`
- `web/src/features/forms/components/VersionCard.tsx`

Dependencias:
- Ninguna bloqueante. El código frontend, la creación backend y el constraint SQL confirman `Draft`, `Published` y `Archived` como estados canónicos actuales.

Riesgos:
- El modal puede volver a compilar y aun conservar reglas funcionales incorrectas.
- Una corrección parcial podría dejar otros literales antiguos en el frontend.

Criterios generales:
- `pnpm build` finaliza correctamente.
- El modal reconoce versiones `Published`.
- Los tres estados se presentan correctamente en los componentes relacionados.

OpenSpec: `openspec/changes/archive/2026-09-20-fix-version-status-contract/`

Notas:
- Tamaño estimado: pequeño.
- El tipo TypeScript actual, la creación backend y el constraint SQL respaldan los estados canónicos en inglés.
- Análisis 2026-09-19: lista para pasar a especificación. `VersionEstado`, `CreateForm`, el constraint SQL, `FormDetailPage`, `VersionCard` y `StatusBadge` confirman `Draft | Published | Archived`; la única referencia contractual antigua en `src` es el filtro `publicada` de `VersionModal`, que produce `TS2367`.
- No hay dudas bloqueantes. Los textos visibles en español no cambian el contrato, y la discrepancia sobre qué versión debe clonarse queda fuera de TASK-001 para resolverse en la gestión de versiones.
- La especificación OpenSpec fue validada antes de la implementación; los cuatro artefactos requeridos están completos.
- Implementación 2026-09-20: `VersionModal` filtra con el estado canónico `Published`; se verificaron los mappings relacionados y `pnpm build` finaliza correctamente.
- Documentación 2026-09-20: la spec `version-status-contract` fue sincronizada y el change quedó archivado.

### TASK-002 - Dejar el lint como señal confiable

Estado: Completada

Prioridad: Alta

Origen: Fase 6

Descripción:
Evitar que ESLint analice artefactos generados en `dist/`, corregir los cuatro errores confirmados en código fuente y registrar la decisión sobre los warnings existentes, sin relajar reglas generales para ocultar problemas.

Motivo:
`pnpm lint` ejecuta `eslint .` y la configuración no ignora `dist/`; el conteo generado varía con el contenido del build y oculta la señal útil. Un lint confiable permite detectar regresiones antes de abordar cambios funcionales.

Módulos involucrados:
- `web/eslint.config.js`
- `web/src/features/forms/components/Section/CreateSection.tsx`
- `web/src/features/forms/components/Section/DeleteSection.tsx`
- `web/src/features/forms/components/Section/EditSection.tsx`
- `web/src/features/forms/pages/FormPage.tsx`
- `web/src/features/forms/pages/FormDetailPage.tsx`
- `web/src/components/forms/SelectDependedTypeFields.tsx`
- `web/src/components/ui/badge.tsx`
- `web/src/components/ui/button.tsx`
- `web/src/components/ui/form.tsx`
- `web/package.json`

Dependencias:
- No tiene dependencias funcionales.
- Requiere un cambio OpenSpec propio antes de implementación, conforme al workflow del repositorio.
- TASK-004 no bloquea la corrección local, pero sí la validación reproducible desde un checkout limpio.

Riesgos:
- Excluir rutas demasiado amplias podría ocultar código fuente real.
- Cambiar reglas globales podría silenciar problemas en lugar de resolverlos.
- Corregir warnings de hooks puede alterar comportamiento y ampliar el alcance más allá de los cuatro errores directos.
- La configuración declara React 18 mientras la aplicación usa React 19; debe decidirse si se corrige en esta tarea.

Criterios generales:
- `pnpm lint` finaliza correctamente y no reporta archivos bajo `dist/`.
- `pnpm exec eslint src tests` no reporta errores.
- La disposición de los warnings actuales queda documentada; los no resueltos permanecen visibles.
- No se deshabilitan ni reducen globalmente reglas para ocultar los errores confirmados.
- `pnpm build` continúa funcionando.

OpenSpec: `openspec/changes/archive/2026-10-10-restore-reliable-frontend-lint/`

Notas:
- Tamaño estimado: pequeño.
- Confirmado por código y ejecución 2026-09-20: `src` y `tests` producen 4 errores y 8 warnings; los errores son `prefer-const`, `no-debugger`, `no-explicit-any` y una variable sin uso.
- Confirmado por ejecución 2026-09-20: el lint completo reporta 1983 problemas, principalmente en `dist/`; el total no es un criterio estable porque depende del build generado.
- Confirmado por código: los warnings están en los cinco módulos adicionales listados; revisarlos no implica necesariamente modificarlos.
- Decisión humana pendiente: incluir o separar la corrección de la versión React declarada en ESLint y decidir si los warnings de hooks se corrigen o solo se documentan.
- No requiere descomposición como tarea de backlog; la futura lista OpenSpec debe separar configuración, errores, evaluación de warnings y verificación.
- Implementación 2026-09-20: `dist/**` queda fuera de ESLint y se corrigieron los cuatro errores sin cambiar severidades ni suprimir reglas.
- Verificación 2026-09-20: `pnpm exec eslint src tests` y `pnpm lint` finalizan con 0 errores y 8 warnings visibles; `pnpm build` finaliza correctamente.
- Lista para revisión; el change permanece activo y no debe archivarse hasta completar revisión y cierre.
- Cierre 2026-10-10: la revisión pasó sin hallazgos bloqueantes; el change fue archivado y su spec `frontend-lint-quality-gate` sincronizada como spec principal. Los 5 warnings diferidos (hooks y React Refresh) fueron corregidos el mismo día: effects de `SelectDependedTypeFields.tsx` con guard por refs y `allowExportNames`/`allowConstantExport` para los exports canónicos de shadcn (`useFormField`, `badgeVariants`, `buttonVariants`). `pnpm lint` quedó en 0 errores y 0 warnings.

### TASK-003 - Especificar el contrato HTTP básico de formularios

Estado: Completada

Prioridad: Alta

Origen: Fase 6

Descripción:
Crear un cambio OpenSpec aplicable para los endpoints básicos ya existentes: `GET /forms`, `POST /forms` y `GET /forms/{formId}`. Definir formato de respuesta, nombres públicos, nullability, códigos HTTP, `Location` y estrategia de verificación, reutilizando la spec vigente de estados de versión.

Motivo:
OpenSpec contiene una spec vigente para estados, pero no define el contrato HTTP básico. El frontend y backend discrepan en envelopes, nombres, nullability y respuestas de recurso inexistente; formalizar esas decisiones antes de TASK-006 evita una migración parcial.

Módulos involucrados:
- `openspec/config.yaml`
- `openspec/changes/<change>/`
- `openspec/specs/version-status-contract/spec.md`
- `web/docs/specs/2026-02-form-detail-module.md`
- `web/src/services/form.ts`
- `web/src/types/form.ts`
- `api/FormManagementApi/Features/Forms/CreateForm/CreateForm.cs`
- `api/FormManagementApi/Features/Forms/GetForms/GetForms.cs`
- `api/FormManagementApi/Features/Forms/GetFormById/GetFormById.cs`
- `docs/PROJECT_STATUS.md`
- `RPM-context-project.md`

Dependencias:
- Mantener fuera de alcance clonado, publicación, regla de un único Draft, persistencia de estructura, rutas de edición, renderer y autenticación.
- Decidir `numero` frente a `numeroVersion`.
- Decidir respuesta directa frente a `{ data }`.
- Decidir nullability de `descripcion`, `updatedAt` y campos de derivación que entren en alcance.
- Decidir si `GET /forms/{formId}/versions/{versionId}` forma parte del contrato básico o de una tarea posterior.
- Definir qué comportamiento de error se especifica además de los códigos HTTP.

Riesgos:
- Definir un cambio demasiado amplio que mezcle versionado, renderer, schema y autenticación.
- Formalizar como requisito una decisión que todavía no haya sido aprobada.
- Contradecir la spec vigente `version-status-contract` o la forma realmente expuesta por los endpoints.
- Documentar comportamiento accidental como contrato sin revisar sus consumidores externos.

Criterios generales:
- El cambio contiene propuesta, requisitos, diseño y tareas verificables.
- Cada requisito contiene escenarios comprobables y separa tareas frontend, backend y verificación.
- El cambio referencia `version-status-contract` y no redefine `Draft`, `Published` ni `Archived`.
- El alcance excluye clonado, publicación, un único Draft, rutas builder/view, renderer, autenticación y rediseño del schema.
- `openspec status --change <nombre>` indica que todos los artefactos requeridos para apply están completos.
- `openspec validate --all` finaliza correctamente.

OpenSpec: `openspec/changes/archive/2026-10-15-specify-form-http-contract/` (implementado 2026-10-12, archivado 2026-10-15; spec principal `openspec/specs/form-http-contract/`)

Notas:
- Tamaño estimado: pequeño.
- Esta tarea documenta decisiones; no implementa funcionalidad.
- Cierre 2026-10-12: change `specify-form-http-contract` implementado y verificado (backend 94/94 con SQL real, frontend 96/96 unitarios, build/lint verdes, `openspec validate --all` 9/9). Matriz aprobada: respuesta directa, claves en inglés unificadas con el ciclo de vida (breaking wire) y ProblemDetails con `code`. El frontend mantiene el modelo interno en español y traduce en la frontera Zod.
- Confirmado por OpenSpec: existe una spec principal válida y un change archivado para `version-status-contract`; no hay cambios activos ni una spec del contrato HTTP básico.
- Confirmado por código: `POST /forms` devuelve un DTO directo, `GET /forms` ya es directo y el detalle usa `numeroVersion`, mientras algunos consumidores frontend esperan `{ data }` y `numero`.
- Decisión humana pendiente: aprobar la matriz contractual. No asumir como requisito la recomendación técnica de respuesta directa o nombres en español.
- Inferencia: una spec HTTP básica separada reduce el alcance frente a formalizar toda la gestión de versiones en un único change.
- No requiere descomposición adicional si conserva este alcance; la gestión del ciclo de vida de versiones deberá tener otro change.

### TASK-004 - Consolidar pnpm y los requisitos de runtime

Estado: Completada (change `reproducible-local-environment`, archivado 2026-10-10)

Prioridad: Media

Origen: Fase 6

Descripción:
Completar la decisión del gestor de paquetes y documentar o fijar las versiones necesarias de Node, pnpm y .NET, evitando actualizar masivamente las dependencias de aplicación.

Motivo:
El árbol local muestra una migración incompleta de npm a pnpm y el repositorio no fija las herramientas requeridas. Esto dificulta reproducir una instalación limpia en otra máquina.

Módulos involucrados:
- `web/package.json`
- `web/pnpm-lock.yaml`
- `web/package-lock.json`
- `api/FormManagementApi/FormManagementApi.csproj`
- `AGENTS.md`
- `README.md`
- `web/README.md`
- `docs/PROJECT_STATUS.md`
- `openspec/config.yaml`
- `RPM-context-project.md`
- Posible `global.json`
- Posible archivo de versión de Node

Dependencias:
- Confirmar si pnpm será el gestor oficial.
- Si pnpm no se aprueba, decidir cómo restaurar y mantener el lockfile de npm.
- Decidir si el lock de pnpm debe conservar resoluciones anteriores o aceptar las versiones más nuevas actualmente resueltas.
- Decidir política de versión para Node, pnpm y .NET 10, incluido el comportamiento `rollForward` si se usa `global.json`.
- Decidir el mecanismo de bootstrap de pnpm y la política explícita para scripts de instalación de `esbuild`.

Riesgos:
- Regenerar un lockfile podría introducir actualizaciones no deseadas.
- Fijar versiones incorrectas podría bloquear entornos actualmente funcionales.
- La política de scripts de pnpm puede impedir la instalación limpia de `esbuild`.
- El lock de pnpm actual resuelve varias dependencias más nuevas que el lock de npm eliminado; no es una conversión puramente de formato.
- Los comandos de AGENTS y los README usan gestores distintos.
- Validar sobre `node_modules` existente puede ocultar problemas de una instalación limpia.

Criterios generales:
- El gestor oficial está documentado y queda exactamente un lockfile frontend correspondiente rastreado.
- El gestor y los runtimes requeridos están documentados o fijados.
- Los comandos de `package.json`, AGENTS y README son consistentes con la decisión.
- Una instalación congelada funciona en un checkout desechable, no modifica el lockfile y usa el grafo revisado.
- `pnpm build`, `dotnet restore` y `dotnet build` utilizan las versiones documentadas.
- La decisión de scripts de `esbuild` queda documentada y no deja una advertencia inexplicada.
- El contexto OpenSpec y la documentación técnica reflejan el target efectivo .NET 10.

OpenSpec: `openspec/changes/archive/2026-10-10-reproducible-local-environment/`

Notas:
- Tamaño estimado: mediano.
- No incluye una actualización masiva de paquetes.
- Cierre 2026-10-10: pnpm 10.33.0 declarado oficial (`packageManager` + Corepack), Node fijado en 22.13.0 (`web/.node-version` + `engines`), SDK .NET 10.0.201 fijado (`api/global.json`, `rollForward: latestFeature`), `pnpm.onlyBuiltDependencies` con esbuild, raíz `.gitignore` con `.env`, `package-lock.json` eliminado y `pnpm-lock.yaml` como único lockfile (aceptando las resoluciones actuales). AGENTS.md y README.md usan pnpm y documentan el toolchain. Verificación: `pnpm install --frozen-lockfile`, build, lint 0/0 y 85 unitarios; dotnet build 0 errores y 83 tests. Pendiente de commit: el lockfile y los archivos de pinning.
- Confirmado por código: no existen `packageManager`, `engines`, archivo de versión Node ni `global.json`; el backend apunta a `net10.0` mientras OpenSpec aún menciona .NET 9.
- Confirmado por entorno: Node 22.13.0, pnpm 10.33.0 y .NET SDK 10.0.201 funcionan localmente, pero no están fijados por el repositorio.
- Decisiones humanas pendientes: gestor oficial, política de versiones, aceptación del drift del lockfile, Corepack, `rollForward` y scripts de `esbuild`.
- Candidata a descomposición en decisión/base, consolidación frontend, runtime .NET, documentación y validación en checkout limpio.

### TASK-005 - Hacer reproducible la base de datos local

Estado: Completada (change `reproducible-local-environment`, archivado 2026-10-10)

Prioridad: Media

Origen: Fase 6

Descripción:
Definir un procedimiento reproducible basado en Docker para levantar SQL Server 2022, crear la base `form_structure` y aplicar el esquema existente. El entorno local conocido utiliza el contenedor `sqlserver22`; conservar el enfoque database-first con script SQL salvo aprobación explícita de otra estrategia.

Motivo:
La API depende de SQL Server en `localhost:1433`. El contenedor `sqlserver22` existe fuera del repositorio, pero no hay Compose ni automatización de inicialización y actualmente está detenido; un checkout nuevo no puede reproducir el entorno ni validar endpoints integrados.

Módulos involucrados:
- `api/FormManagementApi/NewFile1.sql`
- `api/FormManagementApi/appsettings.Development.json`
- `api/FormManagementApi/Program.cs`
- `api/FormManagementApi/FormManagementApi.csproj`
- `api/FormManagementApi/Data/AppDbContext.cs`
- `api/FormManagementApi/Entities/Form.cs`
- `api/FormManagementApi/Entities/FormVersion.cs`
- `api/FormManagementApi/Features/Forms/CreateForm/CreateForm.cs`
- `api/FormManagementApi/Features/Forms/GetForms/GetForms.cs`
- `api/FormManagementApi/Features/Forms/GetFormById/GetFormById.cs`
- Posible `compose.yml`
- Posibles scripts de readiness, inicialización y verificación
- Posible archivo de ejemplo para variables locales sin secretos
- Reglas de ignore para credenciales locales
- `README.md`
- `docs/PROJECT_STATUS.md`

Dependencias:
- SQL Server local se ejecuta en Docker; confirmar si `sqlserver22` será un nombre contractual o solo una referencia del entorno actual.
- Confirmar una versión o digest de SQL Server 2022 en vez de depender sin revisión de `2022-latest`.
- Mantener database-first con scripts para este alcance, salvo aprobación explícita de migraciones EF.
- Definir cómo proporcionar credenciales locales sin versionarlas.
- Definir comportamiento al repetir la inicialización y política segura de volúmenes persistentes y desechables.
- Confirmar si la API local continuará usando `sa` o un login con permisos limitados.

Riesgos:
- Diferencias de plataforma e imagen de SQL Server.
- El contenedor existente no tiene definición Compose y no constituye un entorno reproducible.
- El volumen `sqlvolume` puede contener datos locales y no debe reutilizarse ni eliminarse en validaciones destructivas.
- El script actual no crea efectivamente la base, no selecciona `form_structure`, no es idempotente y puede dejar un esquema parcial.
- Aplicar el esquema antes de readiness real puede producir carreras de inicialización.
- Manejo inseguro de credenciales.
- Mezclar esta tarea con una migración completa de persistencia ampliaría demasiado el alcance.
- Las pruebas de creación modifican datos y necesitan una base o volumen explícitamente desechable.

Criterios generales:
- Un checkout nuevo puede levantar SQL Server mediante comandos versionados sin depender del contenedor creado manualmente.
- El flujo espera readiness real y no conserva credenciales utilizables en Git.
- Un volumen vacío y explícitamente desechable crea `form_structure`, `dbo.Forms` y `dbo.FormVersions`.
- La metadata confirma claves foráneas, índice único de número por formulario, defaults y constraint de estado.
- El comportamiento al repetir la inicialización queda definido y probado.
- `GET /forms` responde 200 sobre una base recién inicializada.
- `POST /forms` responde 201 y crea un formulario con una versión inicial `Draft`.
- `GET /forms/{id}` responde 200 para el formulario creado.
- La verificación no depende del contenido previo de `sqlvolume` y solo elimina volúmenes marcados como desechables.
- Detener y reiniciar el entorno normal conserva los datos del volumen persistente.

OpenSpec: `openspec/changes/archive/2026-10-10-reproducible-local-environment/`

Notas:
- Tamaño estimado: mediano.
- Cierre 2026-10-10: `compose.yml` con SQL Server 2022 fijado (`2022-CU27-ubuntu-22.04`), healthcheck, volumen propio por proyecto (distinto de `sqlvolume`) y puerto parametrizable; `.env.example` sin secretos; `scripts/init-local-db.ps1` espera readiness, crea `form_structure`, aplica NewFile1 → 001 → 002 con `sqlcmd -b` y verifica catalog/constraints; el script es repetible (baseline se omite si ya existe). Durante la verificación se encontró que la sesión sqlcmd corre con `QUOTED_IDENTIFIER OFF` y el re-ejecutar el 001 sobre una base ya migrada choca con los índices filtrados del 002 (Msg 1934); el script ahora fuerza `SET QUOTED_IDENTIFIER ON`. Rehearsal completo en puerto 14331 con proyecto aislado: bootstrap verificado, repetible y teardown limpio; `sqlserver22` intacto.
- Confirmado por entorno 2026-09-20: Docker Engine 29.4.2 está disponible; `sqlserver22` existe con SQL Server 2022 Developer, binding `1433:1433` y volumen `sqlvolume`, pero está detenido con exit code 255 y sin política de restart.
- Confirmado por entorno 2026-09-20: no hay proyecto Compose ni listener en `localhost:1433`; no se inició el contenedor ni se consultaron datos o metadata interna.
- Confirmado por OpenSpec/Agent OS: el proyecto declara SQL Server y database-first; los estándares definen acceso EF, no una estrategia de bootstrap o migraciones.
- Decisiones humanas pendientes: imagen, nombre contractual, credenciales, usuario de aplicación, reruns, lifecycle de volúmenes y eventual alcance CI.
- Candidata a descomposición en decisiones, credenciales, Compose, bootstrap SQL, verificación de metadata y documentación.
- No usar `sqlvolume` para pruebas destructivas ni cambiar esquema, datos o configuración sin aprobación explícita.

### TASK-006 - Alinear el contrato básico de formularios

Estado: Pendiente

Nota 2026-10-12: TASK-003 (`specify-form-http-contract`) quedó implementada y provee el target formal de la matriz contractual (respuesta directa, claves en inglés unificadas, ProblemDetails con `code`, UTC, `Location`). TASK-006 queda reducida a los residuos de alineación no cubiertos por ese cambio: `GetFormVersionById` (devuelve entidad EF sin DTO canónico), revisión de consumidores externos y nullability restante en rutas adyacentes.

Prioridad: Media

Origen: Fase 6

Descripción:
Alinear el contrato público de `GET /forms`, `POST /forms` y `GET /forms/{formId}` según la spec aprobada en TASK-003. Aplicar formato de respuesta, nombres, nullability, estados canónicos, códigos HTTP y `Location` de forma consistente en DTOs backend, tipos y servicios frontend, OpenAPI y verificaciones de contrato.

Motivo:
Los endpoints básicos existen, pero creación y detalle no funcionan de extremo a extremo: `POST /forms` devuelve un DTO directo mientras el frontend lee `json.data`; el detalle emite `numeroVersion` mientras el frontend espera `numero`; los GET por ID devuelven `200 null`; y `Location` apunta a una ruta inexistente. También hay discrepancias de nullability y UI hardcodeada.

Módulos involucrados:
- `web/src/services/form.ts`
- `web/src/types/form.ts`
- `web/src/features/forms/pages/CreateFormPage.tsx`
- `web/src/features/forms/pages/FormListPage.tsx`
- `web/src/features/forms/pages/FormDetailPage.tsx`
- `web/src/features/forms/pages/FormPage.tsx`
- `web/src/features/forms/components/VersionCard.tsx`
- `web/src/features/forms/components/VersionModal.tsx`
- `api/FormManagementApi/Features/Forms/CreateForm/CreateForm.cs`
- `api/FormManagementApi/Features/Forms/GetForms/GetForms.cs`
- `api/FormManagementApi/Features/Forms/GetFormById/GetFormById.cs`
- `api/FormManagementApi/Features/Forms/GetFormVersionById/GetFormVersionById.cs`
- Posible proyecto nuevo de tests de contrato backend

Dependencias:
- TASK-003: contrato HTTP básico aprobado y apply-ready.
- `openspec/specs/version-status-contract/spec.md` para los estados canónicos.
- TASK-005 para validación integrada reproducible contra `sqlserver22`; el diseño contractual no depende de levantar la base.
- Elegir respuesta directa o envelope `{ data }`.
- Elegir nombres públicos, nullability y si la consulta individual de versión entra en esta tarea.
- Definir estrategia de tests de contrato; actualmente no existe proyecto de tests backend.

Riesgos:
- Los cambios afectan listado, creación, detalle y futuros tests de contrato.
- Una migración parcial puede aumentar las incompatibilidades actuales.
- Cambiar nombres públicos puede afectar consumidores externos no visibles en este repositorio.
- El detalle hardcodea una versión actual y muta `versiones` con `.sort()`; corregir solo el DTO no garantiza una UI coherente.
- `GetFormVersionById` declara un DTO pero devuelve una entidad EF, usa una ruta singular y no tiene consumidor frontend equivalente.
- Los servicios adyacentes de clonado, publicación y estructura no existen en backend y pueden provocar scope creep.

Criterios generales:
- Los request/response DTOs, ejemplos OpenAPI y tipos TypeScript coinciden con la matriz aprobada.
- Ningún cliente in-scope intenta leer `{ data }` si la respuesta aprobada es directa, ni viceversa.
- Crear un formulario en el modo básico de la UI permite leer `formId` y navegar a una ruta registrada.
- El detalle muestra números y estados provenientes del servidor, sin depender de la tarjeta hardcodeada.
- Los recursos inexistentes in-scope responden 404, no `200 null`.
- El encabezado `Location` apunta a una ruta registrada y coherente con el recurso creado.
- Nullability de descripción y timestamps coincide entre C#, JSON y TypeScript.
- Existen verificaciones de contrato para éxito y recurso inexistente en los endpoints básicos.
- `pnpm build` y `dotnet build` finalizan correctamente.

OpenSpec: Pendiente

Notas:
- Tamaño estimado: mediano.
- Confirmado por código: `POST /forms` ya devuelve 201; `GET /forms` está mayormente alineado; los fallos confirmados están en envelope de creación, número de versión, 404, `Location`, nullability y detalle visual.
- Confirmado por código: `POST /forms/from-version`, creación/publicación de versiones y lectura/escritura de estructura son operaciones distintas y quedan fuera de este alcance.
- Confirmado por Git: el DTO backend y otros archivos adyacentes conservan cambios locales fuera de esta tarea, por lo que la línea base debe revisarse antes de aplicar.
- Decisiones humanas pendientes: matriz contractual, consulta individual de versión, formato de errores y estrategia de tests.
- Candidata a descomposición en contrato aprobado, creación backend, listado/detalle backend, tipos/servicios frontend, integración UI, consulta individual de versión si aplica y verificación.

### TASK-007 - Recuperar una suite E2E mínima

Estado: Pendiente

Prioridad: Media

Origen: Fase 6

Descripción:
Actualizar la infraestructura de Playwright y recuperar inicialmente tres pruebas representativas para las rutas actuales: carga del listado, creación básica de formulario y visualización del detalle con versiones. Definir explícitamente si serán E2E integradas con API/SQL reales o pruebas de UI con API interceptada.

Motivo:
Los 15 tests actuales navegan a `/` esperando el builder, pero esa ruta muestra `FormListPage`; además duplican la URL local, comparten datos y no tienen `baseURL` ni `webServer` activos. Una suite mínima permitirá validar tareas posteriores sin reparar de una vez todos los casos legacy.

Módulos involucrados:
- `web/playwright.config.ts`
- `web/package.json`
- `web/tests/`
- `web/src/router.tsx`
- `web/src/services/form.ts`
- `web/src/features/forms/pages/FormListPage.tsx`
- `web/src/features/forms/pages/CreateFormPage.tsx`
- `web/src/features/forms/pages/FormDetailPage.tsx`
- Posibles fixtures o helpers de pruebas

Dependencias:
- TASK-001.
- TASK-004 para comandos y gestor reproducibles desde checkout limpio.
- TASK-005 y TASK-006 si se aprueba una suite integrada con API y SQL reales.
- Definir si la suite es integrada o usa `page.route()`; una suite completamente interceptada no valida backend ni persistencia.
- Definir cómo preparar y limpiar datos de prueba, cómo iniciar la API y cómo tratar el certificado HTTPS.
- Decidir qué hacer con los 15 tests legacy: excluirlos explícitamente, etiquetarlos o migrarlos en tareas posteriores.

Riesgos:
- Los tests pueden depender accidentalmente de datos compartidos.
- Reparar toda la suite antigua de una vez ampliaría innecesariamente el alcance.
- Una configuración que solo funciona con servidores iniciados manualmente seguiría sin ser reproducible.
- Con `fullyParallel: true`, nombres estáticos y una base compartida pueden producir colisiones.
- Interceptar toda la API puede dar una falsa señal E2E; usar API real requiere aislamiento y limpieza seguros.
- No existe endpoint de eliminación de formularios para teardown y la API usa HTTPS local con confianza no confirmada.

Criterios generales:
- `playwright.config.ts` define `baseURL` y los tests navegan con rutas relativas sin duplicar URLs locales.
- `webServer` inicia Vite con el comando oficial y espera `http://localhost:5173`.
- La documentación identifica si API y SQL son reales o interceptados y qué cobertura ofrece cada caso.
- Si la suite es integrada, API y SQL están disponibles mediante una estrategia declarada sin pasos manuales ocultos.
- Cada test usa datos únicos y ejecuta cleanup seguro incluso ante fallo, o usa fixtures interceptados completamente aislados.
- Las pruebas de listado, creación básica y detalle verifican datos preparados por ellas y el contrato aprobado.
- La suite puede repetirse sin depender del orden y es compatible con la política de paralelismo elegida.
- Los 15 tests legacy quedan fuera de la ejecución mínima mediante una decisión explícita; no permanecen fallando silenciosamente.
- El comando aprobado puede ejecutarse sin iniciar manualmente el frontend.

OpenSpec: Pendiente

Notas:
- Tamaño estimado: mediano.
- No incluye recuperar inmediatamente todos los casos antiguos de secciones y preguntas.
- Confirmado por código: existen 15 tests, todos usan `http://localhost:5173` y navegan a la ruta antigua; `baseURL` y `webServer` están comentados.
- Confirmado por código: solo Chromium está habilitado y no existe script `test:e2e`.
- Confirmado por OpenSpec: no existe capability E2E; `version-status-contract` solo condiciona los estados usados en el detalle.
- Decisión humana pendiente: E2E real frente a UI interceptada, lifecycle de API/SQL, aislamiento de datos y disposición de la suite legacy.
- Candidata a descomposición en topología/datos, configuración, fixtures, tres casos independientes y clasificación de tests legacy.

### TASK-008 - Implementar la creación de versiones

Estado: Completada (superada por `manage-form-version-lifecycle`, archivado 2026-10-10; ver `openspec/changes/archive/2026-10-10-manage-form-version-lifecycle/implementation-results.md`)

Prioridad: Baja

Origen: Fase 6

Descripción:
Especificar e implementar posteriormente el vertical slice para crear una versión, clonar el schema desde la fuente aprobada, registrar la derivación y conectar el flujo con el modal y la navegación editable. Esta tarea no puede iniciar implementación hasta resolver las reglas de fuente, numeración, Draft único y concurrencia.

Motivo:
La UI ya contiene servicio y modal parciales, pero `CreateFormVersion` es un stub sin Carter, ruta ni persistencia. El detalle no expone un control activo para abrir el modal y el builder sí lo abre sin comprobar si existe otro Draft.

Módulos involucrados:
- `api/FormManagementApi/Features/Forms/CreateFormVersion/CreateFormVersion.cs`
- `api/FormManagementApi/Entities/FormVersion.cs`
- `api/FormManagementApi/Data/AppDbContext.cs`
- `api/FormManagementApi/NewFile1.sql`
- Posible proyecto nuevo de tests backend
- `web/src/services/form.ts`
- `web/src/features/forms/components/VersionModal.tsx`
- `web/src/features/forms/pages/FormDetailPage.tsx`
- `web/src/features/forms/pages/FormPage.tsx`
- `web/src/features/forms/components/VersionCard.tsx`
- `web/src/types/form.ts`

Dependencias:
- Un cambio OpenSpec específico para creación de versiones; TASK-003 solo cubre el contrato HTTP básico.
- TASK-005.
- TASK-006.
- Resolver el conflicto entre la spec vigente, que conserva selección Published-only, y la spec manual, que indica clonar la última versión.
- Definir cómo se calcula el próximo número y si se reutilizan huecos.
- Definir cómo se garantiza un único Draft y si requiere un cambio estructural de base de datos.
- Definir códigos 201/400/404/409, respuesta, `Location` y manejo de concurrencia.
- Decidir dónde aparece `Nueva versión` y cuál es la ruta editable canónica.

Riesgos:
- Condiciones de carrera al calcular el próximo número.
- El índice actual solo evita repetir número; no garantiza un único Draft y un check-then-insert no sería atómico.
- Clonado incorrecto o pérdida del schema de origen.
- La FK permite que la fuente pertenezca a otro formulario si el handler no lo valida.
- Una fuente puede cambiar o desaparecer entre validación y guardado.
- Inconsistencia entre la respuesta backend y la navegación frontend.
- La UI puede enviar doble submit o mantener una lista local desactualizada.
- Cambiar constraints o índices requiere aprobación explícita antes de tocar la base.

Criterios generales:
- `POST /forms/{formId}/versions` sigue Vertical Slice con request/response explícitos y el contrato HTTP aprobado.
- La fuente existe, pertenece al formulario y cumple la política de estado aprobada.
- La versión nueva copia el schema según la regla aprobada, queda `Draft` y registra `DerivedFromVersionId`.
- El número sigue la regla aprobada y la operación completa es atómica.
- Un Draft preexistente o una carrera produce un conflicto controlado, no un 500 ni dos Draft.
- Formulario o fuente inexistente y fuente inválida producen los códigos documentados.
- La UI muestra el control en la ubicación aprobada, evita doble submit y lo deshabilita cuando ya existe Draft.
- El éxito actualiza la lista de forma coherente y navega a la ruta editable canónica.
- Las pruebas backend cubren éxito, fuente inexistente/ajena, Draft preexistente y concurrencia; E2E cubre éxito y conflicto con datos aislados.

OpenSpec: Pendiente

Notas:
- Tamaño estimado: grande sin descomposición.
- Confirmado por código: la entidad contiene schema, estado, número y derivación; la base solo impone unicidad `(FormId, VersionNumber)`.
- Confirmado por código: el frontend espera `POST /forms/{formId}/versions` y `{ data }`, pero ese contrato aún no existe en backend y debe alinearse con TASK-006.
- Confirmado por OpenSpec: `version-status-contract` exige que el modal muestre únicamente fuentes Published; no define clonado, numeración ni Draft único.
- Decisiones humanas bloqueantes: fuente, numeración, enforcement de Draft, concurrencia, contrato de errores, ubicación del control y ruta editable.
- Candidata a descomposición en decisiones/spec, tests backend, vertical slice, garantía de concurrencia, cliente frontend, integración UI/navegación y E2E.

### TASK-009 - Separar visualización y edición de versiones

Estado: Pendiente

Prioridad: Baja

Origen: Fase 6

Descripción:
Definir y aplicar un modo explícito de acceso por estado: Draft editable y Published/Archived read-only. La protección debe considerar el estado real obtenido del servidor y el acceso directo por URL, no solo ocultar controles según el pathname.

Motivo:
Las rutas `/view` y `/builder` renderizan el mismo `FormPage` sin modo. El detalle envía todos los estados a `/view`, el selector interno envía todas las versiones a `/builder` y los controles CRUD y drag-and-drop permanecen disponibles.

Módulos involucrados:
- `web/src/router.tsx`
- `web/src/features/forms/pages/FormPage.tsx`
- `web/src/features/forms/pages/FormDetailPage.tsx`
- `web/src/features/forms/components/VersionCard.tsx`
- `web/src/features/forms/components/Table.tsx`
- `web/src/features/forms/components/TableRowActions.tsx`
- Componentes CRUD de secciones y preguntas
- Componentes drag-and-drop
- `web/src/services/form.ts`
- `web/src/types/form.ts`
- `web/src/store/formStructure.ts`
- Endpoints futuros de consulta y escritura de estructura

Dependencias:
- TASK-006.
- TASK-008 para el recorrido integrado crear Draft → editar; parte del modo read-only puede diseñarse antes.
- `openspec/specs/version-status-contract/spec.md` para estados canónicos.
- Consulta de versión funcional que devuelva estado, valide pertenencia al formulario y responda 404.
- Lectura funcional de estructura.
- Decidir `/builder` frente a `/edit` y la política para combinaciones estado/ruta no válidas.
- La garantía backend de inmutabilidad depende del futuro endpoint de escritura de estructura.

Riesgos:
- Duplicar páginas podría generar divergencias de presentación.
- Ocultar controles solo en la UI no desactiva callbacks, drag-and-drop ni futuras mutaciones backend.
- Puede aparecer brevemente UI editable mientras se resuelve el estado remoto.
- El selector de versiones puede evadir el modo si continúa navegando siempre a `/builder`.
- El mock global puede mostrar una estructura distinta a la versión solicitada.
- Sin protección backend no puede afirmarse que Published y Archived sean inmutables.

Criterios generales:
- La versión se resuelve desde servidor y se comprueba que pertenece al `formId` antes de habilitar edición.
- Draft abre la ruta editable canónica; Published y Archived abren el modo read-only aprobado.
- Mientras se carga el estado no se renderizan controles editables.
- Acceder directamente a una ruta editable con Published o Archived aplica la política aprobada y nunca habilita mutaciones.
- En read-only no se montan ni ejecutan controles, diálogos, callbacks, drag-and-drop ni requests de escritura.
- El selector conserva la separación de modos al cambiar de versión.
- Versión inexistente o perteneciente a otro formulario produce un error controlado.
- Cuando exista escritura backend, el servidor vuelve a comprobar que el estado actual es Draft.
- Las pruebas cubren Draft, Published, Archived, selector y acceso directo por URL, incluida la ausencia de requests de mutación en view.

OpenSpec: Pendiente

Notas:
- Tamaño estimado: grande sin descomposición.
- Debe priorizar compartir componentes y controlar explícitamente el modo, no duplicar toda la pantalla.
- Confirmado por código: `/view` y `/builder` usan `FormPage`; `FormPage` no recibe ni deriva un modo y siempre monta superficies editables.
- Confirmado por OpenSpec: los estados están definidos, pero no existen requisitos formales de rutas, permisos o read-only.
- Decisiones humanas bloqueantes: ruta editable, respuesta ante estado/ruta incompatible, comportamiento de Draft en `/view`, controles visibles y alcance de la defensa backend.
- Inferencia: TASK-008 es dependencia de integración, no necesariamente de la parametrización inicial del modo.
- Candidata a descomposición en política/spec, resolución de modo, navegación, parametrización CRUD, desactivación de DnD/escritura, protección backend y E2E.

## Orden recomendado

> Estado 2026-10-10 (tarde): TASK-001, TASK-002, TASK-004, TASK-005 y TASK-008 completadas y archivadas; suites Playwright legacy de tabs eliminados (29 tests/4 archivos en verde). El orden vigente de trabajo pendiente es: `render-form-schema-v1` (item 4 de la iniciativa) → re-auditoría de dependencias frontend → TASK-003.

1. `TASK-002`: recuperar primero una señal de lint útil. **(Completada)**
2. `TASK-004`: consolidar gestor y runtimes para que los quality gates sean reproducibles. **(Completada, 2026-10-10)**
3. `TASK-003`: aprobar en OpenSpec el contrato HTTP básico.
4. `TASK-005`: hacer reproducible SQL Server sin tocar el volumen local existente. **(Completada, 2026-10-10)**
5. `TASK-006`: implementar el contrato básico ya aprobado y validarlo contra un entorno desechable. **(Mayormente resuelto)**
6. `TASK-007`: recuperar la suite mínima sobre listado, creación y detalle. **(Mayormente resuelto; suites legacy de tabs eliminados 2026-10-10)**
7. `TASK-008`: especificar y luego implementar creación de versiones. **(Completada vía `manage-form-version-lifecycle`)**
8. `TASK-009`: separar edición y visualización sobre contratos de versión y estructura estables. **(Mayormente resuelto)**

Dependencias principales confirmadas:

- TASK-004 condiciona la reproducibilidad desde checkout limpio de TASK-002 y TASK-007.
- TASK-003 define el contrato que TASK-006 debe implementar.
- TASK-005 habilita la validación SQL integrada de TASK-006, TASK-007 y TASK-008.
- TASK-006 estabiliza DTOs y errores antes de TASK-007, TASK-008 y TASK-009.
- TASK-008 habilita el recorrido integrado de creación de Draft que TASK-009 debe enrutar al modo editable.
- TASK-009 también depende de lectura de estructura y de la futura protección backend de escritura; esas capacidades aún no tienen una tarea de implementación separada en este backlog.

Candidatas a descomposición antes de implementación: TASK-004, TASK-005, TASK-006, TASK-007, TASK-008 y TASK-009. Permanecen en estado `Pendiente` porque todavía no se han creado ni aprobado sus tareas hijas o specs OpenSpec.
