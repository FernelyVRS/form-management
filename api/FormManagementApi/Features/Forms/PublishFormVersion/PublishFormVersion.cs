using System.Text.Json;
using Carter;
using FormManagementApi.Data;
using FormManagementApi.Entities;
using FormManagementApi.Features.Forms.Shared.Lifecycle;
using FormManagementApi.Features.Forms.Shared.Schema;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.PublishFormVersion;

public sealed class PublishFormVersion : ICarterModule
{
    public sealed record Request(string RowVersion);

    public void AddRoutes(IEndpointRouteBuilder app) => app
        .MapPost("/forms/{formId:guid}/versions/{versionId:guid}/publish", Handle)
        .WithTags("Form version lifecycle")
        .WithSummary("Publish a Draft version, archiving any previous Published version atomically")
        .Accepts<Request>("application/json")
        .Produces<LifecycleVersionResponse>()
        .ProducesProblem(400).ProducesProblem(404).ProducesProblem(409)
        .ProducesProblem(422).ProducesProblem(500);

    public static async Task<IResult> Handle(Guid formId, Guid versionId, HttpRequest request,
        AppDbContext context, CancellationToken cancellationToken)
    {
        var (rowVersion, error) = await LifecycleCommands.ReadRowVersionAsync(request, cancellationToken);
        if (error != null) return error;

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        await LifecycleCommands.LockFormAsync(context, formId, cancellationToken);

        var version = await context.FormVersions.SingleOrDefaultAsync(
            item => item.FormId == formId && item.Id == versionId, cancellationToken);
        if (version == null) return LifecycleProblems.Create(404, "version_not_found");
        if (version.Status != VersionStatus.Draft)
            return LifecycleProblems.Create(409, "invalid_version_state");
        if (!version.RowVersion.SequenceEqual(rowVersion!))
            return LifecycleProblems.Create(409, "version_conflict");

        FormSchemaDocument document;
        try { document = FormSchemaSerializer.Parse(version.SchemaJson); }
        catch (FormSchemaException) { return LifecycleProblems.Create(500, "invalid_stored_schema"); }

        if (LifecycleCommands.CountQuestions(document) == 0)
            return LifecycleProblems.Create(422, "not_publishable");

        FormSchemaDocument? source = null;
        if (version.DerivedFromVersionId is { } sourceId)
        {
            var sourceJson = await context.FormVersions.AsNoTracking()
                .Where(item => item.Id == sourceId)
                .Select(item => item.SchemaJson)
                .SingleOrDefaultAsync(cancellationToken);
            if (sourceJson == null) return LifecycleProblems.Create(500, "invalid_stored_schema");
            try { source = FormSchemaSerializer.Parse(sourceJson); }
            catch (FormSchemaException) { return LifecycleProblems.Create(500, "invalid_stored_schema"); }
        }

        var identityIssues = SchemaIdentityValidator.Validate(document, document, source);
        if (identityIssues.Count != 0)
            return LifecycleProblems.Create(422, "schema_identity_violation");

        var previous = await context.FormVersions.SingleOrDefaultAsync(
            item => item.FormId == formId && item.Status == VersionStatus.Published, cancellationToken);

        var now = DateTime.UtcNow;
        Guid? archivedVersionId = null;
        if (previous != null)
        {
            previous.Status = VersionStatus.Archived;
            previous.UpdatedAt = now;
            archivedVersionId = previous.Id;
            // Save the archive first: the filtered unique index rejects any intermediate
            // state with two Published rows, and SaveChanges batch order follows key order.
            try { await context.SaveChangesAsync(cancellationToken); }
            catch (DbUpdateConcurrencyException) { return LifecycleProblems.Create(409, "version_conflict"); }
        }

        context.Entry(version).Property(item => item.RowVersion).OriginalValue = rowVersion!;
        version.Status = VersionStatus.Published;
        version.UpdatedAt = now;
        // Force token refresh even when values did not otherwise change.
        context.Entry(version).Property(item => item.UpdatedAt).IsModified = true;

        try { await context.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return LifecycleProblems.Create(409, "version_conflict"); }
        await transaction.CommitAsync(cancellationToken);

        return Results.Ok(LifecycleVersionResponse.From(version, archivedVersionId));
    }
}
