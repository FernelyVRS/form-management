using System.Text.Json;
using FormManagementApi.Data;
using FormManagementApi.Entities;
using FormManagementApi.Features.Forms.Shared.Schema;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.Shared.Lifecycle;

public static class VersionStatus
{
    public const string Draft = "Draft";
    public const string Published = "Published";
    public const string Archived = "Archived";
}

public sealed record LifecycleVersionResponse(
    Guid FormId,
    Guid VersionId,
    int Number,
    string Status,
    Guid? DerivedFromVersionId,
    string RowVersion,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    Guid? ArchivedVersionId)
{
    public static LifecycleVersionResponse From(FormVersion version, Guid? archivedVersionId = null) =>
        new(
            version.FormId,
            version.Id,
            version.VersionNumber,
            version.Status,
            version.DerivedFromVersionId,
            Convert.ToBase64String(version.RowVersion),
            DateTime.SpecifyKind(version.CreatedAt, DateTimeKind.Utc),
            version.UpdatedAt is { } timestamp ? DateTime.SpecifyKind(timestamp, DateTimeKind.Utc) : null,
            archivedVersionId);
}

public static class LifecycleProblems
{
    public static IResult Create(int status, string code) =>
        Shared.Problems.ApiProblems.Create(status, code);
}

public static class LifecycleCommands
{
    public static async Task<(byte[]? RowVersion, IResult? Error)> ReadRowVersionAsync(
        HttpRequest request, CancellationToken cancellationToken)
    {
        JsonDocument body;
        try { body = await JsonDocument.ParseAsync(request.Body, cancellationToken: cancellationToken); }
        catch (JsonException) { return (null, LifecycleProblems.Create(400, "invalid_request")); }
        using (body)
        {
            var root = body.RootElement;
            if (root.ValueKind != JsonValueKind.Object || root.EnumerateObject().Count() != 1 ||
                !root.TryGetProperty("rowVersion", out var token) || token.ValueKind != JsonValueKind.String)
                return (null, LifecycleProblems.Create(400, "invalid_request"));

            byte[] rowVersion;
            try { rowVersion = Convert.FromBase64String(token.GetString()!); }
            catch (FormatException) { return (null, LifecycleProblems.Create(400, "invalid_request")); }
            if (rowVersion.Length != 8) return (null, LifecycleProblems.Create(400, "invalid_request"));
            return (rowVersion, null);
        }
    }

    public static async Task LockFormAsync(AppDbContext context, Guid formId, CancellationToken cancellationToken)
    {
        await context.Database.ExecuteSqlRawAsync(
            "SELECT TOP 1 [Id] FROM [dbo].[Forms] WITH (UPDLOCK, HOLDLOCK) WHERE [Id] = {0}",
            new object[] { formId }, cancellationToken);
    }

    public static async Task<int> NextVersionNumberAsync(AppDbContext context, Guid formId, CancellationToken cancellationToken)
    {
        var latest = await context.FormVersions
            .Where(version => version.FormId == formId)
            .MaxAsync(version => (int?)version.VersionNumber, cancellationToken);
        return latest is { } number ? number + 1 : 1;
    }

    public static int CountQuestions(FormSchemaDocument document) =>
        document.Sections.Sum(section => section.Items.Sum(item => item switch
        {
            GroupNode group => group.Items.Count,
            FieldNode => 1,
            _ => 0
        }));

    public static FormSchemaDocument CopySchema(FormSchemaDocument document) =>
        FormSchemaSerializer.Parse(FormSchemaSerializer.Serialize(document));

    public static string SerializeCopy(FormSchemaDocument document) =>
        FormSchemaSerializer.Serialize(CopySchema(document));
}
