# Frontend Feature Structure

Keep form-domain pages, components, and hooks under `src/features/forms/`.

```text
src/features/forms/
  pages/
  components/
    Question/
    Section/
  hooks/
```

- Put route-level form screens in `pages/`.
- Put form-specific UI and operations in `components/`.
- Group question and section operations in their respective subfolders.
- Keep reusable UI primitives in `src/components/ui/`.
- Keep reusable field controls in `src/components/forms/` and drag-and-drop building blocks in `src/components/dnd/`.
