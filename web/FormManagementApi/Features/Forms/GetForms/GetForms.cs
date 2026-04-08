using Carter;
using FormManagementApi.Data;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.GetForms;

public class GetForms
{
    public record Response(
        Guid Id,  
        string Nombre,  
        string? Descripcion, 
        DateTime CreatedAt, 
        DateTime? UpdatedAt, 
        int TotalVersiones, 
        int UltimaVersion,
        Guid UltimaVersionId);
    
    public class Endpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/forms", async (AppDbContext context) =>
            {
                var result = await Handler(context);
                return result;
            })
                .WithTags("Form")
                .Produces<List<Response>>()
                .WithOpenApi();
        }
    }

    public static async Task<IResult> Handler(AppDbContext  context)
    {
        var forms = await context.Forms
            .OrderByDescending(y => y.CreatedAt)
            .Select(x => 
                new Response(
                    x.Id, 
                    x.Name, 
                    x.Description, 
                    x.CreatedAt,  
                    x.UpdatedAt, 
                    x.FormVersions.Count,
                    x.FormVersions.OrderByDescending(y => y.CreatedAt).First().VersionNumber,
                    x.FormVersions.OrderByDescending(y => y.CreatedAt).First().Id
                    ))
            .ToListAsync();
        
        return Results.Ok(forms);
    }
}