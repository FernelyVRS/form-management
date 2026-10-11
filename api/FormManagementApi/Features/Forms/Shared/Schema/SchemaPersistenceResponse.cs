using System.Text.Json;
using FormManagementApi.Entities;

namespace FormManagementApi.Features.Forms.Shared.Schema;

public sealed record SchemaPersistenceResponse(
    Guid FormId, Guid VersionId, int Number, string Status,
    JsonElement Schema, string RowVersion, DateTime? UpdatedAt)
{
    public static SchemaPersistenceResponse From(FormVersion version, FormSchemaDocument schema)
    {
        using var json = JsonDocument.Parse(FormSchemaSerializer.Serialize(schema));
        return new(version.FormId, version.Id, version.VersionNumber, version.Status,
            json.RootElement.Clone(), Convert.ToBase64String(version.RowVersion),
            version.UpdatedAt is { } timestamp ? DateTime.SpecifyKind(timestamp, DateTimeKind.Utc) : null);
    }
}

public static class SchemaProblems
{
    public static IResult Create(int status, string code, IReadOnlyList<SchemaIssue>? issues = null)
    {
        var extensions = new Dictionary<string, object?> { ["code"] = code };
        if (issues != null) extensions["issues"] = issues;
        return Results.Problem(statusCode: status, title: code, extensions: extensions);
    }
}
