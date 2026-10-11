using Carter;
using FormManagementApi.Data;
using FormManagementApi.Features.Forms.Shared.Schema;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.GetFormVersionSchema;

public sealed class GetFormVersionSchema : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app) => app
        .MapGet("/forms/{formId:guid}/versions/{versionId:guid}/schema", Handle)
        .WithTags("Form schema")
        .WithSummary("Read a validated v1 document and its concurrency token")
        .Produces<SchemaPersistenceResponse>()
        .ProducesProblem(404)
        .ProducesProblem(500);

    public static async Task<IResult> Handle(Guid formId, Guid versionId, AppDbContext context, CancellationToken cancellationToken)
    {
        var version = await context.FormVersions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.FormId == formId && item.Id == versionId, cancellationToken);
        if (version == null) return SchemaProblems.Create(404, "version_not_found");
        try
        {
            return Results.Ok(SchemaPersistenceResponse.From(version, FormSchemaSerializer.Parse(version.SchemaJson)));
        }
        catch (FormSchemaException)
        {
            return SchemaProblems.Create(500, "invalid_stored_schema");
        }
    }
}
