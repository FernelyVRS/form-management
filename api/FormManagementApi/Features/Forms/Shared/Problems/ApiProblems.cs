namespace FormManagementApi.Features.Forms.Shared.Problems;

public static class ApiProblems
{
    public static IResult Create(int status, string code) =>
        Results.Problem(
            statusCode: status,
            title: code,
            extensions: new Dictionary<string, object?> { ["code"] = code });
}
