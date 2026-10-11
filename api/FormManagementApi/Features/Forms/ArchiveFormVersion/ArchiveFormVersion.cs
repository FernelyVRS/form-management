using System.Text.Json;
using Carter;
using FormManagementApi.Data;
using FormManagementApi.Features.Forms.Shared.Lifecycle;
using FormManagementApi.Features.Forms.Shared.Schema;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.ArchiveFormVersion;

public sealed class ArchiveFormVersion : ICarterModule
{
    public sealed record Request(string RowVersion);

    public void AddRoutes(IEndpointRouteBuilder app) => app
        .MapPost("/forms/{formId:guid}/versions/{versionId:guid}/archive", Handle)
        .WithTags("Form version lifecycle")
        .WithSummary("Archive a Draft version, preserving number, schema and provenance")
        .Accepts<Request>("application/json")
        .Produces<LifecycleVersionResponse>()
        .ProducesProblem(400).ProducesProblem(404).ProducesProblem(409);

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

        context.Entry(version).Property(item => item.RowVersion).OriginalValue = rowVersion!;
        version.Status = VersionStatus.Archived;
        version.UpdatedAt = DateTime.UtcNow;
        context.Entry(version).Property(item => item.UpdatedAt).IsModified = true;

        try { await context.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return LifecycleProblems.Create(409, "version_conflict"); }
        await transaction.CommitAsync(cancellationToken);

        return Results.Ok(LifecycleVersionResponse.From(version));
    }
}
