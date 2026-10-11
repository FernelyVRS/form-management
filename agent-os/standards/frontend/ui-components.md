# UI Components

Compose screens from the shared primitives in `src/components/ui/` and style them with Tailwind utilities.

- Reuse the shared Button, Card, Dialog, Form, Input, Select, Table, and Tabs primitives.
- Use `cn()` from `src/lib/utils.ts` when component classes must be merged.
- Use the theme variables defined in `src/styles/index.css` through semantic Tailwind utilities where available.
- Keep reusable primitive variants with the primitive instead of duplicating them in feature pages.

```tsx
<Button variant="outline" className={cn("w-full", className)}>
  Open
</Button>
```
