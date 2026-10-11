# EF Core Access

Access persistence directly through `AppDbContext` in endpoint handlers.

- Use EF Core async APIs for database reads and writes.
- Keep entity mapping in `AppDbContext.OnModelCreating` with Fluent API.
- Model relationships with entity navigation properties and matching Fluent configuration.

```csharp
var form = await context.Forms
    .FirstOrDefaultAsync(form => form.Id == id);
```
