using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Nodes;
using FormManagementApi.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace FormManagementApi.Tests;

public sealed class SchemaPersistenceTests
{
    private static string Route(FormVersion version) => $"/forms/{version.FormId}/versions/{version.Id}/schema";
    private static string Token(FormVersion version) => Convert.ToBase64String(version.RowVersion);
    private static JsonObject Body(string schema, string token) => new() { ["schema"] = JsonNode.Parse(schema), ["rowVersion"] = token };
    private static async Task<JsonNode> Json(HttpResponseMessage response) => JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
    private static async Task AssertProblem(HttpResponseMessage response, int status, string code)
    {
        Assert.Equal(status, (int)response.StatusCode);
        Assert.Equal(code, (await Json(response))["code"]!.GetValue<string>());
    }
    private static async Task AssertUnchanged(SqlSchemaTestHost host, FormVersion before)
    {
        await using var context = host.Context();
        var after = await context.FormVersions.AsNoTracking().SingleAsync(item => item.Id == before.Id);
        Assert.Equal(before.SchemaJson, after.SchemaJson);
        Assert.Equal(before.UpdatedAt, after.UpdatedAt);
        Assert.Equal(before.RowVersion, after.RowVersion);
    }

    [SqlFact]
    public async Task MigrationConvertsOnlyPlaceholdersAndIsRepeatable()
    {
        await using var host = await SqlSchemaTestHost.Create(migrate: false);
        var formId = Guid.NewGuid();
        var versionId = Guid.NewGuid();
        await host.Execute("INSERT dbo.Forms(Id,Name) VALUES(@form,N'Migration test'); INSERT dbo.FormVersions(Id,FormId,VersionNumber,Status,SchemaJson) VALUES(@version,@form,1,N'Draft',N'{}');",
            new SqlParameter("@form", formId), new SqlParameter("@version", versionId));
        await host.Execute(SqlSchemaTestHost.Migration);
        await using var context = host.Context();
        var version = await context.FormVersions.AsNoTracking().SingleAsync();
        Assert.Equal(versionId, version.Id);
        Assert.Equal(formId, version.FormId);
        Assert.Equal(1, version.VersionNumber);
        Assert.Equal("Draft", version.Status);
        Assert.Null(version.DerivedFromVersionId);
        Assert.Equal(SqlSchemaTestHost.Empty, version.SchemaJson);
        Assert.Equal(8, version.RowVersion.Length);
        await host.Execute(SqlSchemaTestHost.Migration);
        await AssertUnchanged(host, version);
    }

    [SqlFact]
    public async Task MigrationRefusesUnexpectedSchemasWithoutPartialDdlOrConversion()
    {
        await using var host = await SqlSchemaTestHost.Create(migrate: false);
        await host.Execute("INSERT dbo.Forms(Name) VALUES(N'Unexpected'); DECLARE @id uniqueidentifier = (SELECT TOP(1) Id FROM dbo.Forms); INSERT dbo.FormVersions(FormId,VersionNumber,Status,SchemaJson) VALUES(@id,1,N'Draft',N'{}'),(@id,2,N'Draft',N'[{\"titulo\":\"legacy\"}]');");
        await Assert.ThrowsAsync<SqlException>(() => host.Execute(SqlSchemaTestHost.Migration));
        Assert.Equal(1, Convert.ToInt32(await host.Scalar("SELECT COUNT(*) FROM dbo.FormVersions WHERE SchemaJson=N'{}'")));
        Assert.Equal(DBNull.Value, await host.Scalar("SELECT COL_LENGTH(N'dbo.FormVersions',N'RowVersion')"));
        Assert.Equal(0, Convert.ToInt32(await host.Scalar("SELECT COUNT(*) FROM sys.check_constraints WHERE name=N'CK_FormVersions_SchemaV1'")));
    }

    [SqlFact]
    public async Task MigrationRollsBackConversionWhenDdlFailsAfterUpdate()
    {
        await using var host = await SqlSchemaTestHost.Create(migrate: false);
        await host.Execute("INSERT dbo.Forms(Name) VALUES(N'Rollback'); DECLARE @id uniqueidentifier=(SELECT TOP(1) Id FROM dbo.Forms); INSERT dbo.FormVersions(FormId,VersionNumber,Status,SchemaJson) VALUES(@id,1,N'Draft',N'{}'); ALTER TABLE dbo.FormVersions ADD OtherVersion rowversion NOT NULL;");
        // SQL Server permits only one rowversion column, so the planned ADD fails after normalization.
        await Assert.ThrowsAsync<SqlException>(() => host.Execute(SqlSchemaTestHost.Migration));
        Assert.Equal("{}", await host.Scalar("SELECT SchemaJson FROM dbo.FormVersions"));
        Assert.Equal(DBNull.Value, await host.Scalar("SELECT COL_LENGTH(N'dbo.FormVersions',N'RowVersion')"));
        Assert.Equal(0, Convert.ToInt32(await host.Scalar("SELECT COUNT(*) FROM sys.check_constraints WHERE name=N'CK_FormVersions_SchemaV1'")));
    }

    [SqlFact]
    public async Task DatabaseConstraintRejectsInvalidEnvelopeAndMigrationRejectsIncompatibleObjects()
    {
        await using var host = await SqlSchemaTestHost.Create();
        var version = await host.Seed();
        foreach (var invalid in new[] { "not JSON", "[]", "{}", "{\"schemaVersion\":1}", "{\"schemaVersion\":2,\"sections\":[]}", "{\"schemaVersion\":1,\"sections\":{}}" })
            await Assert.ThrowsAsync<SqlException>(() => host.Execute("UPDATE dbo.FormVersions SET SchemaJson=@json WHERE Id=@id",
                new SqlParameter("@json", invalid), new SqlParameter("@id", version.Id)));
        await AssertUnchanged(host, version);
        await host.Execute("ALTER TABLE dbo.FormVersions DROP CONSTRAINT CK_FormVersions_SchemaV1; ALTER TABLE dbo.FormVersions ADD CONSTRAINT CK_FormVersions_SchemaV1 CHECK (ISJSON(SchemaJson)=1);");
        await Assert.ThrowsAsync<SqlException>(() => host.Execute(SqlSchemaTestHost.Migration));
    }

    [SqlFact]
    public async Task CreateAndGetReturnCanonicalDocumentsAndCorrectLocation()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var created = await client.PostAsJsonAsync("/forms", new { nombre = "New canonical form", descripcion = "Test" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var metadata = await Json(created);
        var formId = metadata["formId"]!.GetValue<string>();
        var versionId = metadata["versionId"]!.GetValue<string>();
        Assert.Equal($"/forms/{formId}", created.Headers.Location!.ToString());
        var get = await client.GetAsync($"/forms/{formId}/versions/{versionId}/schema");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var response = await Json(get);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(SqlSchemaTestHost.Empty), response["schema"]));
        Assert.Equal(8, Convert.FromBase64String(response["rowVersion"]!.GetValue<string>()).Length);
        Assert.Equal("Draft", response["status"]!.GetValue<string>());
        Assert.Null(response["updatedAt"]);
        Assert.False(response.AsObject().ContainsKey("schemaJson"));
    }

    [SqlFact]
    public async Task MissingAndForeignVersionsAreNotFoundForReadsAndWrites()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var version = await host.Seed();
        var foreign = $"/forms/{Guid.NewGuid()}/versions/{version.Id}/schema";
        await AssertProblem(await client.GetAsync(foreign), 404, "version_not_found");
        await AssertProblem(await client.PutAsJsonAsync(foreign, Body(SqlSchemaTestHost.Empty, Token(version))), 404, "version_not_found");
        await AssertProblem(await client.GetAsync($"/forms/{version.FormId}/versions/{Guid.NewGuid()}/schema"), 404, "version_not_found");
        await AssertUnchanged(host, version);
    }

    [SqlFact]
    public async Task CompleteSchemaRoundTripsAndOldTokensCannotOverwriteIt()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var version = await host.Seed();
        var saved = await client.PutAsJsonAsync(Route(version), Body(SqlSchemaTestHost.Complete, Token(version)));
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var response = await Json(saved);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(SqlSchemaTestHost.Complete), response["schema"]));
        Assert.NotEqual(Token(version), response["rowVersion"]!.GetValue<string>());
        Assert.EndsWith("Z", response["updatedAt"]!.GetValue<string>());
        var read = await Json(await client.GetAsync(Route(version)));
        Assert.True(JsonNode.DeepEquals(response, read));
        await AssertProblem(await client.PutAsJsonAsync(Route(version), Body(SqlSchemaTestHost.Empty, Token(version))), 409, "schema_conflict");
        Assert.True(JsonNode.DeepEquals(response, await Json(await client.GetAsync(Route(version)))));
    }

    [SqlFact]
    public async Task InvalidBodiesAndSchemaDocumentsNeverChangeRecords()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var version = await host.Seed();
        foreach (var body in new[] { "{", "{}", "null", "[]", "{\"schema\":{}}", "{\"schema\":{},\"rowVersion\":null}" })
            await AssertProblem(await client.PutAsync(Route(version), new StringContent(body, Encoding.UTF8, "application/json")), 400, "invalid_request");
        foreach (var token in new[] { "not-base64", "", "AQ==" })
            await AssertProblem(await client.PutAsJsonAsync(Route(version), Body(SqlSchemaTestHost.Empty, token)), 400, "invalid_request");
        var extra = Body(SqlSchemaTestHost.Empty, Token(version));
        extra["unknown"] = true;
        await AssertProblem(await client.PutAsJsonAsync(Route(version), extra), 400, "invalid_request");
        foreach (var invalid in new[] { "{}", "[]", "{\"schemaVersion\":2,\"sections\":[]}" })
        {
            var result = await client.PutAsJsonAsync(Route(version), Body(invalid, Token(version)));
            await AssertProblem(result, 422, "invalid_schema");
            Assert.NotEmpty((await Json(result))["issues"]!.AsArray());
        }
        var broken = JsonNode.Parse(SqlSchemaTestHost.Complete)!;
        broken["sections"]![0]!["items"]![0]!["dependency"]!["field"] = "Missing";
        await AssertProblem(await client.PutAsJsonAsync(Route(version), Body(broken.ToJsonString(), Token(version))), 422, "invalid_schema");
        broken = JsonNode.Parse(SqlSchemaTestHost.Complete)!;
        broken["sections"]![0]!["items"]![0]!["map"]!["unknown"] = new JsonArray();
        await AssertProblem(await client.PutAsJsonAsync(Route(version), Body(broken.ToJsonString(), Token(version))), 422, "invalid_schema");
        await AssertUnchanged(host, version);
    }

    [SqlFact]
    public async Task ImmutableStatusesAndCorruptBaselinesFailWithoutChanges()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        foreach (var status in new[] { "Published", "Archived" })
        {
            var version = await host.Seed(status: status);
            await AssertProblem(await client.PutAsJsonAsync(Route(version), Body(SqlSchemaTestHost.Complete, Token(version))), 409, "version_not_editable");
            await AssertUnchanged(host, version);
        }
        var corrupt = await host.Seed("{\"schemaVersion\":1,\"sections\":[{}]}");
        await AssertProblem(await client.GetAsync(Route(corrupt)), 500, "invalid_stored_schema");
        await AssertProblem(await client.PutAsJsonAsync(Route(corrupt), Body(SqlSchemaTestHost.Empty, Token(corrupt))), 500, "invalid_stored_schema");
        await AssertUnchanged(host, corrupt);
        var derived = await host.Seed(sourceId: corrupt.Id);
        await AssertProblem(await client.PutAsJsonAsync(Route(derived), Body(SqlSchemaTestHost.Empty, Token(derived))), 500, "invalid_stored_schema");
        await AssertUnchanged(host, derived);
    }

    [SqlFact]
    public async Task VariablesAndDerivedCoreFieldsArePreservedIncludingGroupMoves()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var source = await host.Seed(SqlSchemaTestHost.Complete, "Published");
        var derived = await host.Seed(SqlSchemaTestHost.Complete, sourceId: source.Id);
        var renamed = JsonNode.Parse(SqlSchemaTestHost.Complete)!;
        renamed["sections"]![0]!["items"]![1]!["items"]![0]!["variable"] = "Renamed";
        await AssertProblem(await client.PutAsJsonAsync(Route(derived), Body(renamed.ToJsonString(), Token(derived))), 422, "invalid_schema");
        await AssertProblem(await client.PutAsJsonAsync(Route(derived), Body(SqlSchemaTestHost.Empty, Token(derived))), 422, "invalid_schema");
        var unprotected = JsonNode.Parse(SqlSchemaTestHost.Complete)!;
        unprotected["sections"]![0]!["items"]![1]!["items"]![0]!["core"] = false;
        await AssertProblem(await client.PutAsJsonAsync(Route(derived), Body(unprotected.ToJsonString(), Token(derived))), 422, "invalid_schema");
        await AssertUnchanged(host, derived);
        var moved = JsonNode.Parse(SqlSchemaTestHost.Complete)!;
        var children = moved["sections"]![0]!["items"]![1]!["items"]!.AsArray();
        var field = children[0]!.DeepClone();
        children.RemoveAt(0);
        for (var index = 0; index < children.Count; index++) children[index]!["order"] = index + 1;
        var destination = moved["sections"]![1]!["items"]!.AsArray();
        field["order"] = destination.Count + 1;
        destination.Add(field);
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync(Route(derived), Body(moved.ToJsonString(), Token(derived)))).StatusCode);
    }

    [SqlFact]
    public async Task DatabaseUpdateBetweenLoadAndSaveReturnsConflict()
    {
        var race = new ConcurrentWriteInterceptor();
        await using var host = await SqlSchemaTestHost.Create(interceptor: race);
        using var client = host.Client;
        var version = await host.Seed();
        race.Write = () => host.Execute("UPDATE dbo.FormVersions SET SchemaJson=@json WHERE Id=@id",
            new SqlParameter("@json", SqlSchemaTestHost.Complete), new SqlParameter("@id", version.Id));
        await AssertProblem(await client.PutAsJsonAsync(Route(version), Body(SqlSchemaTestHost.Empty, Token(version))), 409, "schema_conflict");
        await using var context = host.Context();
        var winner = await context.FormVersions.AsNoTracking().SingleAsync(item => item.Id == version.Id);
        Assert.Equal(SqlSchemaTestHost.Complete, winner.SchemaJson);
        Assert.Null(winner.UpdatedAt);
        Assert.NotEqual(Token(version), Token(winner));
    }

    private sealed class ConcurrentWriteInterceptor : SaveChangesInterceptor
    {
        public Func<Task>? Write { get; set; }
        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data,
            InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (Write != null)
            {
                var write = Write;
                Write = null;
                await write();
            }
            return result;
        }
    }
}
