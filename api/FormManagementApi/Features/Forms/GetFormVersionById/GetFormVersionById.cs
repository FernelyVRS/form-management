using Carter;
using FormManagementApi.Data;
using FormManagementApi.Features.Forms.Shared.Problems;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.GetFormVersionById;

public class GetFormVersionById
{
    public record Response(
        Guid FormId,
        Guid VersionId,
        int Number,
        string Status,
        string RowVersion,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        Guid? DerivedFromVersionId);

    public class Endpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/forms/{formId}/versions/{versionId}", async (Guid formId, Guid versionId, AppDbContext context) =>
            {
                var result = await Handler(formId, versionId, context);
                return result;
            })
                .WithTags("Form")
                .Produces<Response>()
                .ProducesProblem(404);
        }
    }

    public static async Task<IResult> Handler(Guid formId, Guid versionId, AppDbContext context)
    {
        var version = await context.FormVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.FormId == formId && x.Id == versionId);

        if (version == null) return ApiProblems.Create(404, "version_not_found");

        return Results.Ok(new Response(
            version.FormId,
            version.Id,
            version.VersionNumber,
            version.Status,
            Convert.ToBase64String(version.RowVersion),
            DateTime.SpecifyKind(version.CreatedAt, DateTimeKind.Utc),
            version.UpdatedAt is { } updatedAt ? DateTime.SpecifyKind(updatedAt, DateTimeKind.Utc) : null,
            version.DerivedFromVersionId));
    }
}
