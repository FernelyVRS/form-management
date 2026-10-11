using System.Text.Json;
using Carter;
using FormManagementApi.Data;
using FormManagementApi.Entities;
using FormManagementApi.Features.Forms.Shared.Lifecycle;
using FormManagementApi.Features.Forms.Shared.Schema;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.CreateFormVersion;

public sealed class CreateFormVersion : ICarterModule
{
    public sealed record Request(Guid SourceVersionId);

    public void AddRoutes(IEndpointRouteBuilder app) => app
        .MapPost("/forms/{formId:guid}/versions", Handle)
        .WithTags("Form version lifecycle")
        .WithSummary("Create a Draft version derived from a Published or Archived version of the same form")
        .Accepts<Request>("application/json")
        .Produces<LifecycleVersionResponse>(StatusCodes.Status201Created)
        .ProducesProblem(400).ProducesProblem(404).ProducesProblem(409).ProducesProblem(500);

    public static async Task<IResult> Handle(Guid formId, HttpRequest request, AppDbContext context,
        CancellationToken cancellationToken)
    {
        JsonDocument body;
        try { body = await JsonDocument.ParseAsync(request.Body, cancellationToken: cancellationToken); }
        catch (JsonException) { return LifecycleProblems.Create(400, "invalid_request"); }
        using (body)
        {
            var root = body.RootElement;
            if (root.ValueKind != JsonValueKind.Object || root.EnumerateObject().Count() != 1 ||
                !root.TryGetProperty("sourceVersionId", out var sourceToken) ||
                sourceToken.ValueKind != JsonValueKind.String ||
                !Guid.TryParse(sourceToken.GetString(), out var sourceVersionId))
                return LifecycleProblems.Create(400, "invalid_request");

            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            await LifecycleCommands.LockFormAsync(context, formId, cancellationToken);

            var source = await context.FormVersions.AsNoTracking().SingleOrDefaultAsync(
                version => version.FormId == formId && version.Id == sourceVersionId, cancellationToken);
            if (source == null) return LifecycleProblems.Create(404, "version_not_found");
            if (source.Status == VersionStatus.Draft)
                return LifecycleProblems.Create(409, "invalid_version_state");

            var hasDraft = await context.FormVersions.AsNoTracking().AnyAsync(
                version => version.FormId == formId && version.Status == VersionStatus.Draft, cancellationToken);
            if (hasDraft) return LifecycleProblems.Create(409, "invalid_version_state");

            FormSchemaDocument sourceDocument;
            try { sourceDocument = FormSchemaSerializer.Parse(source.SchemaJson); }
            catch (FormSchemaException) { return LifecycleProblems.Create(500, "invalid_stored_schema"); }

            string schemaJson;
            try { schemaJson = LifecycleCommands.SerializeCopy(sourceDocument); }
            catch (FormSchemaException) { return LifecycleProblems.Create(500, "invalid_stored_schema"); }

            var version = new FormVersion
            {
                Id = Guid.NewGuid(),
                FormId = formId,
                VersionNumber = await LifecycleCommands.NextVersionNumberAsync(context, formId, cancellationToken),
                Status = VersionStatus.Draft,
                SchemaJson = schemaJson,
                DerivedFromVersionId = source.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.FormVersions.Add(version);

            try { await context.SaveChangesAsync(cancellationToken); }
            catch (DbUpdateConcurrencyException) { return LifecycleProblems.Create(409, "version_conflict"); }
            await transaction.CommitAsync(cancellationToken);

            return Results.Created($"/forms/{formId}", LifecycleVersionResponse.From(version));
        }
    }
}
