# Form Management Web

Frontend React y TypeScript para administrar formularios dinámicos y sus versiones.

## Comandos

```powershell
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

El servidor de desarrollo usa `http://localhost:5173`. La URL de la API se configura con `VITE_API_URL`; en desarrollo usa `http://localhost:5165` si la variable no está definida. Los builds de producción requieren un valor explícito.

Para personalizarla, crea un archivo `.env.local` basado en `.env.example`:

```dotenv
VITE_API_URL=http://localhost:5165
```

## Organización

- `src/features/forms/`: páginas, componentes y hooks del dominio de formularios.
- `src/components/ui/`: primitives compartidas de UI.
- `src/components/dnd/`: edición drag-and-drop.
- `src/services/`: acceso HTTP.
- `src/store/`: estado cliente con Zustand.
- `src/types/`: contratos TypeScript.
- `tests/`: pruebas E2E con Playwright.

Los estados canónicos de una versión son `Draft`, `Published` y `Archived`. Las etiquetas visibles pueden estar localizadas, pero las comparaciones deben utilizar esos valores contractuales.

## Verificación

El [contrato inglés v1](../contracts/form-schema/v1/README.md) se utiliza en el builder activo. Sus módulos puros están en `src/features/forms/model/`; el borrador por versión está en `features/forms/builder/`. Ejecuta `pnpm test:unit` para verificar contrato, operaciones y estado.

Las rutas `/forms/:formId/versions/:versionId/builder` cargan GET schema y guardan con PUT únicamente al pulsar **Guardar**. `/view` muestra la estructura sin edición; el renderer de respuestas será un cambio posterior. Los conflictos conservan cambios y requieren recarga confirmada. El mock antiguo está conservado en `src/mocks/legacy/formStructure.json` y no tiene imports de runtime.

El builder ahora usa un workspace con navegación/búsqueda a la izquierda, canvas compacto y propiedades a la derecha. En móvil las propiedades se abren en un diálogo. Las dependencias se configuran mediante filas visuales; el JSON queda como opción avanzada. Los cambios de propiedades deben aplicarse al borrador antes de Guardar, con protección al cambiar de selección. `Ctrl/Cmd+S` guarda el borrador aplicado. Consulta [la revisión UI/UX](../docs/BUILDER_UI_REVIEW.md).

Pruebas del builder/listado:

```powershell
pnpm exec playwright test tests/form-builder-v1.spec.ts tests/form-list.spec.ts
pnpm exec playwright test tests/builder-workspace.spec.ts
```

`FORM_SCHEMA_LIVE_SMOKE=1` habilita una prueba adicional de lectura contra una versión local existente; no escribe datos. Las otras pruebas interceptan la API. La configuración shadcn apunta al CSS real `src/styles/index.css`; los componentes nuevos reutilizan `cn()` del proyecto.

`pnpm build` ejecuta TypeScript y genera el build de producción. Actualmente finaliza correctamente, con un warning no bloqueante por tamaño del chunk principal.

Playwright inicia Vite automáticamente en el puerto 5173:

```powershell
pnpm exec playwright test
```

La suite Playwright todavía corresponde parcialmente a una navegación anterior. Consulta `../docs/PROJECT_STATUS.md` antes de interpretar sus resultados.
