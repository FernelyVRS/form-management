# Carter Vertical Slices

Organize each API use case as one slice under `Features/Forms/<UseCase>/`.

- Keep the request/response records, Carter module, route mapping, and handler in the slice file.
- Define an `Endpoint : ICarterModule` class with `AddRoutes`.
- Keep route lambdas small and delegate work to a static async `Handler`.
- Register modules centrally with `AddCarter()` and `MapCarter()`.
- Add `.WithTags("Form")`, `.Produces<T>()`, and `.WithOpenApi()` to implemented routes.

```csharp
public class Endpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/forms", async (AppDbContext context) =>
                await Handler(context))
            .WithTags("Form")
            .Produces<Response[]>()
            .WithOpenApi();
    }
}
```
