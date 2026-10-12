using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using FormManagementApi.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FormManagementApi.Tests;

public sealed class FormHttpContractTests
{
    private static async Task<JsonNode> Json(HttpResponseMessage response) =>
        JsonNode.Parse(await response.Content.ReadAsStringAsync())!;

    private static async Task AssertProblem(HttpResponseMessage response, HttpStatusCode status, string code)
    {
        Assert.Equal(status, response.StatusCode);
        Assert.Equal(code, (await Json(response))["code"]!.GetValue<string>());
    }

    private static async Task AssertNoLegacyKeys(JsonNode node, params string[] paths)
    {
        foreach (var path in paths)
            Assert.True(node[path] is null, $"Legacy key '{path}' must not appear on the wire: {node.ToJsonString()}");
    }

    [SqlFact]
    public async Task GetForms_ReturnsEnglishListKeysAndLatestVersionProjection()
    {
        await using var host = await SqlSchemaTestHost.Create();
        var version = await host.Seed();
        var latest = await host.SeedVersion(version.FormId, 2, "Published");

        using var client = host.Client;
        var response = await client.GetAsync("/forms");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = Assert.IsType<JsonArray>(await Json(response));
        Assert.Single(body);
        var item = body[0]!.AsObject();
        Assert.Equal(version.FormId, item["id"]!.GetValue<Guid>());
        Assert.Equal("Isolated schema test", item["name"]!.GetValue<string>());
        Assert.Null(item["description"]);
        Assert.Equal(2, item["totalVersions"]!.GetValue<int>());
        Assert.Equal(2, item["latestVersion"]!.GetValue<int>());
        Assert.Equal(latest.Id, item["latestVersionId"]!.GetValue<Guid>());
        await AssertNoLegacyKeys(item, "nombre", "descripcion", "totalVersiones", "ultimaVersion", "ultimaVersionId");
    }

    [SqlFact]
    public async Task GetForms_Empty_ReturnsEmptyArray()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;
        var response = await client.GetAsync("/forms");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(Assert.IsType<JsonArray>(await Json(response)));
    }

    [SqlFact]
    public async Task CreateForm_ReturnsCreatedContractWithLocation()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;

        var response = await client.PostAsJsonAsync("/forms", new { name = "Alta directa", description = "Desde contrato" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = (await Json(response)).AsObject();
        var formId = body["formId"]!.GetValue<Guid>();
        var versionId = body["versionId"]!.GetValue<Guid>();
        Assert.Equal(1, body["number"]!.GetValue<int>());
        Assert.Equal($"/forms/{formId}", response.Headers.Location!.ToString());
        await AssertNoLegacyKeys(body, "numeroVersion", "nombre", "descripcion");
        Assert.Equal(new[] { "formId", "number", "versionId" }, body.Select(p => p.Key).Order(StringComparer.Ordinal).ToArray());

        await using var context = host.Context();
        var stored = await context.FormVersions.AsNoTracking().SingleAsync(v => v.Id == versionId);
        Assert.Equal(formId, stored.FormId);
        Assert.Equal("Draft", stored.Status);
    }

    [SqlFact]
    public async Task CreateForm_WithoutDescription_PersistsNullDescription()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;

        var response = await client.PostAsJsonAsync("/forms", new { name = "Sin descripción" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var formId = (await Json(response))!["formId"]!.GetValue<Guid>();

        await using var context = host.Context();
        var form = await context.Forms.AsNoTracking().SingleAsync(f => f.Id == formId);
        Assert.Null(form.Description);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{ \"name\": \"   \" }")]
    [InlineData("{ \"name\": 42 }")]
    [InlineData("{ \"name\": \"ok\", \"description\": 7 }")]
    [InlineData("{ not-json")]
    public async Task CreateForm_InvalidBodies_Return400InvalidRequestWithoutSideEffects(string payload)
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;

        using var content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/forms", content);
        await AssertProblem(response, HttpStatusCode.BadRequest, "invalid_request");

        await using var context = host.Context();
        Assert.Equal(0, await context.Forms.CountAsync());
    }

    [SqlFact]
    public async Task GetFormById_ReturnsDetailWithEnglishKeysAndOrderedVersions()
    {
        await using var host = await SqlSchemaTestHost.Create();
        var v1 = await host.Seed();
        var v2 = await host.SeedVersion(v1.FormId, 2, "Published");
        var v3 = await host.SeedVersion(v1.FormId, 3, "Archived");

        using var client = host.Client;
        var response = await client.GetAsync($"/forms/{v1.FormId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = (await Json(response)).AsObject();
        Assert.Equal(v1.FormId, body["id"]!.GetValue<Guid>());
        Assert.Equal("Isolated schema test", body["name"]!.GetValue<string>());
        Assert.Null(body["description"]);
        await AssertNoLegacyKeys(body, "nombre", "descripcion", "versiones");

        var versions = body["versions"]!.AsArray();
        Assert.Equal(3, versions.Count);
        Assert.Equal(new[] { 1, 2, 3 }, versions.Select(v => v!["number"]!.GetValue<int>()).ToArray());
        Assert.Equal(new[] { "Draft", "Published", "Archived" },
            versions.Select(v => v!["status"]!.GetValue<string>()).ToArray());
        foreach (var item in versions)
        {
            Assert.False(string.IsNullOrEmpty(item!["rowVersion"]!.GetValue<string>()));
            await AssertNoLegacyKeys(item, "numeroVersion", "estado");
        }
    }

    [SqlFact]
    public async Task GetFormById_UnknownId_Returns404FormNotFoundBody()
    {
        await using var host = await SqlSchemaTestHost.Create();
        using var client = host.Client;

        var response = await client.GetAsync($"/forms/{Guid.NewGuid()}");
        await AssertProblem(response, HttpStatusCode.NotFound, "form_not_found");
    }
}
