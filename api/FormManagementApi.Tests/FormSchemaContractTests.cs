using System.Text.Json;
using System.Text.Json.Nodes;
using FormManagementApi.Features.Forms.Shared.Schema;
using Xunit;

namespace FormManagementApi.Tests;

public sealed class FormSchemaContractTests
{
    private static readonly string Root = Path.Combine(AppContext.BaseDirectory, "Contracts");

    public static IEnumerable<object[]> Fixtures()
    {
        using var json = JsonDocument.Parse(File.ReadAllText(Path.Combine(Root, "fixtures.json")));
        foreach (var fixture in json.RootElement.EnumerateArray())
            yield return [fixture.GetProperty("name").GetString()!, fixture.GetRawText()];
    }

    private static string Materialize(JsonElement fixture)
    {
        var file = fixture.TryGetProperty("file", out var name) ? name.GetString()! : "examples/complete.json";
        var document = JsonNode.Parse(File.ReadAllText(Path.Combine(Root, file)))!;
        if (!fixture.TryGetProperty("changes", out var changes)) return document.ToJsonString();
        foreach (var change in changes.EnumerateArray())
        {
            var path = change.GetProperty("path").GetString()!;
            var value = change.TryGetProperty("value", out var item) ? JsonNode.Parse(item.GetRawText()) : null;
            if (path.Length == 0) { document = value!; continue; }
            var keys = path[1..].Split('/');
            var parent = document;
            foreach (var key in keys[..^1]) parent = parent is JsonArray ? parent[int.Parse(key)]! : parent[key]!;
            if (change.TryGetProperty("remove", out var remove) && remove.GetBoolean()) parent.AsObject().Remove(keys[^1]);
            else if (parent is JsonArray) parent[int.Parse(keys[^1])] = value;
            else parent[keys[^1]] = value;
        }
        return document.ToJsonString();
    }

    [Theory]
    [MemberData(nameof(Fixtures))]
    public void SharedFixtureAcceptanceAndRoundTrip(string name, string fixtureJson)
    {
        using var fixture = JsonDocument.Parse(fixtureJson);
        var json = Materialize(fixture.RootElement);
        var issues = FormSchemaValidator.Validate(json);
        var valid = fixture.RootElement.GetProperty("valid").GetBoolean();
        Assert.True(valid == (issues.Count == 0), $"{name}: {JsonSerializer.Serialize(issues)}");
        if (!valid)
        {
            Assert.All(issues, issue => { Assert.StartsWith("/", issue.Path); Assert.NotEmpty(issue.Code); });
            Assert.Throws<FormSchemaException>(() => FormSchemaSerializer.Parse(json));
            return;
        }
        var parsed = FormSchemaSerializer.Parse(json);
        var serialized = FormSchemaSerializer.Serialize(parsed);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(json), JsonNode.Parse(serialized)), name);
        Assert.Empty(FormSchemaValidator.Validate(serialized));
    }

    [Theory]
    [InlineData("not JSON")]
    [InlineData("null")]
    [InlineData("{\"schemaVersion\": 1, \"sections\": null}")]
    public void MalformedInputReturnsControlledErrors(string json) => Assert.NotEmpty(FormSchemaValidator.Validate(json));
}
