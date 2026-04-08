using Carter;
using FormManagementApi.Data;
using FormManagementApi.Entities;

namespace FormManagementApi.Features.Forms.CreateForm;

public class CreateForm
{
    public record Response(Guid FormId, Guid VersionId, int NumeroVersion);

    public record Request(string Nombre, string Descripcion);

    public class Endpoint : ICarterModule
    {                           
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapPost("forms", async (Request request, AppDbContext context) =>
            {
                var result = await Handler(request, context);
                return result;
            })
                .WithTags("Form")
                // .Produces<Response>()
                .Produces<Response>(StatusCodes.Status201Created)
                .WithOpenApi();
        }
    }

    public static async Task<IResult> Handler(Request request, AppDbContext context)
    {
        // using var transaction = await context.Database.BeginTransactionAsync();

        var form = new Form() 
        {
            Name = request.Nombre,
            Description = request.Descripcion,
            // User = "fveras",
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.Forms.Add(form);

        var version = new FormVersion()
        {
            Form =  form,
            VersionNumber = 1,
            Status = "Draft",
            SchemaJson = "{}",
            CreatedAt = DateTime.Now,
        };
        context.FormVersions.Add(version);
        
        await context.SaveChangesAsync();
        // await transaction.CommitAsync();

        var response = new Response(
            FormId: form.Id, 
            VersionId: version.Id, 
            NumeroVersion: version.VersionNumber);
        
        return Results.Created($"/api/forms/{response.FormId}", response);
    }
}

// TODO: hacer que el GUID se genere en el codigo y no en la DB 
// TODO: Guardar nuevo campo User en la DB 