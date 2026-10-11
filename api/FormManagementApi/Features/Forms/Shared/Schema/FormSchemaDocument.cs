namespace FormManagementApi.Features.Forms.Shared.Schema;

public sealed record FormSchemaDocument
{
    public required int SchemaVersion { get; init; }
    public required List<SectionNode> Sections { get; init; }
}

public sealed record SectionNode
{
    public required string Id { get; init; }
    public string Type { get; init; } = "section";
    public required string Title { get; init; }
    public string? Description { get; init; }
    public required string Entity { get; init; }
    public required double Order { get; init; }
    public required List<SchemaItem> Items { get; init; }
}

public abstract record SchemaItem
{
    public required string Id { get; init; }
    public required string Type { get; init; }
    public required string Label { get; init; }
    public string? Description { get; init; }
    // JSON integers may be written as 1.0. Validation enforces integral, positive values.
    public required double Order { get; init; }
}

public sealed record GroupNode : SchemaItem
{
    public required List<FieldNode> Items { get; init; }
}

public abstract record FieldNode : SchemaItem
{
    public required string Component { get; init; }
    public required string Variable { get; init; }
    public required bool Core { get; init; }
}

public sealed record TextFieldNode : FieldNode
{
    public TextValidation? Validation { get; init; }
}

public sealed record NumberFieldNode : FieldNode
{
    public NumberValidation? Validation { get; init; }
}

public sealed record StaticSelectNode : FieldNode
{
    public required List<FieldOption> Options { get; init; }
}

public sealed record DependentSelectNode : FieldNode
{
    public required FieldDependency Dependency { get; init; }
    public required Dictionary<string, List<FieldOption>> Map { get; init; }
}

public sealed record FieldOption(string Label, string Value);
public sealed record FieldDependency(string Field);
public sealed record TextValidation(double? MaxLength);
public sealed record NumberValidation(double? Min, double? Max);
public sealed record SchemaIssue(string Path, string Code, string Message);
