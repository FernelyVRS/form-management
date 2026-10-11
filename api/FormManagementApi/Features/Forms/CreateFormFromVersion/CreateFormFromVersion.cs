using System.Text.Json;
using Carter;
using FormManagementApi.Data;
using FormManagementApi.Entities;
using FormManagementApi.Features.Forms.Shared.Lifecycle;
using FormManagementApi.Features.Forms.Shared.Schema;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.CreateFormFromVersion;

public sealed class CreateFormFromVersion : ICarterModule
{
    public sealed record Request(string Name, string? Description, Guid SourceFormId, Guid SourceVersionId);

    public void AddRoutes(IEndpointRouteBuilder app) => app
        .MapPost("/forms/from-version", Handle)
        .WithTags("Form version lifecycle")
        .WithSummary("Create a new form with a Draft version cloned from a Published or Archived version")
        .Accepts<Request>("application/json")
        .Produces<LifecycleVersionResponse>(StatusCodes.Status201Created)
        .ProducesProblem(400).ProducesProblem(404).ProducesProblem(409).ProducesProblem(500);

    public static async Task<IResult> Handle(HttpRequest request, AppDbContext context,
        CancellationToken cancellationToken)
    {
        JsonDocument body;
        try { body = await JsonDocument.ParseAsync(request.Body, cancellationToken: cancellationToken); }
        catch (JsonException) { return LifecycleProblems.Create(400, "invalid_request"); }
        using (body)
        {
            var root = body.RootElement;
            if (root.ValueKind != JsonValueKind.Object || root.EnumerateObject().Count() != 4 ||
                !root.TryGetProperty("name", out var nameToken) || nameToken.ValueKind != JsonValueKind.String ||
                !root.TryGetProperty("description", out var descriptionToken) ||
                (descriptionToken.ValueKind != JsonValueKind.String && descriptionToken.ValueKind != JsonValueKind.Null) ||
                !root.TryGetProperty("sourceFormId", out var formToken) || formToken.ValueKind != JsonValueKind.String ||
                !Guid.TryParse(formToken.GetString(), out var sourceFormId) ||
                !root.TryGetProperty("sourceVersionId", out var versionToken) || versionToken.ValueKind != JsonValueKind.String ||
                !Guid.TryParse(versionToken.GetString(), out var sourceVersionId))
                return LifecycleProblems.Create(400, "invalid_request");

            var name = nameToken.GetString()!.Trim();
            if (name.Length == 0 || name.Length > 200)
                return LifecycleProblems.Create(400, "invalid_request");
            var description = descriptionToken.ValueKind == JsonValueKind.Null
                ? null
                : descriptionToken.GetString()!.Trim();
            if (description is { Length: > 500 })
                return LifecycleProblems.Create(400, "invalid_request");

            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            await LifecycleCommands.LockFormAsync(context, sourceFormId, cancellationToken);

            var sourceForm = await context.Forms.AsNoTracking()
                .SingleOrDefaultAsync(form => form.Id == sourceFormId, cancellationToken);
            if (sourceForm == null) return LifecycleProblems.Create(404, "form_not_found");

            var sourceVersion = await context.FormVersions.AsNoTracking().SingleOrDefaultAsync(
                version => version.FormId == sourceFormId && version.Id == sourceVersionId, cancellationToken);
            if (sourceVersion == null) return LifecycleProblems.Create(404, "version_not_found");
            if (sourceVersion.Status is not (VersionStatus.Published or VersionStatus.Archived))
                return LifecycleProblems.Create(409, "invalid_version_state");

            FormSchemaDocument sourceDocument;
            try { sourceDocument = FormSchemaSerializer.Parse(sourceVersion.SchemaJson); }
            catch (FormSchemaException) { return LifecycleProblems.Create(500, "invalid_stored_schema"); }

            string schemaJson;
            try { schemaJson = LifecycleCommands.SerializeCopy(sourceDocument); }
            catch (FormSchemaException) { return LifecycleProblems.Create(500, "invalid_stored_schema"); }

            var form = new Form
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SourceFormId = sourceFormId,
                SourceVersionId = sourceVersionId
            };
            var version = new FormVersion
            {
                Id = Guid.NewGuid(),
                Form = form,
                VersionNumber = 1,
                Status = VersionStatus.Draft,
                SchemaJson = schemaJson,
                DerivedFromVersionId = sourceVersionId,
                CreatedAt = DateTime.UtcNow
            };
            context.Forms.Add(form);
            context.FormVersions.Add(version);

            try { await context.SaveChangesAsync(cancellationToken); }
            catch (DbUpdateConcurrencyException) { return LifecycleProblems.Create(409, "version_conflict"); }
            await transaction.CommitAsync(cancellationToken);

            return Results.Created($"/forms/{form.Id}", LifecycleVersionResponse.From(version));
        }
    }
}
