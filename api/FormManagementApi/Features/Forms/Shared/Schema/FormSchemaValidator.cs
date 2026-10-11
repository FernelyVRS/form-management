using System.Text.Json;
using System.Text.RegularExpressions;

namespace FormManagementApi.Features.Forms.Shared.Schema;

public static class FormSchemaValidator
{
    public static IReadOnlyList<SchemaIssue> Validate(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var validation = new Validation();
            validation.Document(document.RootElement);
            return validation.Issues;
        }
        catch (JsonException exception)
        {
            return [new SchemaIssue("/", "invalid_json", $"Invalid JSON at {exception.Path ?? "$"}")];
        }
    }

    private sealed class Validation
    {
        public List<SchemaIssue> Issues { get; } = [];
        private readonly HashSet<string> ids = new(StringComparer.Ordinal);
        private readonly Dictionary<string, (JsonElement Node, string Path)> fields = new(StringComparer.Ordinal);
        private readonly List<(JsonElement Node, string Path)> dependents = [];

        private void Error(string path, string code = "invalid_shape") => Issues.Add(new(path.Length == 0 ? "/" : path, code, code));
        private static string Escape(string key) => key.Replace("~", "~0").Replace("/", "~1");

        private bool Object(JsonElement node, string path, string[] required, string[] optional)
        {
            if (node.ValueKind != JsonValueKind.Object) { Error(path); return false; }
            var allowed = new HashSet<string>(required.Concat(optional), StringComparer.Ordinal);
            foreach (var key in required)
                if (!node.TryGetProperty(key, out _)) Error($"{path}/{key}");
            foreach (var property in node.EnumerateObject())
                if (!allowed.Contains(property.Name)) Error($"{path}/{Escape(property.Name)}");
            return required.All(key => node.TryGetProperty(key, out _));
        }

        private void String(JsonElement node, string key, string path, string? pattern = null, bool nonEmpty = true)
        {
            if (!node.TryGetProperty(key, out var value)) return;
            if (value.ValueKind != JsonValueKind.String || (nonEmpty && value.GetString()!.Length == 0) ||
                (pattern != null && !Regex.IsMatch(value.GetString()!, pattern, RegexOptions.CultureInvariant)))
                Error($"{path}/{key}");
        }

        private void Number(JsonElement node, string key, string path, bool positiveInteger = false)
        {
            if (!node.TryGetProperty(key, out var value)) return;
            if (value.ValueKind != JsonValueKind.Number || !value.TryGetDouble(out var number) ||
                !double.IsFinite(number) || (positiveInteger && (number < 1 || Math.Truncate(number) != number)))
                Error($"{path}/{key}");
        }

        private bool Array(JsonElement node, string key, string path, Action<JsonElement, string> visit)
        {
            if (!node.TryGetProperty(key, out var list) || list.ValueKind != JsonValueKind.Array)
            { Error($"{path}/{key}"); return false; }
            var index = 0;
            foreach (var item in list.EnumerateArray()) visit(item, $"{path}/{key}/{index++}");
            return true;
        }

        private void Common(JsonElement node, string path, bool field)
        {
            String(node, "id", path, "^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$");
            String(node, field || node.GetProperty("type").GetString() == "group" ? "label" : "title", path);
            String(node, "description", path, nonEmpty: false);
            Number(node, "order", path, positiveInteger: true);
            if (!field) return;
            String(node, "variable", path, "^[A-Z][A-Za-z0-9]*$");
            if (node.GetProperty("core").ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                Error($"{path}/core");
        }

        public void Document(JsonElement root)
        {
            if (!Object(root, "", ["schemaVersion", "sections"], [])) return;
            var version = root.GetProperty("schemaVersion");
            if (version.ValueKind != JsonValueKind.Number || !version.TryGetDouble(out var value) || value != 1)
                Error("/schemaVersion");
            Array(root, "sections", "", Section);
            if (Issues.Count != 0) return;
            Semantic(root);
        }

        private void Section(JsonElement node, string path)
        {
            if (!Object(node, path, ["id", "type", "title", "entity", "order", "items"], ["description"])) return;
            if (node.GetProperty("type").ValueKind != JsonValueKind.String || node.GetProperty("type").GetString() != "section")
            { Error($"{path}/type"); return; }
            Common(node, path, false);
            String(node, "entity", path);
            Array(node, "items", path, (item, itemPath) => Item(item, itemPath, true));
        }

        private void Item(JsonElement node, string path, bool allowGroup)
        {
            if (node.ValueKind != JsonValueKind.Object || !node.TryGetProperty("type", out var type) || type.ValueKind != JsonValueKind.String)
            { Error(path); return; }
            if (type.GetString() == "group" && allowGroup)
            {
                if (!Object(node, path, ["id", "type", "label", "order", "items"], ["description"])) return;
                Common(node, path, false);
                Array(node, "items", path, (item, itemPath) => Item(item, itemPath, false));
                return;
            }
            if (type.GetString() != "field" || !node.TryGetProperty("component", out var component) || component.ValueKind != JsonValueKind.String)
            { Error(path); return; }
            var extra = component.GetString() switch
            {
                "text" or "number" => new[] { "description", "validation" },
                "select" => ["description", "options", "dependency", "map"],
                _ => null
            };
            if (extra == null) { Error($"{path}/component"); return; }
            if (!Object(node, path, ["id", "type", "component", "variable", "label", "order", "core"], extra)) return;
            Common(node, path, true);
            if (component.GetString() == "select") { Select(node, path); return; }
            if (!node.TryGetProperty("validation", out var validation)) return;
            if (component.GetString() == "text")
            {
                if (Object(validation, $"{path}/validation", [], ["maxLength"]))
                    Number(validation, "maxLength", $"{path}/validation", positiveInteger: true);
            }
            else if (Object(validation, $"{path}/validation", [], ["min", "max"]))
            {
                Number(validation, "min", $"{path}/validation");
                Number(validation, "max", $"{path}/validation");
            }
        }

        private void Select(JsonElement node, string path)
        {
            var hasOptions = node.TryGetProperty("options", out _);
            var hasDependency = node.TryGetProperty("dependency", out var dependency);
            var hasMap = node.TryGetProperty("map", out var map);
            if (hasOptions && !hasDependency && !hasMap) { Options(node.GetProperty("options"), $"{path}/options"); return; }
            if (hasOptions || !hasDependency || !hasMap) { Error(path); return; }
            if (Object(dependency, $"{path}/dependency", ["field"], []))
                String(dependency, "field", $"{path}/dependency", "^[A-Z][A-Za-z0-9]*$");
            if (map.ValueKind != JsonValueKind.Object) { Error($"{path}/map"); return; }
            foreach (var property in map.EnumerateObject()) Options(property.Value, $"{path}/map/{Escape(property.Name)}");
        }

        private void Options(JsonElement list, string path)
        {
            if (list.ValueKind != JsonValueKind.Array) { Error(path); return; }
            var index = 0;
            foreach (var item in list.EnumerateArray())
            {
                var itemPath = $"{path}/{index++}";
                if (!Object(item, itemPath, ["label", "value"], [])) continue;
                String(item, "label", itemPath);
                String(item, "value", itemPath);
            }
        }

        private void Semantic(JsonElement root)
        {
            Orders(root.GetProperty("sections"), "/sections");
            var index = 0;
            foreach (var section in root.GetProperty("sections").EnumerateArray())
            {
                var path = $"/sections/{index++}";
                Identity(section, path);
                Orders(section.GetProperty("items"), $"{path}/items");
                var itemIndex = 0;
                foreach (var item in section.GetProperty("items").EnumerateArray())
                {
                    var itemPath = $"{path}/items/{itemIndex++}";
                    if (item.GetProperty("type").GetString() == "field") Field(item, itemPath);
                    else
                    {
                        Identity(item, itemPath);
                        Orders(item.GetProperty("items"), $"{itemPath}/items");
                        var childIndex = 0;
                        foreach (var child in item.GetProperty("items").EnumerateArray()) Field(child, $"{itemPath}/items/{childIndex++}");
                    }
                }
            }
            foreach (var (node, path) in dependents)
            {
                var target = node.GetProperty("dependency").GetProperty("field").GetString()!;
                if (!fields.TryGetValue(target, out var source) || source.Node.GetProperty("component").GetString() != "select")
                { Error($"{path}/dependency/field", "invalid_dependency"); continue; }
                var values = PossibleValues(source.Node);
                foreach (var key in node.GetProperty("map").EnumerateObject())
                    if (!values.Contains(key.Name)) Error($"{path}/map/{Escape(key.Name)}", "invalid_map_key");
            }
            var completed = new HashSet<string>(StringComparer.Ordinal);
            foreach (var (node, path) in dependents)
            {
                var chain = new HashSet<string>(StringComparer.Ordinal);
                var current = node;
                while (current.TryGetProperty("dependency", out var dependency))
                {
                    var variable = current.GetProperty("variable").GetString()!;
                    if (completed.Contains(variable)) break;
                    if (!chain.Add(variable)) { Error($"{path}/dependency/field", "dependency_cycle"); break; }
                    if (!fields.TryGetValue(dependency.GetProperty("field").GetString()!, out var next)) break;
                    current = next.Node;
                }
                completed.UnionWith(chain);
            }
        }

        private void Identity(JsonElement node, string path)
        {
            if (!ids.Add(node.GetProperty("id").GetString()!)) Error($"{path}/id", "duplicate_id");
        }

        private void Orders(JsonElement list, string path)
        {
            var values = list.EnumerateArray().Select(node => node.GetProperty("order").GetDouble()).ToArray();
            var distinct = values.ToHashSet();
            for (var index = 0; index < values.Length; index++)
                if (distinct.Count != values.Length || values[index] > values.Length) Error($"{path}/{index}/order", "invalid_order");
        }

        private void UniqueOptions(JsonElement list, string path)
        {
            var values = new HashSet<string>(StringComparer.Ordinal);
            var index = 0;
            foreach (var item in list.EnumerateArray())
            {
                if (!values.Add(item.GetProperty("value").GetString()!)) Error($"{path}/{index}/value", "duplicate_option");
                index++;
            }
        }

        private void Field(JsonElement node, string path)
        {
            Identity(node, path);
            var variable = node.GetProperty("variable").GetString()!;
            if (!fields.TryAdd(variable, (node, path))) Error($"{path}/variable", "duplicate_variable");
            if (node.GetProperty("component").GetString() == "number" && node.TryGetProperty("validation", out var validation) &&
                validation.TryGetProperty("min", out var min) && validation.TryGetProperty("max", out var max) && min.GetDouble() > max.GetDouble())
                Error($"{path}/validation", "invalid_bounds");
            if (node.GetProperty("component").GetString() != "select") return;
            if (node.TryGetProperty("options", out var options)) UniqueOptions(options, $"{path}/options");
            else
            {
                dependents.Add((node, path));
                foreach (var property in node.GetProperty("map").EnumerateObject())
                    UniqueOptions(property.Value, $"{path}/map/{Escape(property.Name)}");
            }
        }

        private static HashSet<string> PossibleValues(JsonElement node)
        {
            var lists = node.TryGetProperty("options", out var options)
                ? new[] { options }
                : node.GetProperty("map").EnumerateObject().Select(property => property.Value);
            return lists.SelectMany(list => list.EnumerateArray()).Select(option => option.GetProperty("value").GetString()!).ToHashSet(StringComparer.Ordinal);
        }
    }
}
