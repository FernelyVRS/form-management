# Naming Conventions

- Name React component files and component functions in `PascalCase`.
- Suffix route-level components with `Page`.
- Prefix hooks with `use`.
- Name Zustand hooks `use<Domain>Store`.
- Name backend feature folders and files after the use case, such as `GetForms` or `CreateForm`.
- Use positional `record` types for endpoint request and response DTOs.

```text
FormListPage.tsx
useForms.ts
useFormStructureStore
Features/Forms/GetForms/GetForms.cs
```
