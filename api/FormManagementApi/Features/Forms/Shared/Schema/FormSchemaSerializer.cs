using System.Text.Json;
using System.Text.Json.Serialization;

namespace FormManagementApi.Features.Forms.Shared.Schema;

public sealed class FormSchemaException(IReadOnlyList<SchemaIssue> issues) : Exception("Invalid form schema")
{
    public IReadOnlyList<SchemaIssue> Issues { get; } = issues;
}

public static class FormSchemaSerializer
{
    private static readonly JsonSerializerOptions Options = CreateOptions();

    private static JsonSerializerOptions CreateOptions()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = false,
            UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
        options.Converters.Add(new ItemConverter());
        options.Converters.Add(new FieldConverter());
        return options;
    }

    public static FormSchemaDocument Parse(string json)
    {
        var issues = FormSchemaValidator.Validate(json);
        if (issues.Count != 0) throw new FormSchemaException(issues);
        // The validator permits the JSON integer representation 1.0 for schemaVersion.
        var root = System.Text.Json.Nodes.JsonNode.Parse(json)!;
        root["schemaVersion"] = 1;
        return root.Deserialize<FormSchemaDocument>(Options)!;
    }

    public static string Serialize(FormSchemaDocument document)
    {
        var json = JsonSerializer.Serialize(document, Options);
        var issues = FormSchemaValidator.Validate(json);
        if (issues.Count != 0) throw new FormSchemaException(issues);
        return json;
    }

    private static SchemaItem ReadItem(JsonElement node, JsonSerializerOptions options)
    {
        if (node.GetProperty("type").GetString() == "group")
            return node.Deserialize<GroupNode>(options)!;

        return node.GetProperty("component").GetString() switch
        {
            "text" => node.Deserialize<TextFieldNode>(options)!,
            "number" => node.Deserialize<NumberFieldNode>(options)!,
            "select" when node.TryGetProperty("options", out _) => node.Deserialize<StaticSelectNode>(options)!,
            "select" => node.Deserialize<DependentSelectNode>(options)!,
            _ => throw new JsonException("Unsupported component")
        };
    }

    private sealed class ItemConverter : JsonConverter<SchemaItem>
    {
        public override SchemaItem Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options)
        {
            using var json = JsonDocument.ParseValue(ref reader);
            return ReadItem(json.RootElement, options);
        }

        public override void Write(Utf8JsonWriter writer, SchemaItem value, JsonSerializerOptions options) =>
            JsonSerializer.Serialize(writer, value, value.GetType(), options);
    }

    private sealed class FieldConverter : JsonConverter<FieldNode>
    {
        public override FieldNode Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options)
        {
            using var json = JsonDocument.ParseValue(ref reader);
            return (FieldNode)ReadItem(json.RootElement, options);
        }

        public override void Write(Utf8JsonWriter writer, FieldNode value, JsonSerializerOptions options) =>
            JsonSerializer.Serialize(writer, value, value.GetType(), options);
    }
}
