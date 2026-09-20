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

El servidor de desarrollo usa `http://localhost:5173`. La API está configurada actualmente en `https://localhost:7284` mediante `src/services/form.ts`.

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

`pnpm build` ejecuta TypeScript y genera el build de producción. Actualmente finaliza correctamente, con un warning no bloqueante por tamaño del chunk principal.

Para Playwright, inicia primero Vite en el puerto 5173:

```powershell
pnpm dev -- --host localhost --port 5173 --strictPort
pnpm exec playwright test
```

La suite Playwright todavía corresponde parcialmente a una navegación anterior. Consulta `../docs/PROJECT_STATUS.md` antes de interpretar sus resultados.
