# Plan de Migración - Arquitectura Basada en Features

## Objetivo

Reorganizar la estructura de carpetas del proyecto para seguir una arquitectura basada en features, manteniendo los componentes genéricos (shadcn/ui) separados de los específicos de Forms.

## Análisis Previo

### Archivos a mover

| # | Origen | Destino |
|---|--------|---------|
| 1 | `src/components/Table.tsx` | `src/features/forms/components/Table.tsx` |
| 2 | `src/components/TableRowActions.tsx` | `src/features/forms/components/TableRowActions.tsx` |
| 3 | `src/components/FormDialog.tsx` | `src/features/forms/components/FormDialog.tsx` |
| 4 | `src/hooks/useForms.ts` | `src/features/forms/hooks/useForms.ts` |

### Imports a actualizar

| Archivo | Cambio |
|---------|--------|
| `src/features/forms/pages/FormPage.tsx` | `import TableMod from "@/components/Table"` → `import TableMod from "@/features/forms/components/Table"` |
| | `import FormDialog from "@/components/FormDialog"` → `import FormDialog from "@/features/forms/components/FormDialog"` |
| `src/App.tsx` | `import { useFetchForm } from './hooks/useForms'` → `import { useFetchForm } from '@/features/forms/hooks/useForms'` |

## Componentes que se mantienen en su ubicación actual

Los siguientes componentes genéricos se quedan donde están:

- `src/components/ui/` - Componentes shadcn/ui (button, card, table, etc.)
- `src/components/dnd/` - Componentes de drag-and-drop
- `src/components/forms/` - Campos de tipos reutilizables (NumberTypeFields, SelectTypeFields, etc.)

## Estructura Final

```
src/
├── features/
│   └── forms/
│       ├── components/
│       │   ├── Question/
│       │   │   ├── QuestionForm.tsx
│       │   │   ├── CreateQuestion.tsx
│       │   │   ├── EditQuestion.tsx
│       │   │   └── DeleteQuestion.tsx
│       │   ├── Section/
│       │   │   ├── SectionForm.tsx
│       │   │   ├── CreateSection.tsx
│       │   │   ├── EditSection.tsx
│       │   │   └── DeleteSection.tsx
│       │   ├── VersionModal.tsx
│       │   ├── FormList.tsx
│       │   ├── FormDialog.tsx      ← MOVIDO
│       │   ├── Table.tsx           ← MOVIDO
│       │   └── TableRowActions.tsx ← MOVIDO
│       ├── pages/
│       │   ├── FormListPage.tsx
│       │   ├── FormDetailPage.tsx
│       │   ├── CreateFormPage.tsx
│       │   └── FormPage.tsx
│       └── hooks/
│           └── useForms.ts         ← MOVIDO
├── components/
│   ├── ui/                         ← QUEDA
│   ├── dnd/                        ← QUEDA
│   └── forms/                     ← QUEDA (campos genéricos)
├── store/
├── services/
├── types/
└── lib/
```

## Ejecución

Fecha: 2026-03-23

### Paso 1: Mover archivos

```bash
# Mover Table.tsx
mv src/components/Table.tsx src/features/forms/components/Table.tsx

# Mover TableRowActions.tsx
mv src/components/TableRowActions.tsx src/features/forms/components/TableRowActions.tsx

# Mover FormDialog.tsx
mv src/components/FormDialog.tsx src/features/forms/components/FormDialog.tsx

# Mover useForms.ts
mv src/hooks/useForms.ts src/features/forms/hooks/useForms.ts
```

### Paso 2: Actualizar imports

- `src/features/forms/pages/FormPage.tsx`
- `src/App.tsx`

### Paso 3: Verificar build

```bash
npm run build
```

## Notas

- Los componentes en `src/components/forms/` (NumberTypeFields, SelectTypeFields, etc.) se mantienen porque son campos de tipos genéricos reutilizables que podrían usarse en otras features futuras.
- Los paths absolutos con `@/` funcionan automáticamente sin cambios en tsconfig.json.