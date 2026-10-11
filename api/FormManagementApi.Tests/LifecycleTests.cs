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

public sealed class LifecycleTests
{
    private const string GroupOnlySchema =
        """
        {
          "schemaVersion": 1,
          "sections": [
            {
              "id": "seccion_unica", "type": "section", "title": "Seccion", "entity": "Demo", "order": 1,
              "items": [
                {
                  "id": "grupo_unico", "type": "group", "label": "Grupo", "order": 1,
                  "items": [
                    { "id": "campo_grupo", "type": "field", "component": "text", "variable": "CampoGrupo", "label": "Campo", "order": 1, "core": false }
                  ]
                }
              ]
            }
          ]
        }
        """;

    private static string DeriveRoute(FormVersion version) => $"/forms/{version.FormId}/versions";
    private static string PublishRoute(FormVersion version) => $"/forms/{version.FormId}/versions/{version.Id}/publish";
    private static string ArchiveRoute(FormVersion version) => $"/forms/{version.FormId}/versions/{version.Id}/archive";
    private static string SchemaRoute(FormVersion version) => $"/forms/{version.FormId}/versions/{version.Id}/schema";
    private static string Token(FormVersion version) => Convert.ToBase64String(version.RowVersion);
    private static JsonObject RowVersionBody(FormVersion version) => new() { ["rowVersion"] = Token(version) };
    private static async Task<JsonNode> Json(HttpResponseMessage response) =>
        JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
    private static async Task AssertProblem(HttpResponseMessage response, int status, string code)
    {
        Assert.Equal(status, (int)response.StatusCode);
        Assert.Equal(code, (await Json(response))["code"]!.GetValue<string>());
    }
    private static async Task<FormVersion> Reload(SqlSchemaTestHost host, FormVersion version)
    {
        await using var context = host.Context();
        return await context.FormVersions.AsNoTracking().SingleAsync(item => item.Id == version.Id);
    }
    private static async Task<FormVersion> ReloadById(SqlSchemaTestHost host, Guid versionId)
    {
        await using var context = host.Context();
        return await context.FormVersions.AsNoTracking().SingleAsync(item => item.Id == versionId);
    }
    private static async Task AssertUnchanged(SqlSchemaTestHost host, FormVersion before)
    {
        var after = await Reload(host, before);
        Assert.Equal(before.Status, after.Status);
        Assert.Equal(before.SchemaJson, after.SchemaJson);
        Assert.Equal(before.UpdatedAt, after.UpdatedAt);
        Assert.Equal(before.RowVersion, after.RowVersion);
    }

    [SqlFact]
    public async Task Migration002AppliesIdempotentlyOnCleanData()
    {
        await using var host = await SqlSchemaTestHost.Create();
        var version = await host.Seed();
        await host.Execute(SqlSchemaTestHost.LifecycleMigration);
        await host.Execute(SqlSchemaTestHost.LifecycleMigration);
        Assert.Equal(2, Convert.ToInt32(await host.Scalar(
            "SELECT COUNT(*) FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.FormVersions') AND name IN (N'UX_FormVersions_Draft', N'UX_FormVersions_Published') AND is_unique=1 AND has_filter=1")));
        Assert.Equal(1, Convert.ToInt32(await host.Scalar(
            "SELECT COUNT(*) FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.FormVersions') AND name=N'CK_FormVersions_VersionNumberPositive'")));
        Assert.NotNull(await host.Scalar("SELECT COL_LENGTH(N'dbo.Forms',N'SourceFormId')"));
        Assert.NotNull(await host.Scalar("SELECT COL_LENGTH(N'dbo.Forms',N'SourceVersionId')"));
        await AssertUnchanged(host, version);
    }

    [SqlFact]
    public async Task Migration002AbortsOnConflictsWithoutPartialDdl()
    {
        await using var duplicates = await SqlSchemaTestHost.Create(migrate: false);
        var duplicateForm = Guid.NewGuid();
        await duplicates.Execute(
            "INSERT dbo.Forms(Id,Name) VALUES(@form,N'Dupes'); INSERT dbo.FormVersions(Id,FormId,VersionNumber,Status,SchemaJson) VALUES(NEWID(),@form,1,N'Draft',@json),(NEWID(),@form,2,N'Draft',@json);",
            new SqlParameter("@form", duplicateForm), new SqlParameter("@json", SqlSchemaTestHost.Empty));
        await Assert.ThrowsAsync<SqlException>(() => duplicates.Execute(SqlSchemaTestHost.LifecycleMigration));
        Assert.Equal(DBNull.Value, await duplicates.Scalar("SELECT COL_LENGTH(N'dbo.Forms',N'SourceFormId')"));

        await using var badNumbers = await SqlSchemaTestHost.Create(migrate: false);
        await badNumbers.Execute("INSERT dbo.Forms(Name) VALUES(N'BadNumbers'); DECLARE @id uniqueidentifier=(SELECT TOP(1) Id FROM dbo.Forms); INSERT dbo.FormVersions(FormId,VersionNumber,Status,SchemaJson) VALUES(@id,0,N'Draft',@json);",
            new SqlParameter("@json", SqlSchemaTestHost.Empty));
        await Assert.ThrowsAsync<SqlException>(() => badNumbers.Execute(SqlSchemaTestHost.LifecycleMigration));
        Assert.Equal(DBNull.Value, await badNumbers.Scalar("SELECT COL_LENGTH(N'dbo.Forms',N'SourceFormId')"));

        await using var incompatible = await SqlSchemaTestHost.Create(migrate: false);
        await incompatible.Execute("INSERT dbo.Forms(Name) VALUES(N'Incompatible'); DECLARE @id uniqueidentifier=(SELECT TOP(1) Id FROM dbo.Forms); INSERT dbo.FormVersions(FormId,VersionNumber,Status,SchemaJson) VALUES(@id,1,N'Draft',@json); CREATE NONCLUSTERED INDEX UX_FormVersions_Draft ON dbo.FormVersions(VersionNumber);",
            new SqlParameter("@json", SqlSchemaTestHost.Empty));
        await Assert.ThrowsAsync<SqlException>(() => incompatible.Execute(SqlSchemaTestHost.LifecycleMigration));
        Assert.Equal(DBNull.Value, await incompatible.Scalar("SELECT COL_LENGTH(N'dbo.Forms',N'SourceFormId')"));
    }

    [SqlFact]
    public async Task DeriveFromPublishedAndArchivedCopiesSchemaAndRecordsProvenance()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        foreach (var status in new[] { "Published", "Archived" })
        {
            var source = await host.Seed(SqlSchemaTestHost.Complete, status);
            var response = await client.PostAsJsonAsync(DeriveRoute(source), new { sourceVersionId = source.Id });
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var payload = await Json(response);
            Assert.Equal($"/forms/{source.FormId}", response.Headers.Location!.ToString());
            Assert.Equal("Draft", payload["status"]!.GetValue<string>());
            Assert.Equal(2, payload["number"]!.GetValue<int>());
            Assert.Equal(source.Id.ToString(), payload["derivedFromVersionId"]!.GetValue<string>());
            var copy = await ReloadById(host, Guid.Parse(payload["versionId"]!.GetValue<string>()));
            Assert.Equal(source.Id, copy.DerivedFromVersionId);
            Assert.Equal("Draft", copy.Status);
            Assert.Equal(2, copy.VersionNumber);
            Assert.True(JsonNode.DeepEquals(JsonNode.Parse(SqlSchemaTestHost.Complete), JsonNode.Parse(copy.SchemaJson)));
            Assert.Equal(8, copy.RowVersion.Length);
            await AssertUnchanged(host, source);
        }
    }

    [SqlFact]
    public async Task DraftForeignAndMissingSourcesAreRejected()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var draft = await host.Seed();
        await AssertProblem(await client.PostAsJsonAsync(DeriveRoute(draft), new { sourceVersionId = draft.Id }), 409, "invalid_version_state");
        await AssertProblem(await client.PostAsJsonAsync(DeriveRoute(draft), new { sourceVersionId = Guid.NewGuid() }), 404, "version_not_found");
        var foreign = await host.Seed(SqlSchemaTestHost.Complete, "Published");
        await AssertProblem(await client.PostAsJsonAsync(DeriveRoute(foreign), new { sourceVersionId = draft.Id }), 404, "version_not_found");
        await AssertProblem(await client.PostAsJsonAsync($"/forms/{Guid.NewGuid()}/versions", new { sourceVersionId = foreign.Id }), 404, "version_not_found");
        await AssertProblem(await client.PostAsync(DeriveRoute(draft), new StringContent("{}", Encoding.UTF8, "application/json")), 400, "invalid_request");
        await AssertUnchanged(host, draft);
    }

    [SqlFact]
    public async Task SecondDraftIsRejectedAndNumberingIncludesArchived()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var archived = await host.Seed(SqlSchemaTestHost.Complete, "Archived");
        var published = await host.SeedVersion(archived.FormId, 2, "Published", SqlSchemaTestHost.Complete, archived.Id);
        var derived = await client.PostAsJsonAsync(DeriveRoute(published), new { sourceVersionId = published.Id });
        Assert.Equal(HttpStatusCode.Created, derived.StatusCode);
        Assert.Equal(3, (await Json(derived))["number"]!.GetValue<int>());
        var duplicate = await client.PostAsJsonAsync(DeriveRoute(published), new { sourceVersionId = published.Id });
        await AssertProblem(duplicate, 409, "invalid_version_state");
        await using (var context = host.Context())
        {
            Assert.Equal(1, await context.FormVersions.CountAsync(v => v.FormId == published.FormId && v.Status == "Draft"));
        }
    }

    [SqlFact]
    public async Task ConcurrentDerivationsProduceASingleDraft()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var published = await host.Seed(SqlSchemaTestHost.Complete, "Published");
        var responses = await Task.WhenAll(
            client.PostAsJsonAsync(DeriveRoute(published), new { sourceVersionId = published.Id }),
            client.PostAsJsonAsync(DeriveRoute(published), new { sourceVersionId = published.Id }));
        Assert.Equal(1, responses.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.Equal(1, responses.Count(r => r.StatusCode == HttpStatusCode.Conflict));
        await using var context = host.Context();
        var drafts = await context.FormVersions.AsNoTracking()
            .Where(v => v.FormId == published.FormId && v.Status == "Draft").ToListAsync();
        Assert.Single(drafts);
        Assert.Equal(2, drafts[0].VersionNumber);
    }

    [SqlFact]
    public async Task PublishReplacesPreviousPublishedAtomically()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var previous = await host.Seed(SqlSchemaTestHost.Complete, "Published");
        var draft = await host.SeedVersion(previous.FormId, 2, "Draft", SqlSchemaTestHost.Complete, previous.Id);
        var response = await client.PostAsJsonAsync(PublishRoute(draft), RowVersionBody(draft));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await Json(response);
        Assert.Equal("Published", payload["status"]!.GetValue<string>());
        Assert.Equal(previous.Id.ToString(), payload["archivedVersionId"]!.GetValue<string>());
        Assert.NotEqual(Token(draft), payload["rowVersion"]!.GetValue<string>());
        Assert.EndsWith("Z", payload["updatedAt"]!.GetValue<string>());
        var reloadedDraft = await Reload(host, draft);
        var reloadedPrevious = await Reload(host, previous);
        Assert.Equal("Published", reloadedDraft.Status);
        Assert.Equal("Archived", reloadedPrevious.Status);
        Assert.NotEqual(Token(previous), Token(reloadedPrevious));
        Assert.NotNull(reloadedPrevious.UpdatedAt);
        // The promoted Draft cannot be archived or published again with its old token.
        await AssertProblem(await client.PostAsJsonAsync(ArchiveRoute(draft), RowVersionBody(draft)), 409, "invalid_version_state");
        await AssertProblem(await client.PostAsJsonAsync(PublishRoute(previous), RowVersionBody(previous)), 409, "invalid_version_state");
        Assert.Equal("Published", (await Reload(host, draft)).Status);
        Assert.Equal("Archived", (await Reload(host, previous)).Status);
    }

    [SqlFact]
    public async Task PublishReplacesPreviousPublishedWhenDraftKeySortsFirst()
    {
        // Regression: SaveChanges batch order follows primary key order, so a Draft whose
        // key sorts before the current Published is updated first and the filtered unique
        // index would reject the intermediate two-Published state.
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var previous = await host.Seed(SqlSchemaTestHost.Complete, "Published",
            versionId: Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"));
        var draft = await host.SeedVersion(previous.FormId, 2, "Draft", SqlSchemaTestHost.Complete, previous.Id,
            id: Guid.Parse("00000000-0000-0000-0000-000000000001"));

        var response = await client.PostAsJsonAsync(PublishRoute(draft), RowVersionBody(draft));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var reloadedDraft = await Reload(host, draft);
        var reloadedPrevious = await Reload(host, previous);
        Assert.Equal("Published", reloadedDraft.Status);
        Assert.Equal("Archived", reloadedPrevious.Status);
    }

    [SqlFact]
    public async Task PublishPreconditionsRejectEmptyCorruptAndBrokenCoreDocuments()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var empty = await host.Seed();
        var rejected = await client.PostAsJsonAsync(PublishRoute(empty), RowVersionBody(empty));
        await AssertProblem(rejected, 422, "not_publishable");
        await AssertUnchanged(host, empty);

        var corrupt = await host.Seed("{\"schemaVersion\":1,\"sections\":[{}]}");
        await AssertProblem(await client.PostAsJsonAsync(PublishRoute(corrupt), RowVersionBody(corrupt)), 500, "invalid_stored_schema");
        await AssertUnchanged(host, corrupt);

        var source = await host.Seed(SqlSchemaTestHost.Complete, "Published");
        var broken = JsonNode.Parse(SqlSchemaTestHost.Complete)!;
        broken["sections"]![0]!["items"]![1]!["items"]![0]!["variable"] = "Renamed";
        var brokenDraft = await host.SeedVersion(source.FormId, 2, "Draft", broken.ToJsonString(), source.Id);
        await AssertProblem(await client.PostAsJsonAsync(PublishRoute(brokenDraft), RowVersionBody(brokenDraft)), 422, "schema_identity_violation");
        await AssertUnchanged(host, brokenDraft);

        var grouped = await host.Seed(GroupOnlySchema);
        var publishedGrouped = await client.PostAsJsonAsync(PublishRoute(grouped), RowVersionBody(grouped));
        Assert.Equal(HttpStatusCode.OK, publishedGrouped.StatusCode);
        Assert.Equal("Published", (await Json(publishedGrouped))["status"]!.GetValue<string>());
    }

    [SqlFact]
    public async Task ArchiveIsDraftOnlyAndPreservesHistory()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var draft = await host.Seed(SqlSchemaTestHost.Complete);
        var archived = await client.PostAsJsonAsync(ArchiveRoute(draft), RowVersionBody(draft));
        Assert.Equal(HttpStatusCode.OK, archived.StatusCode);
        var payload = await Json(archived);
        Assert.Equal("Archived", payload["status"]!.GetValue<string>());
        Assert.Equal(1, payload["number"]!.GetValue<int>());
        Assert.NotEqual(Token(draft), payload["rowVersion"]!.GetValue<string>());
        var reloaded = await Reload(host, draft);
        Assert.Equal("Archived", reloaded.Status);
        Assert.Equal(1, reloaded.VersionNumber);
        Assert.Equal(SqlSchemaTestHost.Complete, reloaded.SchemaJson);
        Assert.NotNull(reloaded.UpdatedAt);

        var published = await host.Seed(SqlSchemaTestHost.Complete, "Published");
        await AssertProblem(await client.PostAsJsonAsync(ArchiveRoute(published), RowVersionBody(published)), 409, "invalid_version_state");
        await AssertUnchanged(host, published);
        await AssertProblem(await client.PostAsJsonAsync(ArchiveRoute(reloaded), RowVersionBody(reloaded)), 409, "invalid_version_state");
    }

    [SqlFact]
    public async Task StaleTokensAreRejectedForPublishAndArchive()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var draft = await host.Seed(SqlSchemaTestHost.Complete);
        var stale = Token(draft);
        var saved = await client.PutAsJsonAsync(SchemaRoute(draft),
            new JsonObject { ["schema"] = JsonNode.Parse(GroupOnlySchema), ["rowVersion"] = stale });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        await AssertProblem(await client.PostAsJsonAsync(PublishRoute(draft), new JsonObject { ["rowVersion"] = stale }), 409, "version_conflict");
        await AssertProblem(await client.PostAsJsonAsync(ArchiveRoute(draft), new JsonObject { ["rowVersion"] = stale }), 409, "version_conflict");
        var reloaded = await Reload(host, draft);
        Assert.Equal("Draft", reloaded.Status);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(GroupOnlySchema), JsonNode.Parse(reloaded.SchemaJson)));
    }

    [SqlFact]
    public async Task FailedPromotionRollsBackTheArchivedPreviousVersion()
    {
        var failNextSave = new FailingSavedChangesInterceptor();
        await using var host = await SqlSchemaTestHost.Create(interceptor: failNextSave);
        using var client = host.Client;
        var previous = await host.Seed(SqlSchemaTestHost.Complete, "Published");
        var draft = await host.SeedVersion(previous.FormId, 2, "Draft", SqlSchemaTestHost.Complete, previous.Id);
        var previousToken = Token(previous);
        failNextSave.Fail = true;
        var response = await client.PostAsJsonAsync(PublishRoute(draft), RowVersionBody(draft));
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var reloadedPrevious = await Reload(host, previous);
        var reloadedDraft = await Reload(host, draft);
        Assert.Equal("Published", reloadedPrevious.Status);
        Assert.Equal(previousToken, Token(reloadedPrevious));
        Assert.Null(reloadedPrevious.UpdatedAt);
        Assert.Equal("Draft", reloadedDraft.Status);
    }

    [SqlFact]
    public async Task CloneCreatesIndependentFormWithProvenanceAndValidatesSources()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var source = await host.Seed(SqlSchemaTestHost.Complete, "Published");
        var clone = await client.PostAsJsonAsync("/forms/from-version",
            new { name = "Clon", description = "Copia", sourceFormId = source.FormId, sourceVersionId = source.Id });
        Assert.Equal(HttpStatusCode.Created, clone.StatusCode);
        var payload = await Json(clone);
        var newFormId = payload["formId"]!.GetValue<string>();
        Assert.NotEqual(source.FormId.ToString(), newFormId);
        Assert.Equal($"/forms/{newFormId}", clone.Headers.Location!.ToString());
        Assert.Equal("Draft", payload["status"]!.GetValue<string>());
        Assert.Equal(1, payload["number"]!.GetValue<int>());
        await using (var context = host.Context())
        {
            var form = await context.Forms.AsNoTracking().SingleAsync(item => item.Id == Guid.Parse(newFormId));
            Assert.Equal("Clon", form.Name);
            Assert.Equal("Copia", form.Description);
            Assert.Equal(source.FormId, form.SourceFormId);
            Assert.Equal(source.Id, form.SourceVersionId);
            var version = await context.FormVersions.AsNoTracking().SingleAsync(item => item.FormId == form.Id);
            Assert.Equal(1, version.VersionNumber);
            Assert.Equal("Draft", version.Status);
            Assert.Equal(source.Id, version.DerivedFromVersionId);
            Assert.True(JsonNode.DeepEquals(JsonNode.Parse(SqlSchemaTestHost.Complete), JsonNode.Parse(version.SchemaJson)));
            Assert.NotEqual(source.Id, version.Id);
        }
        await AssertUnchanged(host, source);

        var draftSource = await host.Seed();
        await AssertProblem(await client.PostAsJsonAsync("/forms/from-version",
            new { name = "X", description = (string?)null, sourceFormId = draftSource.FormId, sourceVersionId = draftSource.Id }),
            409, "invalid_version_state");
        await AssertProblem(await client.PostAsJsonAsync("/forms/from-version",
            new { name = "X", description = (string?)null, sourceFormId = Guid.NewGuid(), sourceVersionId = source.Id }),
            404, "form_not_found");
        await AssertProblem(await client.PostAsJsonAsync("/forms/from-version",
            new { name = "X", description = (string?)null, sourceFormId = source.FormId, sourceVersionId = Guid.NewGuid() }),
            404, "version_not_found");
        await AssertProblem(await client.PostAsJsonAsync("/forms/from-version",
            new { name = "  ", description = (string?)null, sourceFormId = source.FormId, sourceVersionId = source.Id }),
            400, "invalid_request");
    }

    [SqlFact]
    public async Task InvalidLifecycleBodiesAndForeignVersionsNeverChangeRecords()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var draft = await host.Seed(SqlSchemaTestHost.Complete);
        foreach (var body in new[] { "{", "{}", "null", "[]", "{\"rowVersion\":null}", "{\"rowVersion\":\"AQ==\"}" })
            await AssertProblem(await client.PostAsync(PublishRoute(draft), new StringContent(body, Encoding.UTF8, "application/json")), 400, "invalid_request");
        var extra = RowVersionBody(draft);
        extra["unknown"] = true;
        await AssertProblem(await client.PostAsJsonAsync(PublishRoute(draft), extra), 400, "invalid_request");
        await AssertProblem(await client.PostAsJsonAsync($"/forms/{Guid.NewGuid()}/versions/{draft.Id}/publish", RowVersionBody(draft)), 404, "version_not_found");
        await AssertUnchanged(host, draft);
    }

    [SqlFact]
    public async Task FormDetailOrdersVersionsAndDistinguishesPublicationFromLatest()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var v1 = await host.Seed(SqlSchemaTestHost.Complete, "Archived");
        var v2 = await host.SeedVersion(v1.FormId, 2, "Published", SqlSchemaTestHost.Complete, v1.Id);
        var v3 = await host.SeedVersion(v1.FormId, 3, "Draft", SqlSchemaTestHost.Empty, v2.Id);
        var response = await client.GetAsync($"/forms/{v1.FormId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var versions = (await Json(response))["versiones"]!.AsArray();
        Assert.Equal(new[] { 1, 2, 3 }, versions.Select(item => item!["numeroVersion"]!.GetValue<int>()).ToArray());
        Assert.Equal(new[] { "Archived", "Published", "Draft" },
            versions.Select(item => item!["estado"]!.GetValue<string>()).ToArray());
    }

    private sealed class FailingSavedChangesInterceptor : SaveChangesInterceptor
    {
        public bool Fail { get; set; }
        public override ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData, int resultsExecuted,
            CancellationToken cancellationToken = default)
        {
            if (Fail) throw new InvalidOperationException("Injected failure after transactional writes.");
            return ValueTask.FromResult(resultsExecuted);
        }
    }
}
