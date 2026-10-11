# AGENTS.md - Form Management Project Guidelines

This document provides guidelines for AI agents working on this codebase.

## Project Overview

A React 19 + TypeScript form management application using Vite, React Router 7, TanStack Query, Zustand, and Playwright for testing. The project manages dynamic forms with sections and questions using a drag-and-drop interface.

### React Patterns

- Use functional components with hooks
- Destructure props for readability
- Use `useCallback`, `useMemo`, `useEffect` appropriately
- Avoid inline function definitions in render when possible
- Extract static JSX outside component body
- Use ternary operators for conditionals, not `&&` for potentially falsy values

### Performance Guidelines

- **Code Splitting**: Use React.lazy() for heavy components (e.g., dnd-kit)
- **Avoid structuredClone**: Use targeted immutability patterns instead
- **Memoization**: Wrap expensive computations in useMemo, callbacks in useCallback
- **Empty States**: Always handle empty array cases in components

### Component Structure

Follow the feature-based directory structure:

```
src/
  features/
    forms/
      components/          # Componentes específicos de Forms
        builder/           # Árbol, inspector, editor de nodos y dependencias
        VersionModal.tsx
        VersionCard.tsx
        StatusBadge.tsx
        CloneFormDialog.tsx
      pages/               # Páginas/rutas
        ├── FormListPage.tsx
        ├── FormDetailPage.tsx
        ├── CreateFormPage.tsx
        ├── FormBuilderPage.tsx
        └── FormVersionViewPage.tsx
      hooks/               # Hooks específicos
      api/                 # Clientes API de la feature (forms, schema, lifecycle)
      model/               # Módulos puros del contrato v1
      builder/             # Store del builder aislado por ruta
  components/
    ui/                    # shadcn/ui components
  services/                # API calls compartidos (form.ts)
  types/                   # Tipos globales (form.ts)
  config/                  # env.ts (VITE_API_URL)
  lib/                     # Utilities
```

## Additional Notes

- API URL: `http://localhost:5165` por defecto, configurable con `VITE_API_URL` (ver `src/config/env.ts`)
- Path alias: `@/*` → `./src/*`
- React Query cache: Configure `gcTime` appropriately (default 5 min)
- Test files: Located in `tests/` directory, use Playwright
- Heavy components like dnd-kit should be lazy loaded with React.lazy
