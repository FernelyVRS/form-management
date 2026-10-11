using System.Text.Json;
using Carter;
using FormManagementApi.Data;
using FormManagementApi.Features.Forms.Shared.Schema;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.UpdateFormVersionSchema;

public sealed class UpdateFormVersionSchema : ICarterModule
{
    public sealed record Request(JsonElement Schema, string RowVersion);

    public void AddRoutes(IEndpointRouteBuilder app) => app
        .MapPut("/forms/{formId:guid}/versions/{versionId:guid}/schema", Handle)
        .WithTags("Form schema")
        .WithSummary("Replace a Draft schema using its current RowVersion")
        .Accepts<Request>("application/json")
        .Produces<SchemaPersistenceResponse>()
        .ProducesProblem(400).ProducesProblem(404).ProducesProblem(409)
        .ProducesProblem(422).ProducesProblem(500);

    public static async Task<IResult> Handle(Guid formId, Guid versionId, HttpRequest request,
        AppDbContext context, CancellationToken cancellationToken)
    {
        JsonDocument body;
        try { body = await JsonDocument.ParseAsync(request.Body, cancellationToken: cancellationToken); }
        catch (JsonException) { return SchemaProblems.Create(400, "invalid_request"); }
        using (body)
        {
            var root = body.RootElement;
            if (root.ValueKind != JsonValueKind.Object || root.EnumerateObject().Count() != 2 ||
                !root.TryGetProperty("schema", out var schema) || !root.TryGetProperty("rowVersion", out var token) ||
                token.ValueKind != JsonValueKind.String)
                return SchemaProblems.Create(400, "invalid_request");

            byte[] rowVersion;
            try { rowVersion = Convert.FromBase64String(token.GetString()!); }
            catch (FormatException) { return SchemaProblems.Create(400, "invalid_request"); }
            if (rowVersion.Length != 8) return SchemaProblems.Create(400, "invalid_request");

            var version = await context.FormVersions.SingleOrDefaultAsync(
                item => item.FormId == formId && item.Id == versionId, cancellationToken);
            if (version == null) return SchemaProblems.Create(404, "version_not_found");
            if (version.Status != "Draft") return SchemaProblems.Create(409, "version_not_editable");
            if (!version.RowVersion.SequenceEqual(rowVersion)) return SchemaProblems.Create(409, "schema_conflict");

            FormSchemaDocument proposed;
            try { proposed = FormSchemaSerializer.Parse(schema.GetRawText()); }
            catch (FormSchemaException error) { return SchemaProblems.Create(422, "invalid_schema", error.Issues); }

            FormSchemaDocument baseline;
            FormSchemaDocument? source = null;
            try
            {
                baseline = FormSchemaSerializer.Parse(version.SchemaJson);
                if (version.DerivedFromVersionId is { } sourceId)
                {
                    var sourceJson = await context.FormVersions.AsNoTracking()
                        .Where(item => item.Id == sourceId).Select(item => item.SchemaJson).SingleOrDefaultAsync(cancellationToken);
                    if (sourceJson == null) return SchemaProblems.Create(500, "invalid_stored_schema");
                    source = FormSchemaSerializer.Parse(sourceJson);
                }
            }
            catch (FormSchemaException) { return SchemaProblems.Create(500, "invalid_stored_schema"); }

            var issues = SchemaIdentityValidator.Validate(baseline, proposed, source);
            if (issues.Count != 0) return SchemaProblems.Create(422, "invalid_schema", issues);

            context.Entry(version).Property(item => item.RowVersion).OriginalValue = rowVersion;
            version.SchemaJson = FormSchemaSerializer.Serialize(proposed);
            version.UpdatedAt = DateTime.UtcNow;
            // Force an accepted no-op schema replacement to generate a new concurrency token too.
            context.Entry(version).Property(item => item.UpdatedAt).IsModified = true;
            try { await context.SaveChangesAsync(cancellationToken); }
            catch (DbUpdateConcurrencyException) { return SchemaProblems.Create(409, "schema_conflict"); }
            return Results.Ok(SchemaPersistenceResponse.From(version, proposed));
        }
    }
}
