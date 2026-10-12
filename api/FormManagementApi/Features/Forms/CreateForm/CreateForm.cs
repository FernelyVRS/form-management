using System.Text.Json;
using Carter;
using FormManagementApi.Data;
using FormManagementApi.Entities;
using FormManagementApi.Features.Forms.Shared.Problems;
using FormManagementApi.Features.Forms.Shared.Schema;

namespace FormManagementApi.Features.Forms.CreateForm;

public class CreateForm
{
    public record Response(Guid FormId, Guid VersionId, int Number);

    public class Endpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapPost("forms", async (HttpRequest request, AppDbContext context) =>
            {
                var result = await Handler(request, context);
                return result;
            })
                .WithTags("Form")
                .Produces<Response>(StatusCodes.Status201Created)
                .ProducesProblem(400);
        }
    }

    public static async Task<IResult> Handler(HttpRequest request, AppDbContext context)
    {
        JsonDocument body;
        try { body = await JsonDocument.ParseAsync(request.Body); }
        catch (JsonException) { return ApiProblems.Create(400, "invalid_request"); }
        using (body)
        {
            var root = body.RootElement;
            if (root.ValueKind != JsonValueKind.Object ||
                !root.TryGetProperty("name", out var nameToken) || nameToken.ValueKind != JsonValueKind.String ||
                string.IsNullOrWhiteSpace(nameToken.GetString()))
                return ApiProblems.Create(400, "invalid_request");
            if (root.TryGetProperty("description", out var descriptionToken) &&
                descriptionToken.ValueKind is not (JsonValueKind.String or JsonValueKind.Null))
                return ApiProblems.Create(400, "invalid_request");

            var name = nameToken.GetString()!;
            var description = descriptionToken.ValueKind == JsonValueKind.String
                ? descriptionToken.GetString()
                : null;

            var form = new Form
            {
                Name = name,
                Description = description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Forms.Add(form);

            var version = new FormVersion
            {
                Form = form,
                VersionNumber = 1,
                Status = "Draft",
                SchemaJson = FormSchemaSerializer.Serialize(new FormSchemaDocument { SchemaVersion = 1, Sections = [] }),
                CreatedAt = DateTime.UtcNow,
            };
            context.FormVersions.Add(version);

            await context.SaveChangesAsync();

            var response = new Response(
                FormId: form.Id,
                VersionId: version.Id,
                Number: version.VersionNumber);

            return Results.Created($"/forms/{response.FormId}", response);
        }
    }
}
