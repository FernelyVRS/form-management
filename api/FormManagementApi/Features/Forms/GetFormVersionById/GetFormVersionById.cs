using Carter;
using FormManagementApi.Data;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.GetFormVersionById;

public class GetFormVersionById
{
    public record Response(
        Guid Id,
        Guid FormId,
        Version Version,
        string Status,
        string SchemaJson,
        DateTime CreatedAt,
        Guid DerivedFromVersionId);

    public class Endpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/forms/{formId}/version/{id}", async (Guid id, Guid formId, AppDbContext context) =>
            {
                var result = await Handler(id, formId, context);
                return result;
            })
                .WithTags("Form")
                .Produces<Response>()
                .WithOpenApi();
        }
    }

    public static async Task<IResult> Handler(Guid id, Guid formId, AppDbContext context)
    {
        var result = await context.FormVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.FormId == formId && x.Id == id);
        
        return Results.Ok(result);
    }
}