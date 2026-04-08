using Carter;
using FormManagementApi.Data;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Features.Forms.GetFormById;

public class GetFormById
{
    public record Version(
        Guid Id,
        int NumeroVersion,
        string Estado,
        DateTime CreatedAt,
        DateTime? UpdatedAt
    );
    
    public record Response(
        Guid Id, 
        string Name,
        string? Description,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        IEnumerable<Version> Versiones
    );
    
    public class Endpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        { 
            app.MapGet("/forms/{id}", async (Guid id, AppDbContext context) =>
            {
                var result = await Handler(id,  context);
                return result;
            })
                .WithTags("Form")
                .Produces<Response>()
                .WithOpenApi();;
        }
    }

    public static async Task<IResult> Handler(Guid id, AppDbContext context)
    {
        // var json = "[{\"id\":\"1\",\"orden\":1,\"titulo\":\"Servicios Basicos\",\"restriccion\":\"\",\"entidad\":\"Hogar\",\"preguntas\":[{\"label\":\"Cantidad Hombres\",\"orden\":1,\"id\":\"CantidadHombres\",\"variable\":\"CantidadHombres\",\"tipo\":\"numeric\",\"min\":0,\"max\":10,\"core\":true},{\"label\":\"Cantidad Mujeres\",\"orden\":1,\"id\":\"CantidadMujeres\",\"variable\":\"CantidadMujeres\",\"tipo\":\"numeric\",\"min\":0,\"max\":10,\"core\":true},{\"label\":\"Total Personas\",\"orden\":1,\"id\":\"TotalPersonas\",\"variable\":\"TotalPersonas\",\"tipo\":\"numeric\",\"min\":0,\"max\":10,\"core\":true}]},{\"id\":\"2\",\"orden\":5,\"titulo\":\"Equipamiento del hogar\",\"restriccion\":\"\",\"entidad\":\"detalleHogar\",\"preguntas\":[{\"tipo\":\"composed\",\"orden\":14,\"label\":\"En el hogar se cuenta con:\",\"core\":true,\"id\":\"111111\",\"preguntasHijas\":[{\"id\":\"TieneTelevision\",\"label\":\"Television\",\"variable\":\"TieneTelevision\",\"tipo\":\"select\",\"options\":[{\"description\":\"Si\",\"value\":\"1\"},{\"description\":\"No\",\"value\":\"2\"},{\"description\":\"No sabe\",\"value\":\"98\"}]},{\"id\":\"TieneTelevisionConCable\",\"label\":\"Television con cable\",\"variable\":\"TieneTelevisionConCable\",\"tipo\":\"select\",\"options\":[{\"description\":\"Si\",\"value\":\"1\"},{\"description\":\"No\",\"value\":\"2\"},{\"description\":\"No sabe\",\"value\":\"98\"}]},{\"id\":\"TieneComputadora\",\"label\":\"Computadora\",\"variable\":\"TieneComputadora\",\"tipo\":\"select\",\"options\":[{\"description\":\"Si\",\"value\":\"1\"},{\"description\":\"No\",\"value\":\"2\"},{\"description\":\"No sabe\",\"value\":\"98\"}]},{\"id\":\"TieneComputadoraConInternet\",\"label\":\"Computadora con conexion a internet\",\"variable\":\"TieneComputadoraConInternet\",\"tipo\":\"select\",\"options\":[{\"description\":\"Si\",\"value\":\"1\"},{\"description\":\"No\",\"value\":\"2\"},{\"description\":\"No sabe\",\"value\":\"98\"}]}]}]},{\"id\":\"3\",\"orden\":1,\"titulo\":\"Dirección\",\"restriccion\":\"\",\"entidad\":\"Vivienda\",\"preguntas\":[{\"id\":\"Calle\",\"label\":\"Calle\",\"orden\":1,\"variable\":\"Calle\",\"tipo\":\"text\",\"maxLength\":30,\"core\":true},{\"label\":\"Entre calle\",\"orden\":1,\"id\":\"EntreCalle\",\"variable\":\"EntreCalle\",\"tipo\":\"text\",\"maxLength\":30,\"core\":true},{\"label\":\"La calle esta asfaltada?\",\"orden\":4,\"id\":\"CallesEstanAsfaltadas\",\"variable\":\"CallesEstanAsfaltadas\",\"tipo\":\"select\",\"core\":true,\"options\":[{\"description\":\"Si\",\"value\":\"1\"},{\"description\":\"No\",\"value\":\"2\"}]}]},{\"id\":\"4\",\"orden\":3,\"titulo\":\"Caracteristicas Miembro del Hogar\",\"restriccion\":\"\",\"entidad\":\"Miembros\",\"preguntas\":[{\"label\":\"Nombres\",\"orden\":1,\"id\":\"Nombre\",\"variable\":\"Nombre\",\"tipo\":\"text\",\"maxLength\":10,\"core\":true},{\"label\":\"Apellidos\",\"orden\":2,\"id\":\"Apellido\",\"variable\":\"Apellidos\",\"tipo\":\"text\",\"maxLength\":10,\"core\":true},{\"label\":\"Edad\",\"orden\":2,\"id\":\"Edad\",\"variable\":\"Edad\",\"tipo\":\"numeric\",\"maxLength\":3,\"range\":115,\"core\":true},{\"label\":\"Nivel\",\"orden\":2,\"id\":\"NivelGradoMasAltoAp\",\"variable\":\"NivelGradoMasAltoAp\",\"tipo\":\"select\",\"core\":true,\"options\":[{\"description\":\"Ninguno\",\"value\":\"0\"},{\"description\":\"Educacion Media\",\"value\":\"1\"},{\"description\":\"Educacion Basica\",\"value\":\"2\"},{\"description\":\"Educacion Basica 3\",\"value\":\"3\"},{\"description\":\"Educacion Basica 4\",\"value\":\"4\"},{\"description\":\"Educacion Basica 5\",\"value\":\"5\"},{\"description\":\"Educacion Basica 6\",\"value\":\"6\"}]},{\"label\":\"Grado\",\"id\":\"GradoMasAlto\",\"orden\":5,\"variable\":\"GradoMasAlto\",\"tipo\":\"selectDependent\",\"dependiente\":\"NivelGradoMasAltoAp\",\"core\":true,\"dependentOptions\":{\"1\":[{\"description\":\"1\",\"value\":1},{\"description\":\"No sabe\",\"value\":98}],\"2\":[{\"description\":\"1\",\"value\":1},{\"description\":\"2\",\"value\":2}],\"3\":[{\"description\":\"1\",\"value\":1},{\"description\":\"2\",\"value\":2},{\"description\":\"3\",\"value\":3}]}}]},{\"id\":\"5\",\"orden\":4,\"titulo\":\"Empleo\",\"restriccion\":\"\",\"entidad\":\"Miembros\",\"preguntas\":[{\"label\":\"La semana pasada, trabajo por lo menos una hroa o realizo alguna actividad por paga o ganancia?\",\"orden\":51,\"id\":\"ActividadesEconomicasSemana\",\"variable\":\"ActividadesEconomicasSemana\",\"tipo\":\"select\",\"core\":true,\"options\":[{\"description\":\"Si\",\"value\":\"1\"},{\"description\":\"No\",\"value\":\"2\"},{\"description\":\"No sabe\",\"value\":\"98\"}]},{\"label\":\"Aunque no trabajo la semna pasada, Tenia algun empleo, negocio o actividad al que volverá?\",\"orden\":52,\"id\":\"NoTrabajoSemanaPasada\",\"variable\":\"NoTrabajoSemanaPasada\",\"tipo\":\"select\",\"core\":true,\"options\":[{\"description\":\"Si\",\"value\":\"1\"},{\"description\":\"No\",\"value\":\"2\"},{\"description\":\"No sabe\",\"value\":\"98\"}]},{\"label\":\"La semana pasada, realizo alguna de las siguientes actividades?\",\"orden\":53,\"id\":\"RealizoTrabajoSemanaPasada\",\"variable\":\"RealizoTrabajoSemanaPasada\",\"tipo\":\"select\",\"core\":true,\"options\":[{\"description\":\"Actividades ......\",\"value\":\"1\"},{\"description\":\"Ninguna\",\"value\":\"2\"}]},{\"label\":\"Que produce o a que actividad se dedica principalmente el establecimiento, empresa o negocio donde trabaja?\",\"orden\":54,\"id\":\"ActividadPrincipalEmpresa\",\"variable\":\"ActividadPrincipalEmpresa\",\"tipo\":\"select\",\"core\":true,\"options\":[{\"description\":\"Agricultura y Ganadería\",\"value\":\"1\"},{\"description\":\"Minería y Cantera\",\"value\":\"2\"},{\"description\":\"Manufactura\",\"value\":\"3\"}]}]}]";
        var form = await context.Forms
            .Where(x => x.Id == id)
            .Select(x =>
                new Response(
                    x.Id,
                    x.Name,
                    x.Description,
                    x.CreatedAt,
                    x.UpdatedAt,
                    x.FormVersions.
                        Select(v => 
                            new Version(
                                v.Id, 
                                v.VersionNumber, 
                                v.Status, 
                                v.CreatedAt, 
                                v.UpdatedAt))
                        .ToList()
                ))
            .FirstOrDefaultAsync();
        
        return Results.Ok(form);
    }
} 