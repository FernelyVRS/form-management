# Plan de ciclo de versiones, limpieza técnica y cierre OpenSpec

## 1. Objetivo y estado de este documento

Implementar los puntos acordados:

1. Completar el ciclo de versiones: crear una versión desde otra, clonar un formulario, publicar y archivar.
2. Limpiar la implementación legacy, recuperar las pruebas completas, resolver warnings y cerrar los cambios OpenSpec pendientes.

Este documento es el plan y el contexto de traspaso para otra sesión. **Actualización 2026-10-15:** el ciclo de versiones descrito aquí ya está implementado, verificado y archivado (change `manage-form-version-lifecycle`, archivado 2026-10-10; migración 002 aplicada a `form_structure`). Las secciones 5-9 y 12 reflejan trabajo cumplido; sus checkboxes se marcaron como histórico. Pendientes reales restantes de este plan: prunar primitives y revisar comentarios/prototipos backend (§10), algunos items de higiene de tests y warnings (§11) y regularizar la spec de workspace UI (§12).

El renderer dinámico de respuestas es un trabajo separado y no forma parte de este plan.

## 2. Contexto actual para retomar

### Implementado

- Contrato de schema inglés v1 con raíz `{ "schemaVersion": 1, "sections": [] }`.
- JSON Schema, fixtures compartidos, tipos/Zod frontend y DTOs/validador/serializer .NET.
- Persistencia de schemas mediante GET/PUT y RowVersion.
- Escritura de schema exclusiva para Draft y protección de variables/campos core derivados.
- Creación básica de formulario con Draft inicial y schema v1 vacío.
- Builder conectado a la API, borrador aislado por versión y Guardar explícito.
- CRUD de secciones, grupos de un nivel y campos text/number/select.
- Selects estáticos/dependientes, descripciones y validaciones simples.
- Workspace UI con outline/búsqueda, canvas compacto y propiedades responsive.
- Guards para cambios sin guardar y propiedades sin aplicar.
- `/view` inspecciona la estructura en solo lectura; no es un formulario para responder.

### Falta implementar (histórico: resuelto el 2026-10-10 por `manage-form-version-lifecycle`)

- [x] `CreateFormVersion` era un stub sin endpoint funcional.
- [x] No había endpoints funcionales de clonado de formulario, publicación o archivado.
- [x] No había índices SQL que limiten a una Draft y una Published por formulario (migración 002).
- [x] Los servicios frontend de clonado, creación de versión y publicación conservaban expectativas antiguas de `json.data`.
- [x] El modal de nueva versión estaba montado, pero no tenía un control activo que lo abriera.
- [x] La pantalla de detalle tenía un resumen de publicación hardcodeado y carga imperativa.
- [x] No había servicio/acción frontend de archivado.
- [x] Persistían componentes, tipos, stores y suites de tests del editor anterior (retirados 2026-10-11).

### Última auditoría SQL, solo lectura

- Instancia: contenedor manual legacy `sqlserver22` (esta auditoría es histórica; desde 2026-10-15 la instancia estándar es la del stack Compose, ver `AGENTS.md`).
- Base de desarrollo: `form_structure`.
- 1 formulario y 1 versión Draft; ninguna Published.
- No se detectaron Drafts o Published duplicadas.
- Existe el índice único `(FormId, VersionNumber)`.
- Existen `CK_FormVersions_Status` y `CK_FormVersions_SchemaV1`.
- No existen índices filtrados únicos de Draft/Published.

Estos datos son una fotografía de la última auditoría. Repetirla antes de cualquier migración. **Actualización:** desde la migración 002 (2026-10-10) sí existen los índices filtrados únicos de Draft/Published y el check de `VersionNumber > 0`.

El formulario de prueba conservado es:

- FormId: `ea007cc2-8ca2-430e-be90-31d5f7723c46`.
- VersionId: `f2eb4844-fc17-463c-b2ab-3e73161799d4`.
- Nombre: **Formulario de prueba v1**.
- Dos secciones; seis preguntas y un grupo en la primera, segunda vacía.
- Ejemplo reproducible: `contracts/form-schema/v1/examples/test-form.json`.

### Últimos resultados de verificación registrados (2026-10-15)

- Backend: **96/96** pruebas con SQL real (instancia Compose, `FORM_SCHEMA_TEST_SQL`), incluidas las de contrato HTTP y ciclo de vida; `dotnet build` 0 errores/0 warnings.
- Frontend: **96/96** pruebas unitarias; `pnpm build` sin warnings (chunks vendor) y `pnpm lint` 0 errores / 0 warnings.
- Playwright: 28 pruebas en 4 archivos + smoke real opt-in, en verde en la última ejecución registrada.
- `openspec validate --all`: 9/9, 0 cambios activos (9 archivados).
- Las suites Playwright legacy de tabs/CRUD fueron eliminadas el 2026-10-10 (decisión registrada).

## 3. Decisiones de negocio confirmadas por el usuario

| Tema | Decisión |
|---|---|
| Draft por formulario | Como máximo una |
| Published por formulario | Como máximo una |
| Publicar un Draft | Archivar automáticamente la Published anterior |
| Archivado manual | Solo Draft, conservando historial y schema |
| Archivado de Published | Únicamente al publicar una versión que la reemplaza |
| Orígenes para nueva versión o clonado | Published y Archived; Draft excluida |
| Clonado de formulario | Conservar vínculo de procedencia y protección core |
| Mínimo para publicar | Schema v1 válido y al menos una pregunta |

"Como máximo una" no significa que deba existir siempre una Draft o una Published.

Flujo objetivo:

```text
Draft -- Publicar --> Published -- Publicar reemplazo --> Archived
  |
  +-- Archivar borrador --> Archived

Published o Archived -- Copiar --> Nuevo Draft
```

Archived no se edita ni se restaura directamente: su estructura se recupera creando un nuevo Draft. La selección por estado también admite Archived procedentes de un borrador descartado, siempre que su schema sea válido.

Los campos dentro de grupos cuentan para el mínimo de publicación. No se exigirá contenido en cada sección: la segunda sección vacía del formulario de prueba no impide publicar si hay preguntas válidas en el documento.

## 4. Restricciones del contrato y del trabajo

- Mantener claves técnicas/enums en inglés y textos visibles en español.
- Reutilizar el contrato v1 y los validadores existentes; no introducir otra estructura ni adaptadores legacy.
- Mantener `variable` y `core`, IDs y opciones durante la copia del schema.
- Mantener Guardar explícito; publicar la estructura guardada, sin autoguardar cambios locales.
- Mantener la inmutabilidad del schema de Published/Archived.
- ~~Conservar `web/src/mocks/legacy/formStructure.json`; no eliminarlo ni reintroducirlo en runtime.~~ **Actualización 2026-10-11:** el mock fue eliminado por petición explícita del usuario (ver §10); en cualquier caso, no reintroducirlo en runtime.
- Respetar trabajo ajeno y archivos untracked. No hacer reset/clean masivo ni restaurar/eliminar lockfiles ajenos.
- Usar Carter/Minimal APIs con un slice por endpoint; no introducir Controllers.
- Mantener el enfoque database-first con migraciones SQL explícitas, no auto-migración al iniciar la API.
- Usar la instancia SQL del stack Compose (puerto `MSSQL_PORT` de `.env`) para auditoría local y bases aisladas de pruebas SQL de escritura; `sqlserver22` es legacy y no debe requerirse (unificación 2026-10-15).
- No reinicializar `form_structure`, su volumen o la base `model` para ejecutar tests.
- No hacer commit/push ni archivados no revisados sin la instrucción correspondiente.

## 5. Fase 1: formalizar el ciclo de versiones

Crear el cambio OpenSpec:

```text
manage-form-version-lifecycle
```

Completado el 2026-10-10 (change archivado; delta de `version-status-contract` sincronizado):

- [x] Crear proposal, design, specs y tasks.
- [x] Definir transiciones, contratos de comandos, respuestas directas y códigos ProblemDetails.
- [x] Definir la coordinación transaccional por formulario y el uso de RowVersion.
- [x] Definir copia de snapshots, procedencia y protección core.
- [x] Definir publicación con schema válido y al menos una pregunta.
- [x] Actualizar la spec vigente `version-status-contract`: actualmente permite solo Published como origen y excluye Archived.
- [x] Añadir escenarios para Published/Archived disponibles y Draft excluida, sin reescribir las specs históricas archivadas.
- [x] Documentar que Archived es terminal y recuperable mediante derivación.

### Endpoints propuestos

| Operación | Endpoint |
|---|---|
| Crear versión desde otra | `POST /forms/{formId}/versions` |
| Crear formulario desde una versión | `POST /forms/from-version` |
| Publicar Draft | `POST /forms/{formId}/versions/{versionId}/publish` |
| Archivar Draft | `POST /forms/{formId}/versions/{versionId}/archive` |

Los nuevos comandos usarán DTOs explícitos en inglés y respuestas directas, sin `{ data }`.

Diseño inicial a concretar en los artefactos:

- Crear versión: `sourceVersionId` y token de origen cuando el contrato lo requiera.
- Clonar formulario: `name`, `description`, `sourceFormId`, `sourceVersionId` y token de origen cuando corresponda.
- Publicar/archivar: `rowVersion` obligatorio.
- Respuestas con IDs, número, estado, procedencia y token; publicación puede indicar la versión archivada por reemplazo.
- Para metadata existente, usar mappers o extensiones compatibles antes de renombrar todos los DTOs.
- Asegurar que la UI puede obtener el token necesario para cada comando mediante metadata o GET schema.

Los nombres exactos de DTOs/códigos y la estrategia de repetición de comandos se terminarán de especificar en esta fase; no están implementados por este documento.

## 6. Fase 2: garantías SQL y concurrencia

Preparar una segunda migración después de `001_PersistFormSchemaV1.sql`.

Completado el 2026-10-10 (migración 002 aplicada a `form_structure` tras backup verificado; repetible en `db-init`):

- [x] Auditar duplicados, estados, números, constraints y definición de índices.
- [x] Añadir índice único filtrado por FormId donde Status = Draft.
- [x] Añadir índice único filtrado por FormId donde Status = Published.
- [x] Añadir check de `VersionNumber > 0`.
- [x] Reflejar índices/checks en EF.
- [x] Hacer la migración transaccional, repetible y capaz de detectar definiciones incompatibles.
- [x] Abortar ante datos conflictivos; no elegir ni archivar ganadores automáticamente.
- [x] Probar en una base aislada antes de aplicar a desarrollo.
- [x] Auditar nuevamente, respaldar, coordinar escritores y aplicar la migración autorizada.

### Coordinación de comandos

Recomendación técnica: dentro de una transacción explícita, bloquear la fila Form con una estrategia equivalente a update/held lock antes de los comandos del mismo formulario.

La numeración será:

```text
MAX(VersionNumber de todas las versiones del formulario) + 1
```

Incluye Archived. No reutilizar números ni calcular MAX+1 fuera de la transacción.

RowVersion protege cambios de los registros; índices únicos protegen las invariantes finales. Las carreras esperadas se transforman en conflictos controlados, no en sobrescritura last-write-wins.

## 7. Fase 3: backend del ciclo de vida

### 7.1 Publicar Draft

Priorizar publicación permite usar el formulario de prueba actual como primera fuente publicada.

- [x] Resolver pertenencia por ambos IDs y exigir Draft.
- [x] Validar token actual y schema guardado v1.
- [x] Contar preguntas, incluidas las de grupos; rechazar cero preguntas.
- [x] Revalidar identidad/core derivados.
- [x] Cargar la Published anterior dentro de la transacción.
- [x] Archivar la anterior antes de promover el Draft para no violar el índice filtrado.
- [x] Realizar los saves necesarios dentro de la misma transacción y confirmar juntos.
- [x] Actualizar timestamps UTC y tokens y devolver resultado explícito.
- [x] Verificar rollback si falla la promoción después de archivar la anterior.

### 7.2 Crear versión desde Published/Archived

Completar `Features/Forms/CreateFormVersion/CreateFormVersion.cs`.

- [x] Resolver origen dentro del mismo formulario.
- [x] Rechazar origen Draft y creación si ya existe otro Draft.
- [x] Leer/validar el snapshot completo, sin modificar el origen.
- [x] Copiar IDs, variables, core, descripciones, validación, opciones y mapas.
- [x] Asignar siguiente número bajo coordinación transaccional.
- [x] Registrar `DerivedFromVersionId` y crear Draft.
- [x] Devolver IDs y Location correctos para navegar al builder.

### 7.3 Crear formulario desde una versión

Nuevo slice `CreateFormFromVersion`.

- [x] Validar formulario/versión origen y estado Published o Archived.
- [x] Crear nuevo Form y Draft número 1 atómicamente.
- [x] Copiar el schema completo validado.
- [x] Conservar FK de procedencia entre formularios y las restricciones core heredadas.
- [x] Mantener independencia física de ambos snapshots; no compartir un objeto editable.
- [x] No modificar el origen.

### 7.4 Archivar Draft

Nuevo slice `ArchiveFormVersion`.

- [x] Validar pertenencia, Draft y RowVersion.
- [x] Cambiar a Archived sin borrar filas ni schema.
- [x] Conservar número y procedencia; actualizar UTC/token.
- [x] Rechazar archivado manual de Published y transiciones no permitidas.

### 7.5 Contratos y lectura de metadata

- [x] Reutilizar ProblemDetails con códigos estables para ausencia, estado, Draft existente, concurrencia y schema no publicable.
- [x] Garantizar que rechazos no dejan cambios parciales.
- [x] No devolver entidades EF ni propiedades de navegación.
- [x] Dar 404 real para entidades ausentes.
- [x] Ordenar versiones explícitamente por número.
- [x] Diferenciar última versión (número más alto) de publicación vigente.
- [x] Usar UTC para los nuevos comandos; no reinterpretar timestamps históricos mediante una conversión masiva no acordada.

## 8. Fase 4: frontend de gestión

### Datos y comandos

- [x] Crear/consolidar API de lifecycle dentro de `features/forms/api/` con Zod y `requestJson`.
- [x] Codificar IDs en URLs y abandonar `json.data` en los comandos migrados.
- [x] Añadir queries de detalle y fuentes con AbortSignal y keys por identidad.
- [x] Reutilizar esa query en detalle, metadata del builder y fuentes de clonado.
- [x] Añadir mutations sin reintentos automáticos y con controles pending.
- [x] Invalidar listado, detalle y schemas afectados después de comandos.
- [x] No sobrescribir borradores locales sucios al refrescar metadata/status.

### Detalle y acciones

- [x] Sustituir el resumen ficticio `v1.0.0 / Publicada` por datos reales.
- [x] Mostrar publicación actual o Sin publicación, Draft disponible, última versión e historial.
- [x] Exponer Nueva versión; si ya hay Draft, ofrecer Continuar borrador.
- [x] Permitir Published/Archived como fuentes de versión y clonado.
- [x] Dar loading/error/retry/empty estados a los selectores de fuente.
- [x] Evitar que una respuesta antigua reemplace la fuente seleccionada más recientemente.
- [x] Mantener nombre/descripcion ante errores de clonado.
- [x] Navegar con IDs validados de la respuesta.

| Estado | Acciones |
|---|---|
| Draft | Editar, publicar, archivar borrador |
| Published | Ver estructura, crear versión, clonar formulario |
| Archived | Ver estructura, crear versión, clonar formulario |

- [x] Publicar inicialmente desde detalle y confirmar que se publica la estructura guardada.
- [x] Mantener Guardar explícito y guards del builder; no publicar un schema local no guardado.
- [x] Confirmar publicación/archivado y permitir cancelación sin request.
- [x] Reflejar conflictos como mensajes accionables y refrescar el estado autorizado cuando corresponda.
- [x] Renombrar View Live a Ver estructura mientras no exista renderer de respuestas. (Verificado 2026-10-15: `VersionCard.tsx` muestra "Ver estructura".)

## 9. Fase 5: pruebas del ciclo completo

### Backend con SQL Server real

- [x] Clonado con igualdad completa del schema, procedencia y versión correcta.
- [x] Orígenes Published/Archived aceptados y Draft rechazada.
- [x] Origen ajeno o inexistente.
- [x] Otro Draft existente y numeración incluyendo Archived.
- [x] Publicación inicial y reemplazo atómico de publicación anterior.
- [x] Rechazo de publicación vacía/schema inválido/core inválido.
- [x] Archivado manual de Draft y rechazo de Published.
- [x] Tokens desactualizados y carreras entre guardar/publicar/archivar.
- [x] Dos creaciones concurrentes: no duplicar Draft ni números.
- [x] Rollback completo ante fallo intermedio.
- [x] Restricciones SQL, auditoría de conflictos y repetición de migración.
- [x] Timestamps/tokens refrescados y rechazos sin mutación.

Usar las bases desechables de `SqlSchemaTestHost` contra la instancia Compose con `FORM_SCHEMA_TEST_SQL`. El entorno model contiene tablas heredables: recrear solo las copias de cada base temporal, no model ni form_structure.

### Frontend

- [x] Parser/rutas/request bodies/respuestas directas y errores estructurados.
- [x] Acciones y resúmenes por estado.
- [x] Modal realmente accesible y apertura desde el detalle.
- [x] Fuentes elegibles, ausencia/error de fuentes y cambios rápidos de selección.
- [x] Continuar Draft existente y recuperación de conflicto.
- [x] Confirmación cancelada sin POST.
- [x] Una solicitud durante acciones repetidas mientras pending.
- [x] Navegación e invalidación de contadores/estado/editabilidad.
- [x] Guards de borrador/propiedades sin aplicar preservados.

## 10. Fase 6: eliminar código legacy

Crear un cambio independiente:

```text
remove-legacy-form-editor
```

Volver a comprobar imports desde main/router y pertenencia de cambios antes de eliminar cada candidato.

### Cluster desconectado candidato

Ejecutado el 2026-10-11 (verificación de imports desde el router previa a cada borrado; sin cambio OpenSpec por ser solo supresión).

- [x] `web/src/features/forms/components/Question/`.
- [x] `web/src/features/forms/components/Section/`.
- [x] `Table.tsx`, `TableRowActions.tsx`, `FormDialog.tsx` del feature.
- [x] Prototipos `FormCreator.tsx` y `FormCreator/index.tsx`.
- [x] `web/src/components/forms/` legacy.
- [x] `web/src/components/dnd/` legacy, no el DnD canónico del feature.
- [x] `web/src/store/formStructure.ts` y `formMetadata.ts` sin consumidores activos.

### Removales dependientes

- [x] Retirar `VersionWithEstructura` y su import de Seccion en `types/form.ts`.
- [x] Retirar `types/fields.ts`, `types/seccion.ts` y barrel `types/index.ts` cuando no tengan consumidores.
- [x] Mantener los tipos activos de metadata/lifecycle; no borrar `types/form.ts` en bloque. (`types/form.ts` conserva metadata/lifecycle; verificado 2026-10-15.)
- [x] Evaluar el re-export de compatibilidad `pages/FormPage.tsx`.
- [x] Comprobar consumidores externos antes de retirar la ruta backend singular `/version/`. **(2026-10-15: sin consumidores en el repo; la ruta singular fue retirada y `GET /forms/{formId}/versions/{versionId}` expone el DTO canónico con 404 `version_not_found`.)**
- [ ] Revisar comentarios/prototipos backend con cuidado del diff de usuario. (Pendiente: relacionado con los TODOs de `CreateForm.cs` que el usuario excluyó expresamente.)

### Primitives y paquetes

- [ ] Prunar primitives solo después de implementar lifecycle; sus menús pueden reutilizar dropdown-menu/table. (Lifecycle completado 2026-10-10; la poda queda como pendiente real de este plan.)
- [x] Mantener componentes compartidos que sí estén en el grafo activo, incluido separator vía field. (Se eliminaron solo componentes sin consumidores, con verificación de imports por archivo; 2026-10-11.)
- [x] Revisar con imports/`pnpm why` posibles paquetes legacy: ulid, dnd-kit helpers/modifiers, resolvers o Radix sin uso. **(2026-10-15: retirados `ulid`, `@dnd-kit/helpers`, `@dnd-kit/modifiers` y `@hookform/resolvers` por 0 importadores; todos los `@radix-ui/react-*`, `radix-ui`, zustand y ajv siguen en uso.)**
- [x] No retirar dnd-kit/react, RHF, Query, Zustand, Zod ni dependencias de primitives activos. (Verificado 2026-10-15: todos siguen en uso tras la poda de paquetes.)
- [x] Actualizar package.json y pnpm-lock.yaml coordinadamente, sin cambios masivos de versiones. (2026-10-15: solo remociones de 4 dependencias, versions intactas, `pnpm audit` 0 vulns.)

Preservar por defecto archivos de configuración de agentes/skills, workspace y cualquier trabajo untracked no identificado como legacy. **Actualización 2026-10-11:** pese a esta recomendación, `web/src/store/user.ts` y el mock histórico `web/src/mocks/legacy/formStructure.json` fueron eliminados (petición de limpieza explícita del usuario); `json sructure borrador.json`, `FormManagementApi.http` y el `Folder` fantasma `EditForm` también se retiraron.

## 11. Fase 7: suites completas y warnings

### Tests legacy

Migrar su intención y luego retirar/archivar fuera de testDir:

- [x] `web/tests/question-management.spec.ts`. (Eliminado 2026-10-10 con las suites legacy de tabs/CRUD; sin migración de intención, decisión registrada en PROJECT_STATUS/BACKLOG.)
- [x] `web/tests/question-form-double-submit.spec.ts`. (Ídem.)
- [x] `web/tests/section-form-double-submit.spec.ts`. (Ídem.)

- [ ] Reubicar regresiones de crear/editar/validar en el builder canónico.
- [ ] Verificar que aplicar propiedades modifica una sola vez el borrador y no envía PUT.
- [ ] Verificar que Save repetido con respuesta demorada envía un solo PUT.
- [ ] Crear harness que intercepte todos los endpoints esperados y falle ante llamadas inesperadas.
- [ ] Centralizar origen API en tests, en lugar de repetirlo por suite. (Pendiente 2026-10-15: `http://localhost:5165` sigue repetido por archivo.)
- [x] Mantener smoke real de solo lectura como opt-in; no mutar desarrollo desde E2E. (`FORM_SCHEMA_LIVE_SMOKE=1` opt-in.)
- [ ] Añadir typecheck de Playwright/configs.
- [x] Ejecutar finalmente `pnpm exec playwright test` completo, no solo una selección. (2026-10-15: 28 passed + 1 skipped opt-in, en verde.)

No esconder las suites antiguas indefinidamente con exclusiones amplias.

### Warnings y calidad

- [x] Migración de detalle a Query elimina su warning de useEffect. (Detalle usa `useFormDetailQuery`; lint 0/0.)
- [x] Retiro del editor dependiente legacy elimina sus dos warnings de efectos. (Editor retirado 2026-10-11.)
- [x] Separar helpers/exports de buttonVariants y badgeVariants o retirar exports sin consumidores. (Exports canónicos de shadcn con consumidores reales y `allowExportNames`; lint 0/0.)
- [ ] Retirar o separar hooks del primitive form si se mantiene.
- [x] Corregir metadata de React 18 a React 19 en ESLint. (2026-10-15: `settings.react.version: "detect"`.)
- [x] No suprimir globalmente reglas de hooks/React Refresh. (Allowlist puntual de shadcn, no supresión global.)
- [x] Retirar `WithOpenApi` obsoleto conservando metadata/OpenAPI correctos. (2026-10-10, ASPDEPR002.)
- [x] Resolver el advisory de Microsoft.OpenApi mediante una dependencia corregida compatible con .NET 10 y comprobar generación de OpenAPI. (2.7.5 fijado; `openapi/v1.json` verificado 2026-10-15.)

La meta del cierre es build/lint y suites completas verdes, con warnings resueltos o una justificación explícita de cualquier excepción restante.

## 12. Fase 8: revisión, sincronización y archivo OpenSpec

Había cuatro cambios activos con tasks completas (todos archivados el 2026-10-10):

1. `restore-reliable-frontend-lint`.
2. `adopt-versioned-english-form-schema`.
3. `persist-form-version-schema`.
4. `migrate-form-builder-to-schema-v1`.

Las specs principales actuales contienen listado y contrato de estados; faltan las capacidades de los cambios anteriores por sincronizar.

Para cada uno, en el orden anterior:

- [x] Confirmar estado de artefactos/tasks y revisar evidencias.
- [x] Verificar implementación contra su alcance original, distinguiendo cambios posteriores aprobados.
- [x] Sincronizar requisitos hacia main specs.
- [x] Reconciliar requisitos temporales de etapas de migración con el comportamiento actual mediante los deltas apropiados.
- [x] Preservar implementation-results y `.openspec.yaml`.
- [x] Archivar usando la fecha real de cierre, sin borrar archivos históricos.
- [x] Actualizar enlaces y estado actual en docs.

Destinos esperados de main specs:

```text
openspec/specs/frontend-lint-quality-gate/spec.md
openspec/specs/form-schema-contract/spec.md
openspec/specs/form-version-schema-persistence/spec.md
openspec/specs/form-schema-builder/spec.md
```

- [ ] Regularizar también la especificación de la mejora workspace UI, que tiene review y tests pero no un cambio OpenSpec dedicado.
- [x] Cerrar y archivar los nuevos cambios de lifecycle/cleanup cuando pasen sus propios criterios. (`manage-form-version-lifecycle` archivado 2026-10-10; `specify-form-http-contract` archivado 2026-10-15; 9 archivados en total, 0 activos.)

Actualizar documentación vigente sin reescribir resultados históricos: README, web/README, PROJECT_STATUS, BACKLOG, contexto contractual y documentos antiguos de detalle que describen rutas/reglas ya reemplazadas.

## 13. Archivos principales para la siguiente sesión

### Backend

```text
api/FormManagementApi/Features/Forms/CreateForm/CreateForm.cs
api/FormManagementApi/Features/Forms/CreateFormVersion/CreateFormVersion.cs
api/FormManagementApi/Features/Forms/GetFormById/GetFormById.cs
api/FormManagementApi/Features/Forms/GetForms/GetForms.cs
api/FormManagementApi/Features/Forms/GetFormVersionById/GetFormVersionById.cs
api/FormManagementApi/Features/Forms/GetFormVersionSchema/GetFormVersionSchema.cs
api/FormManagementApi/Features/Forms/UpdateFormVersionSchema/UpdateFormVersionSchema.cs
api/FormManagementApi/Features/Forms/Shared/Schema/
api/FormManagementApi/Entities/FormVersion.cs
api/FormManagementApi/Data/AppDbContext.cs
api/FormManagementApi/Database/Migrations/
api/FormManagementApi.Tests/SqlSchemaTestHost.cs
api/FormManagementApi.Tests/SchemaPersistenceTests.cs
```

### Frontend

```text
web/src/features/forms/pages/FormDetailPage.tsx
web/src/features/forms/pages/CreateFormPage.tsx
web/src/features/forms/pages/FormBuilderPage.tsx
web/src/features/forms/components/VersionModal.tsx
web/src/features/forms/components/VersionCard.tsx
web/src/features/forms/api/
web/src/features/forms/hooks/
web/src/features/forms/builder/formBuilderStore.ts
web/src/services/form.ts
web/src/types/form.ts
web/tests/
web/playwright.config.ts
web/eslint.config.js
```

### Contexto

```text
AGENTS.md
web/AGENTS.md
openspec/config.yaml
openspec/specs/version-status-contract/spec.md
contracts/form-schema/v1/README.md
docs/PROJECT_STATUS.md
docs/BACKLOG.md
docs/BUILDER_UI_REVIEW.md
```

## 14. Secuencia de ejecución y criterios de cierre

```text
Reglas/specs
  -> SQL y backend de versiones
  -> UI de gestión
  -> pruebas del ciclo completo
  -> limpieza legacy y warnings
  -> verificación, sincronización y archivo
```

Los nuevos cambios serán separados y revisables. El cierre de las specs existentes puede adelantarse tras su verificación para disponer de una base normativa estable; la limpieza de código debe esperar a que la intención de sus regresiones esté cubierta.

Criterios finales:

- [x] Un Draft/Published máximo garantizado por SQL y handlers.
- [x] Publicación y sustitución atómicas.
- [x] Archivar Draft conserva historial; Published manual rechazado.
- [x] Derivar de Published/Archived funciona en mismo/nuevo formulario y conserva core/procedencia.
- [x] Numeración y concurrencia comprobadas con SQL real.
- [x] UI muestra estados reales, fuentes consistentes y conflictos recuperables.
- [x] Editor canónico/guards se mantienen operativos.
- [x] Código legacy activo eliminado. (El mock histórico `formStructure.json` fue retirado el 2026-10-11 por petición explícita del usuario, sustituyendo el criterio de "preservar el mock".)
- [x] Suite completa y gates de calidad correctos. (2026-10-15: Playwright 28+1 opt-in, unit 96/96, backend 96/96 con SQL real, lint 0/0, build sin warnings.)
- [x] Specs sincronizadas, cambios revisados/archivados y docs actuales coherentes. (`openspec validate --all` 9/9, 0 activos; docs principales `PROJECT_STATUS`, `BACKLOG` y este plan actualizados el 2026-10-15.)

## 15. Instrucción para retomar desde otra ventana

Copiar este prompt en la nueva sesión:

> Lee `docs/VERSION_LIFECYCLE_AND_CLEANUP_PLAN.md` y las instrucciones AGENTS.md. Implementa primero `manage-form-version-lifecycle` siguiendo las reglas ya confirmadas: máximo una Draft y una Published, publicar archiva automáticamente la anterior, archivado manual solo de Draft, fuentes Published/Archived, clonado con procedencia/core y publicación con al menos una pregunta y schema v1 válido. Crea los artefactos OpenSpec necesarios antes de aplicar sus tareas. Revisa el worktree y preserva trabajo ajeno y el mock legacy. Audita sqlserver22 antes de migrar y prueba escrituras en bases aisladas. Después sigue las fases de frontend, pruebas, limpieza y cierre del documento. No incluyas el renderer de respuestas en este alcance.

Nota operativa: antes de compilar .NET, comprobar si una instancia de FormManagementApi está bloqueando el ejecutable. Ya ocurrió un MSB3027 por una API dejada en segundo plano; detener únicamente la instancia correspondiente y no dejar procesos de verificación sin gestionar.
