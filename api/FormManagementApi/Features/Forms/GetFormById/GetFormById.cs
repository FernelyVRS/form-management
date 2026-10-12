using Carter;
using FormManagementApi.Data;
using FormManagementApi.Features.Forms.Shared.Problems;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.GetFormById;

public class GetFormById
{
    public record Version(
        Guid Id,
        int Number,
        string Status,
        string RowVersion,
        DateTime CreatedAt,
        DateTime? UpdatedAt
    );

    public record Response(
        Guid Id,
        string Name,
        string? Description,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        IEnumerable<Version> Versions
    );

    public class Endpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/forms/{id}", async (Guid id, AppDbContext context) =>
            {
                var result = await Handler(id, context);
                return result;
            })
                .WithTags("Form")
                .Produces<Response>()
                .ProducesProblem(404);
        }
    }

    public static async Task<IResult> Handler(Guid id, AppDbContext context)
    {
        var form = await context.Forms
            .Where(x => x.Id == id)
            .Select(x =>
                new
                {
                    x.Id,
                    x.Name,
                    x.Description,
                    x.CreatedAt,
                    x.UpdatedAt,
                    Versions = x.FormVersions
                        .OrderBy(v => v.VersionNumber)
                        .Select(v => new
                        {
                            v.Id,
                            v.VersionNumber,
                            v.Status,
                            v.RowVersion,
                            v.CreatedAt,
                            v.UpdatedAt
                        })
                        .ToList()
                })
            .FirstOrDefaultAsync();

        if (form == null) return ApiProblems.Create(404, "form_not_found");

        return Results.Ok(new Response(
            form.Id,
            form.Name,
            form.Description,
            form.CreatedAt,
            form.UpdatedAt,
            form.Versions.Select(v =>
                new Version(
                    v.Id,
                    v.VersionNumber,
                    v.Status,
                    Convert.ToBase64String(v.RowVersion),
                    v.CreatedAt,
                    v.UpdatedAt))
            .ToList()));
    }
}
