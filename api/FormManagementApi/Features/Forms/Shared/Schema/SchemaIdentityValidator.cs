namespace FormManagementApi.Features.Forms.Shared.Schema;

public static class SchemaIdentityValidator
{
    public static IReadOnlyList<SchemaIssue> Validate(
        FormSchemaDocument baseline, FormSchemaDocument proposed, FormSchemaDocument? source)
    {
        var issues = new List<SchemaIssue>();
        var current = Fields(proposed).ToDictionary(item => item.Field.Id, StringComparer.Ordinal);
        foreach (var (field, _) in Fields(baseline))
            if (current.TryGetValue(field.Id, out var retained) && retained.Field.Variable != field.Variable)
                issues.Add(new($"{retained.Path}/variable", "immutable_variable", "External variable cannot be changed for an existing field ID."));

        if (source == null) return issues;
        foreach (var (field, path) in Fields(source).Where(item => item.Field.Core))
        {
            if (!current.TryGetValue(field.Id, out var retained))
                issues.Add(new(path, "missing_core_field", $"Source core field {field.Id} must remain in the derived schema."));
            else if (retained.Field.Variable != field.Variable || !retained.Field.Core)
                issues.Add(new(retained.Path, "changed_core_field", "Source core identity and flag must be preserved."));
        }
        return issues;
    }

    private static IEnumerable<(FieldNode Field, string Path)> Fields(FormSchemaDocument document)
    {
        for (var sectionIndex = 0; sectionIndex < document.Sections.Count; sectionIndex++)
        {
            var section = document.Sections[sectionIndex];
            for (var itemIndex = 0; itemIndex < section.Items.Count; itemIndex++)
            {
                var path = $"/sections/{sectionIndex}/items/{itemIndex}";
                if (section.Items[itemIndex] is FieldNode field) yield return (field, path);
                else if (section.Items[itemIndex] is GroupNode group)
                    for (var fieldIndex = 0; fieldIndex < group.Items.Count; fieldIndex++)
                        yield return (group.Items[fieldIndex], $"{path}/items/{fieldIndex}");
            }
        }
    }
}
