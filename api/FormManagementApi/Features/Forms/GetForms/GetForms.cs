using Carter;
using FormManagementApi.Data;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.GetForms;

public class GetForms
{
    public record Response(
        Guid Id,
        string Name,
        string? Description,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        int TotalVersions,
        int LatestVersion,
        Guid LatestVersionId);

    public class Endpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/forms", async (AppDbContext context) =>
            {
                var result = await Handler(context);
                return result;
            })
                .WithTags("Form")
                .Produces<List<Response>>();
        }
    }

    public static async Task<IResult> Handler(AppDbContext context)
    {
        var forms = await context.Forms
            .OrderByDescending(y => y.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.CreatedAt,
                x.UpdatedAt,
                TotalVersions = x.FormVersions.Count,
                Latest = x.FormVersions
                    .OrderByDescending(v => v.VersionNumber)
                    .Select(v => new { v.VersionNumber, v.Id })
                    .FirstOrDefault()
            })
            .ToListAsync();

        var result = forms.Select(x => new Response(
            x.Id,
            x.Name,
            x.Description,
            DateTime.SpecifyKind(x.CreatedAt, DateTimeKind.Utc),
            x.UpdatedAt is { } updatedAt ? DateTime.SpecifyKind(updatedAt, DateTimeKind.Utc) : null,
            x.TotalVersions,
            x.Latest?.VersionNumber ?? 0,
            x.Latest?.Id ?? Guid.Empty))
            .ToList();

        return Results.Ok(result);
    }
}
